from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
import pandas as pd
import json
import plotly.express as px
import polars as pl
import requests
import tempfile
import math

router = APIRouter(prefix="/data", tags=["Data"])

data_df = pd.read_parquet("data/data.parquet").dropna(axis=1, how="all")
pocet_obyvatel = pd.read_csv("data/pocet_obyvatel.csv")
ukazatele = pd.read_csv("data/cis_ukazatelu.csv")
uzemi = pl.read_csv("data/cis_uzemi.csv")
places = pd.read_csv("data/places.csv")


@router.get("/")
def read_data(
    metric: int,
    level: str,
    year: int,
):
    df = data_df.loc[(data_df["kodukaz"] == metric) & (data_df["rok"] == year)]

    match level.casefold().strip():
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

    match level.casefold().strip():
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
        df, x="rok", y="hodnota", color_discrete_sequence=px.colors.qualitative.Pastel
    )

    return fig.to_json()


def norm_ukazatel(df, place, ukazatele, pocet_obyvatel):
    data_df = df.loc[df["kodukaz"].isin(ukazatele)]
    data_df = data_df.groupby(["uzemi_id", "kodukaz"]).sum().reset_index()
    data_df["hodnota"] = data_df["hodnota"].apply(lambda x: math.log(x) if x != 0 else 0)
    data_df["hodnota"] = data_df["hodnota"] / pocet_obyvatel.loc[pocet_obyvatel["uzemi_id"] == place, "hodnota"].sum()
    data_df = data_df.groupby("uzemi_id").sum().reset_index()
    data_df["skore"] = data_df["hodnota"] / data_df["hodnota"].max()
    
    return data_df


@router.get("/spider")
def get_spider(
    place: int,
    level: str,
    year: int,
):
    df = df[["rok", "kodukaz", "koduzemi", "hodnota", "okruh"]]
    df = df.loc[df["okruh"].isin([4, 7, 15, 20])]

    match level.lower():
        case "kraje":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df[['rok', 'kodukaz', 'kraj_id', 'hodnota']]
            df.rename(columns={"kraj_id": "uzemi_id"}, inplace=True)
            df = df.groupby(["rok", "kodukaz", "uzemi_id"]).sum().reset_index()
            pocet_obyvatel["uzemi_id"] = pocet_obyvatel["kraj_id"]
        case "okresy":
            df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
            df = df[["kodukaz", "okres_id", "hodnota"]]
            df.rename(columns={"okres_id": "uzemi_id"}, inplace=True)
            df = df.groupby(["kodukaz", "uzemi_id"]).sum().reset_index()
            pocet_obyvatel["uzemi_id"] = pocet_obyvatel["okres_id"]
        case "obce":
            df = df[["rok", "kodukaz", "koduzemi", "hodnota"]]
            df.rename(columns={"koduzemi": "uzemi_id"})
            pocet_obyvatel["uzemi_id"] = pocet_obyvatel["obec_id"]


    zdravotnictvi = ukazatele.loc[ukazatele["okruh"] == 7, "kodukaz"]
    skolstvi = ukazatele.loc[ukazatele["okruh"] == 4, "kodukaz"]
    soc_sluzby = ukazatele.loc[ukazatele["okruh"] == 15, "kodukaz"]
    hospodareni = [200802]

    zdravotnictvi_df = norm_ukazatel(df, place, zdravotnictvi, pocet_obyvatel)
    skolstvi_df = norm_ukazatel(df, place, skolstvi, pocet_obyvatel)
    soc_sluzby_df = norm_ukazatel(df, place, soc_sluzby, pocet_obyvatel)
    hospodareni_df = norm_ukazatel(df, place, hospodareni, pocet_obyvatel)

    zdravotnictvi_score = zdravotnictvi_df.loc[zdravotnictvi_df["uzemi_id"] == place, "skore"].values[0]
    skolstvi_score = skolstvi_df.loc[skolstvi_df["uzemi_id"] == place, "skore"].values[0]
    soc_sluzby_score = soc_sluzby_df.loc[soc_sluzby_df["uzemi_id"] == place, "skore"].values[0]
    hospodareni_score = hospodareni_df.loc[hospodareni_df["uzemi_id"] == place, "skore"].values[0]

    score_df = pd.DataFrame({
        "krit": ["Zdravotnictví", "Školství", "Sociální služby", "Hospodaření"],
        "values": [
            zdravotnictvi_score,
            skolstvi_score,
            soc_sluzby_score,
            hospodareni_score
        ]
    }
    )


    fig = px.line_polar(score_df, r="values", theta="krit", line_close=True, range_r=[0, 1], color_discrete_sequence=px.colors.qualitative.Pastel)
    fig.update_layout(
        polar=dict(
            radialaxis=dict(
                visible=True,
                showline=False,
                showticklabels=False,
                linecolor="black",
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

            return FileResponse(
                temp_file.name, media_type="image/gif", filename=f"flag_{place}.gif"
            )
        else:
            raise HTTPException(
                status_code=img_response.status_code, detail="Image not found"
            )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/rank")
def rank_places(metric_id: int, place: int, level: str):
    df = data_df[["rok", "kodukaz", "koduzemi", "hodnota"]]
    df = df.loc[df["kodukaz"] == metric_id]
    df = pd.merge(df, places, left_on="koduzemi", right_on="obec_id")
    
    poc_ob = pocet_obyvatel[["koduzemi", "hodnota"]]
    poc_ob.columns = ["koduzemi", "pocet_obyvatel"]
    
    metric_name, metric_desc = ukazatele.loc[ukazatele["kodukaz"] == metric_id, ["nazev", "metodika "]].values[0]
    
    match level.casefold().strip():
        case "kraje":
            df = df[['rok', "kodukaz", 'kraj_id', "koduzemi", "obec_name", 'hodnota']]
            df = df.loc[df["kraj_id"] == place]
        case "okresy":
            df = df[["rok", "kodukaz", "okres_id", "koduzemi", "obec_name", "hodnota"]]
            df = df.loc[df["okres_id"] == place]
        case "obce":
            df = df[["rok", "kodukaz", "koduzemi", "obec_name", "hodnota"]]
            df = df.loc[df["koduzemi"] == place]
    
    # divide by number of inhabitants
    df = pd.merge(df, poc_ob, on="koduzemi")
    df["rank_hodnota"] = df["hodnota"] / df["pocet_obyvatel"]
    
    df["rank"] = df.groupby("rok")["rank_hodnota"].rank(ascending=False, method="min")
    df = df[["koduzemi", "obec_name", "rank", "rok", "hodnota"]]


    # df.dropna(subset=["hodnota"], inplace=True)
    df["hodnota"].fillna(0, inplace=True)

    zero_hodnota_rows = df.groupby("obec_name")["hodnota"].transform("max") == 0
    df = df[~zero_hodnota_rows]


    fig = px.line(
        df,
        x="rok", y="rank",
        title=metric_name, labels={"rank": "Pořadí", "rok": "Rok"},
        color="obec_name", hover_data=["hodnota"],
        template="plotly_white", color_discrete_sequence=px.colors.qualitative.Pastel)
    fig.update_traces(mode="markers+lines")
    fig.update_layout(
        xaxis=dict(showgrid=False),
        yaxis=dict(showgrid=False,autorange="reversed", range=[1, df["rank"].max() + 1]),
        legend_title_text="Název obce",
    )
    fig.update_yaxes(dict(showticklabels=False))

    return fig.to_json()
