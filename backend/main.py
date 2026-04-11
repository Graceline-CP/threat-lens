from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from config import settings
from rate_limiter import limiter
from routers import url_router, text_router, image_router, report_router

app = FastAPI(
    title="Threat Lens API",
    version="1.0.0",
    docs_url="/docs" if settings.environment == "development" else None,
    redoc_url=None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(url_router.router,    prefix="/api/analyze", tags=["URL Analysis"])
app.include_router(text_router.router,   prefix="/api/analyze", tags=["Text Analysis"])
app.include_router(image_router.router,  prefix="/api/analyze", tags=["Image Analysis"])
app.include_router(report_router.router, prefix="/api/report",  tags=["Report"])


@app.get("/")
def root():
    return {"status": "Threat Lens API running", "env": settings.environment}


@app.get("/health")
def health():
    return {"ok": True}