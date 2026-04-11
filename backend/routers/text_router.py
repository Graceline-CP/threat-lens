from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.text_service import analyze_text

router = APIRouter()

class TextRequest(BaseModel):
    text: str

@router.post("/text")
async def analyze_text_endpoint(request: TextRequest):
    try:
        result = await analyze_text(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))