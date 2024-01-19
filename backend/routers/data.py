from fastapi import APIRouter, Form
import pandas as pd

router = APIRouter(prefix="/data", tags=["router"])


@router.get("/")
def read_root(
    metric: int,
    level: str,
    year: int,
):
    data = pd.read_csv(f"data/data_{year}.csv")

    data = data.loc[data["kodukaz"] == metric]
    data = data[["koduzemi", "hodnota "]]

    data = data.to_json(orient="records")

    data


@router.get("/metrics")
def get_metrics():
    
    df = pd.read_csv("data/cis_ukazatelu.csv")
    df = df[["kodukaz", "nazev"]]
    df.columns = ["id", "nazev"]

    data = df.to_dict("records")
    
    return data