from fastapi import APIRouter, HTTPException
import pandas as pd
import json

router = APIRouter(prefix="/data", tags=["Data"])

data_df = pd.read_parquet("data/data.parquet")

@router.get("/")
def read_data(
    metric: int,
    level: str,
    year: int,
):
    places = pd.read_csv("data/places.csv")

    data_df = data_df.loc[(data_df["kodukaz"] == metric) & (data_df["rok"] == year)]

    match level.lower():
        case "okresy":
            merged_df = pd.merge(data_df, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["okres_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            data_df = merged_df.to_json(orient="records")
        case "obce":
            data_df = data_df[["koduzemi", "hodnota"]]
            data_df.columns = ["uzemi_id", "hodnota"]
            data_df = data_df.to_json(orient="records")
        case "kraje":
            merged_df = pd.merge(data_df, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["kraj_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            data_df = merged_df.to_json(orient="records")
        case _:
            raise HTTPException(status_code=404, detail="Unknown level. Must be one of: okresy, obce, kraje")
    return data_df

@router.get("/ranges/{metricId}")
def get_rozsahy(metricId: int):
    data_df = pd.read_parquet("data/data.parquet")
    ukazatel = data_df.loc[data_df["kodukaz"] == metricId]
    rocniky = ukazatel["rok"].unique()
    rocniky.sort()
    rocniky = rocniky.tolist()
    res = {
        "min": min(rocniky),
        "max": max(rocniky)
    }
    return res