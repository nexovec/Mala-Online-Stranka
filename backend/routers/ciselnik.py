from fastapi import APIRouter
import pandas as pd

router = APIRouter(prefix="/cislelnik", tags=["Číselníky"])


@router.get("/metrics")
def get_metrics():
    
    df = pd.read_csv("data/cis_ukazatelu.csv")
    df = df[["kodukaz", "nazev"]]
    df.columns = ["id", "nazev"]

    data = df.to_dict("records")
    
    return data