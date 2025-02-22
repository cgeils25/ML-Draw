import numpy as np
import os
import time

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

logging=False

def load_model(model_path: str):
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
    
    model = load_model(args['model_path'])

    app.state.model = model

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
        
        image = get_image_from_base64_string(image_base64_string)

        small_img = np.array(image.resize((28, 28)))

        x = small_img[:, :, 3]

        x = x.flatten()

        x = 255 - x

        prediction = app.state.model.predict_proba([x])

        return MNISTPredictionResponse(predictions={i: prediction[0][i] for i in range(10)})

    return MNISTPredictionResponse(predictions={i: 0 for i in range(10)})
