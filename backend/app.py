import numpy as np
import torch
import os
import time
import matplotlib.pyplot as plt

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
import json

from typing import Annotated
from pydantic import BaseModel

import pickle
import base64

from PIL import Image
import io

# for the pytorch model
from models.lenet import LeNet

VALID_MODEL_TYPES = ['lenet', 'logistic_regression', 'random_forest']

logging=False

def load_model(model_path: str, model_type=None):
    if model_type not in VALID_MODEL_TYPES:
        raise ValueError(f"Invalid model type: {model_type}")

    if model_type == 'lenet':
        # not going to bother with GPU. I experimented a little and the time to move the data to the GPU for every single prediction is not worth it
        model = LeNet()
        model.load_state_dict(torch.load(model_path))
        model.eval()

    elif model_type == 'logistic_regression' or model_type == 'random_forest':
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
    
    return model

def get_image_from_base64_string(base64_string: str):  
    png_data = base64.b64decode(base64_string.replace(' ', '+')) # this took a disgusting amount of time to figure out

    image = Image.open(io.BytesIO(png_data))

    return image


# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    with open('backend/app_parameters.json', 'r') as f:
        args = json.load(f)
    
    lr_model = load_model(args['logistic_regression_model_path'], model_type='logistic_regression')
    rf_model = load_model(args['random_forest_model_path'], model_type='random_forest')
    lenet_model = load_model(args['lenet_model_path'], model_type='lenet')

    app.state.lr_model = lr_model
    app.state.rf_model = rf_model
    app.state.lenet_model = lenet_model

    yield

    # put any cleanup code here (stuff to do right before the app shuts down)

app = FastAPI(lifespan=lifespan)

# this makes it so that the frontend can access the API
origins = [
    f"http://127.0.0.1:{os.environ['FRONTEND_PORT']}",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class MNISTPredictionResponse(BaseModel):
    """
    A response model for an MNIST prediction
    """
    predictions: dict = {}

@app.get("/")
async def root():
    return {"message": "Hello World"}



@app.post("/predict", response_model=MNISTPredictionResponse, status_code=200)
async def predict(image_base64_string: Annotated[str | None, Query()] = None) -> MNISTPredictionResponse:
    """
    Make a prediction for a given MNIST Image
    """
    if logging:
        with open('logs/backend_base64.log', 'a') as f:
            f.write(image_base64_string + '\n')

    if image_base64_string is not None:
        # make predictions on with Lr and RF models
        image = get_image_from_base64_string(image_base64_string)

        # get as a numpy array
        small_img = np.array(image.resize((28, 28)))

        # we only need the black/white channel
        x = small_img[:, :, 3]

        # transform the image to a vector
        x = x.flatten()

        # invert the colors
        x = 255 - x

        # make predictions
        lr_probabilities = app.state.lr_model.predict_proba([x])[0]   
        rf_probabilities = app.state.rf_model.predict_proba([x])[0]

        # make predictions with the LeNet model

        small_image_pt = torch.tensor(x).float().view(1, 1, 28, 28)

        with torch.no_grad():
            lenet_probabilities = torch.nn.functional.softmax(app.state.lenet_model(small_image_pt), dim=1).numpy()[0]

        return MNISTPredictionResponse(predictions={'lr': {label: prob for label, prob in zip(app.state.lr_model.classes_.tolist(), lr_probabilities)},
                                                    'rf': {label: prob for label, prob in zip(app.state.rf_model.classes_.tolist(), rf_probabilities)},
                                                    'lenet': {label: prob for label, prob in enumerate(lenet_probabilities.tolist())}})
                                   
    return MNISTPredictionResponse(predictions={'lr': {i: 0 for i in range(10)},
                                                    'rf': {i: 0 for i in range(10)},
                                                    'lenet': {i: 0 for i in range(10)}})
