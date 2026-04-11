from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from services.report_service import generate_report
import io

router = APIRouter()

class ReportRequest(BaseModel):
    analysis_type: str
    input_data: Optional[str] = ""
    input: Optional[str] = ""
    risk_score: int
    classification: str
    detected_issues: list = []
    red_flags: list = []

@router.post("/download")
async def download_report(request: ReportRequest):
    try:
        # Accept either "input" or "input_data" from the frontend
        resolved_input = request.input_data or request.input or "N/A"

        data = {
            "analysis_type": request.analysis_type,
            "input": resolved_input,
            "risk_score": request.risk_score,
            "classification": request.classification,
            "detected_issues": request.detected_issues,
            "red_flags": request.red_flags,
        }

        pdf_bytes = generate_report(data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=threat_lens_report.pdf",
                "Content-Length": str(len(pdf_bytes)),
                "Access-Control-Expose-Headers": "Content-Disposition",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
