from io import BytesIO, StringIO
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
    places = None
    match level.casefold().strip():
        case "okresy":
            places = places_df[["okres_id", "okres_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case "obce":
            places = places_df[["obec_id", "obec_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case "kraje":
            places = places_df[["kraj_id", "kraj_name"]]
            places.columns = ["id", "nazev"]
            places = places.drop_duplicates()
        case _:
            raise HTTPException(
                status_code=500,
                detail="Unknown level. Must be one of: okresy, obce, kraje",
            )

    return places.to_dict("records")


@router.get("/getUzemiInfoById/")
def get_places_by_id(id: int, level: str):
    match level.casefold().strip():
        case "okresy":
            place = places_df.loc[places_df["okres_id"] == id]
            if id == 3100:
                return place.to_dict("records")

            return place.to_dict("records")[0]
        case "obce":
            place = places_df.loc[places_df["obec_id"] == id]
            return place.to_dict("records")[0]
        case "kraje":
            place = places_df.loc[places_df["kraj_id"] == id]
            if id == 19:
                return place.to_dict("records")

            return place.to_dict("records")[0]
        case _:
            raise HTTPException(
                status_code=500,
                detail="Unknown level. Must be one of: okresy, obce, kraje",
            )
