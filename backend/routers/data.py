from fastapi import APIRouter, HTTPException
import pandas as pd
import json
import plotly.express as px
import polars as pl

router = APIRouter(prefix="/data", tags=["Data"])

data_df = pd.read_parquet("data/data.parquet").dropna(axis=1, how="all")
pocet_obyvatel = pd.read_csv("data/pocet_obyvatel.csv")
ukazatele = pl.read_csv("data/cis_ukazatelu.csv")
uzemi = pl.read_csv("data/cis_uzemi.csv")


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
            merged_df = pd.merge(
                data_df, places, left_on="koduzemi", right_on="obec_id"
            )
            merged_df = merged_df[["okres_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            data_df = merged_df.to_json(orient="records")
        case "obce":
            data_df = data_df[["koduzemi", "hodnota"]]
            data_df.columns = ["uzemi_id", "hodnota"]
            data_df = data_df.to_json(orient="records")
        case "kraje":
            merged_df = pd.merge(
                data_df, places, left_on="koduzemi", right_on="obec_id"
            )
            merged_df = merged_df[["kraj_id", "hodnota"]]
            merged_df.columns = ["uzemi_id", "hodnota"]
            merged_df = merged_df.groupby("uzemi_id").sum().reset_index()
            data_df = merged_df.to_json(orient="records")
        case _:
            raise HTTPException(
                status_code=404,
                detail="Unknown level. Must be one of: okresy, obce, kraje",
            )
    return data_df


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


@router.get("/plotlygraph/{uzemiid}")
def get_plotly_graph(uzemiid: str):
    import plotly.express as px

    # import plotly.graph_objects as go

    uzemiId = 500011
    matrix = get_uzemi_matrices(uzemiid).sort("rok").collect().to_pandas()
    uzemi_nazev = uzemi.filter(pl.col("koduzemi") == uzemiId).get_column("obec")[0]
    ukazatel = 10300
    ukazatel_nazev = (
        ukazatele.filter(pl.col("kodukaz") == ukazatel)
        .select("nazev")
        .to_pandas()["nazev"][0]
    )
    fig = px.line(
        matrix, x="rok", y=str(ukazatel), title=f"{uzemi_nazev}: {ukazatel_nazev}"
    )


@router.get("/spider")
def get_spider(
    city: int,
    year: int,
):
    df = data_df[["rok", "kodukaz", "koduzemi", "hodnota"]]
    df = df.loc[df["rok"] == year]

    vol_cas = [141434, 141432, 600808, 600806]
    vol_casdf = df.loc[df["kodukaz"].isin(vol_cas)]
    vol_score = vol_casdf.loc[vol_casdf["koduzemi"] == city, "hodnota"].sum()
    vol_score = vol_score / vol_casdf["hodnota"].max()
    vol_score = (
        vol_score
        / pocet_obyvatel.loc[pocet_obyvatel["koduzemi"] == city, "hodnota"].values[0]
    )
    # 141434 - kulturni a osvetova plocha
    # 141432 - sportoviste a rekrea. plocha
    # 600808 - hriste
    # 600806 - koupaliste

    priroda = [141000, 141431]
    priroda_df = df.loc[df["kodukaz"].isin(priroda)]
    prir_score = priroda_df.loc[priroda_df["koduzemi"] == city, "hodnota"].sum()
    prir_score = prir_score / priroda_df["hodnota"].max()
    prir_score = (
        prir_score
        / pocet_obyvatel.loc[pocet_obyvatel["koduzemi"] == city, "hodnota"].values[0]
    )
    # lesní půda
    # zeleň

    vzdelani = [40300, 40590]
    vzdelani_df = df.loc[df["kodukaz"].isin(vzdelani)]
    vzdelani_score = vzdelani_df.loc[vzdelani_df["koduzemi"] == city, "hodnota"].sum()
    vzdelani_score = vzdelani_score / vzdelani_df["hodnota"].max()
    vzdelani_score = (
        vzdelani_score
        / pocet_obyvatel.loc[pocet_obyvatel["koduzemi"] == city, "hodnota"].values[0]
    )
    # materske skoly
    # zakladni skoly

    bydleni = [402120]
    bydleni_df = df.loc[df["kodukaz"].isin(bydleni)]
    bydleni_score = bydleni_df.loc[bydleni_df["koduzemi"] == city, "hodnota"].sum()
    bydleni_score = bydleni_score / bydleni_df["hodnota"].max()
    bydleni_score = (
        bydleni_score
        / pocet_obyvatel.loc[pocet_obyvatel["koduzemi"] == city, "hodnota"].values[0]
    )
    # byty

    zdravotnictvi = [70300, 71000, 70200]
    zdravotnictvi_df = df.loc[df["kodukaz"].isin(zdravotnictvi)]
    zdravotnictvi_score = zdravotnictvi_df.loc[
        zdravotnictvi_df["koduzemi"] == city, "hodnota"
    ].sum()
    zdravotnictvi_score = zdravotnictvi_score / zdravotnictvi_df["hodnota"].max()
    zdravotnictvi_score = (
        zdravotnictvi_score
        / pocet_obyvatel.loc[pocet_obyvatel["koduzemi"] == city, "hodnota"].values[0]
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

    return fig.to_json()
