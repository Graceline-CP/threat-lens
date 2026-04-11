from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.url_service import analyze_url

router = APIRouter()

class URLRequest(BaseModel):
    url: str

@router.post("/url")
async def analyze_url_endpoint(request: URLRequest):
    try:
        result = await analyze_url(request.url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))