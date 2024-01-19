from fastapi import APIRouter, HTTPException
import pandas as pd

router = APIRouter(prefix="/ciselnik", tags=["Číselníky"])

places_df = pd.read_csv("data/places.csv")
ukazatele_df = pd.read_csv("data/cis_ukazatelu.csv")

@router.get("/metrics")
def get_metrics():
    df = ukazatele_df[["kodukaz", "nazev"]]
    df.columns = ["id", "nazev"]

    data = df.to_dict("records")
    return data


@router.get("/places/{level}")
def get_places(level: str):
    match level.lower():
        case "okresy":
            places = places_df[["okres_id", "okres_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case "obce":
            places = places[["obec_id", "obec_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case "kraje":
            places = places[["kraj_id", "kraj_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case _:
            raise HTTPException(status_code=404, detail="Unknown level. Must be one of: okresy, obce, kraje")

    data = places.to_json("records")

    return data