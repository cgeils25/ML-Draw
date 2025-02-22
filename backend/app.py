import numpy as np
import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
import json

from typing import Annotated
from pydantic import BaseModel

import pickle

def load_model(model_path: str):
    pass

# FastAPI app
@asynccontextmanager
async def lifespan(app: FastAPI):
    with open('backend/app_parameters.json', 'r') as f:
        args = json.load(f)
    
    model = load_model(args['model_path'])

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
async def predict() -> MNISTPredictionResponse:
    """
    Make a prediction for a given MNIST Image
    """
    return MNISTPredictionResponse(predictions={i: np.random.rand() for i in range(10)})
