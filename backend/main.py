from fastapi import FastAPI
from routers import data, ciselnik
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import dotenv
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    dotenv.load_dotenv()
    url = os.environ.get("BACKEND_URL")
    if not url or url == "":
        raise Exception("BACKEND_URL is not set in the .env file")
    print("Moje URL je " + url, flush=True)
    yield

app = FastAPI(
    title="HackujStat V5",
    docs_url="/docs",
    redoc_url=None,
    # lifespan=lifespan,
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
