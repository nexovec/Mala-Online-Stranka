from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import json
import plotly.express as px
import polars as pl
import requests
import tempfile

router = APIRouter(prefix="/data", tags=["Data"])

data_df = pd.read_parquet("data/data.parquet").dropna(axis=1, how="all")
pocet_obyvatel = pd.read_csv("data/pocet_obyvatel.csv")
ukazatele = pl.read_csv("data/cis_ukazatelu.csv")
uzemi = pl.read_csv("data/cis_uzemi.csv")
places = pd.read_csv("data/places.csv")


@router.get("/")
def read_data(
    metric: int,
    level: str,
    year: int,
):
    df = data_df.loc[(data_df["kodukaz"] == metric) & (data_df["rok"] == year)]

    match level.lower():
        case "okresy":
            merged_df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["okres_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            df = merged_df.to_json(orient="records")
        case "obce":
            df = df[["koduzemi", "hodnota"]]
            df.columns = ["uzemi_id", "hodnota"]
            df = df.to_json(orient="records")
        case "kraje":
            merged_df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            merged_df = merged_df[["kraj_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            df = merged_df.to_json(orient="records")
        case _:
            raise HTTPException(
                status_code=404,
                detail="Unknown level. Must be one of: okresy, obce, kraje",
            )

    return df


@router.get("/ranges/{metricId}")
def get_rozsahy(metricId: int):
    data_df = pd.read_parquet("data/data.parquet")
    ukazatel = data_df.loc[data_df["kodukaz"] == metricId]
    rocniky = ukazatel["rok"].unique()
    rocniky.sort()
    rocniky = rocniky.tolist()
    res = {"min": min(rocniky), "max": max(rocniky)}

    return res


def get_yearly_matrices(year):
    lf = pl.scan_ipc(f"data/uzemnistatsbyyears/{str(year)}.arrow", memory_map=True)

    return lf


def get_uzemi_matrices(uzemi):
    lf = pl.scan_ipc(f"data/yearlystatsbyuzemi/{str(uzemi)}.arrow", memory_map=True)

    return lf


@router.get("/plotlygraph")
def get_plotly_graph(place: int, metric: int, level: str):
    df = data_df[["rok", "kodukaz", "koduzemi", "hodnota"]]

    df = df.loc[df["kodukaz"] == metric]

    match level.lower():
        case "kraje":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df.loc[df["kraj_id"] == place]
            df = df[["rok", "kodukaz", "kraj_id", "hodnota"]]
            df = df.groupby(["rok", "kodukaz", "kraj_id"]).sum().reset_index()
        case "okresy":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df.loc[df["okres_id"] == place]
            df = df[["rok", "kodukaz", "okres_id", "hodnota"]]
            df = df.groupby(["rok", "kodukaz", "okres_id"]).sum().reset_index()
        case "obce":
            df = df[["rok", "kodukaz", "koduzemi", "hodnota"]]
        case _:
            raise HTTPException(
                status_code=404,
                detail="Unknown level. Must be one of: okresy, obce, kraje",
            )

    fig = px.line(
        df,
        x="rok",
        y="hodnota",
    )

    return fig.to_json()


@router.get("/spider")
def get_spider(
    place: int,
    level: str,
    year: int,
):
    df = data_df[["rok", "kodukaz", "koduzemi", "hodnota"]]

    df = df.loc[df["rok"] == year]

    match level.lower():
        case "kraje":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df[["rok", "kodukaz", "kraj_id", "hodnota"]]
            df = df.groupby(["rok", "kodukaz", "kraj_id"]).sum().reset_index()
            id_name = "kraj_id"
        case "okresy":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df[["rok", "kodukaz", "okres_id", "hodnota"]]
            df = df.groupby(["rok", "kodukaz", "okres_id"]).sum().reset_index()
            id_name = "okres_id"
        case "obce":
            df = df[["rok", "kodukaz", "koduzemi", "hodnota"]]
            id_name = "koduzemi"

    vol_cas = [141434, 141432, 600808, 600806]
    vol_casdf = df.loc[df["kodukaz"].isin(vol_cas)]
    vol_score = vol_casdf.loc[vol_casdf[id_name] == place, "hodnota"].sum()
    vol_score = vol_score / vol_casdf["hodnota"].max()
    vol_score = (
        vol_score
        / pocet_obyvatel.loc[pocet_obyvatel[id_name] == place, "hodnota"].values[0]
    )
    # 141434 - kulturni a osvetova plocha
    # 141432 - sportoviste a rekrea. plocha
    # 600808 - hriste
    # 600806 - koupaliste

    priroda = [141000, 141431]
    priroda_df = df.loc[df["kodukaz"].isin(priroda)]
    prir_score = priroda_df.loc[priroda_df[id_name] == place, "hodnota"].sum()
    prir_score = prir_score / priroda_df["hodnota"].max()
    prir_score = (
        prir_score
        / pocet_obyvatel.loc[pocet_obyvatel[id_name] == place, "hodnota"].values[0]
    )
    # lesní půda
    # zeleň

    vzdelani = [40300, 40590]
    vzdelani_df = df.loc[df["kodukaz"].isin(vzdelani)]
    vzdelani_score = vzdelani_df.loc[vzdelani_df[id_name] == place, "hodnota"].sum()
    vzdelani_score = vzdelani_score / vzdelani_df["hodnota"].max()
    vzdelani_score = (
        vzdelani_score
        / pocet_obyvatel.loc[pocet_obyvatel[id_name] == place, "hodnota"].values[0]
    )
    # materske skoly
    # zakladni skoly

    bydleni = [402120, 250260, 410713, 420713]
    bydleni_df = df.loc[df["kodukaz"].isin(bydleni)]
    bydleni_score = bydleni_df.loc[bydleni_df[id_name] == place, "hodnota"].sum()
    bydleni_score = bydleni_score / bydleni_df["hodnota"].max()
    bydleni_score = (
        bydleni_score
        / pocet_obyvatel.loc[pocet_obyvatel[id_name] == place, "hodnota"].values[0]
    )
    # byty

    zdravotnictvi = [70300, 71000, 70200]
    zdravotnictvi_df = df.loc[df["kodukaz"].isin(zdravotnictvi)]
    zdravotnictvi_score = zdravotnictvi_df.loc[
        zdravotnictvi_df[id_name] == place, "hodnota"
    ].sum()
    zdravotnictvi_score = zdravotnictvi_score / zdravotnictvi_df["hodnota"].max()
    zdravotnictvi_score = (
        zdravotnictvi_score
        / pocet_obyvatel.loc[pocet_obyvatel[id_name] == place, "hodnota"].values[0]
    )
    # nemocnice
    # lékarny
    # zdravotni strediska

    df = pd.DataFrame(
        {
            "krit": ["Zdravotnictví", "Bydlení", "Příroda", "Vzdělání", "Volný čas"],
            "values": [
                zdravotnictvi_score,
                bydleni_score,
                prir_score,
                vzdelani_score,
                vol_score,
            ],
        }
    )

    df["values"] = (df["values"] - df["values"].min()) / (
        df["values"].max() - df["values"].min()
    )
    df.fillna(0, inplace=True)

    fig = px.line_polar(df, r="values", theta="krit", line_close=True, range_r=[0, 1])
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                showline=False,
                showticklabels=False
            )
        )
    )
    fig.update_traces(fill='toself')

    return fig.to_json()


@router.get("/flag")
def get_image(place: int):
    try:
        if not isinstance(place, int) or place <= 0:
            raise ValueError("Invalid place value")

        url = f"https://www.vexi.info/vexibaze/obr/{place}.gif"

        img_response = requests.get(url)

        if img_response.status_code == 200:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".gif") as temp_file:
                temp_file.write(img_response.content)

            return FileResponse(temp_file.name, media_type="image/gif", filename=f"flag_{place}.gif")
        else:
            raise HTTPException(status_code=img_response.status_code, detail="Image not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))