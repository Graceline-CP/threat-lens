from fastapi import APIRouter, HTTPException, UploadFile, File
from services.image_service import analyze_image

router = APIRouter()

@router.post("/image")
async def analyze_image_endpoint(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = await analyze_image(contents, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))