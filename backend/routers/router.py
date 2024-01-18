from fastapi import APIRouter

router = APIRouter(prefix="/router")

@router.get("/")
def read_root():
    return {"Hello": "Router"}