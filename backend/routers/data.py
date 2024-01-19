from fastapi import APIRouter
import pandas as pd

router = APIRouter(prefix="/data", tags=["router"])


@router.get("/")
def read_data(
    metric: int,
    level: str,
    year: int,
):
    data = pd.read_parquet("data/data.parquet")
    places = pd.read_csv("data/places.csv")

    data = data.loc[(data["kodukaz"] == metric) & (data["rok"] == year)]

    match level.lower():
        case "okresy":
            merged_df = pd.merge(data, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["okres_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            data = merged_df.to_json(orient="records")
        case "obce":
            data = data[["koduzemi", "hodnota"]]
            data.columns = ["uzemi_id", "hodnota"]
            data = data.to_json(orient="records")
        case "kraje":
            merged_df = pd.merge(data, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["kraj_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            print(len(merged_df))
            data = merged_df.to_json(orient="records")
        case _:
            raise ValueError("Unknown level")
        
    return data