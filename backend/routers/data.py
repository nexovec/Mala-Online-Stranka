from fastapi import APIRouter, Form
import pandas as pd

router = APIRouter(prefix="/data", tags=["router"])


@router.get("/")
def read_root(
    metric: int,
    year: int,
):
    return {"Hello": "Router"}


@router.get("/metrics")
def get_metrics():
    
    df = pd.read_csv("data/cis_ukazatelu.csv")
    df = df[["kodukaz", "nazev"]]
    df.columns = ["id", "nazev"]

    data = df.to_dict("records")
    
    return data