from fastapi import FastAPI
from routers import data, ciselnik
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="HackujStat V5",
    docs_url="/docs",
    redoc_url=None,
)


origins = [
    "*",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(data.router)
app.include_router(ciselnik.router)
