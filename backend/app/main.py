"""
SecureScan.vn - Main FastAPI Application
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import logging

from app.core.config import settings
from app.core.exceptions import SecureScanException
from app.api.v1.router import api_router
from app.core.database import engine
from app.models import Base

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting SecureScan.vn API...")
    
    # Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("✅ Database tables created")
    
    # Start ZAP services if pool is enabled
    if settings.ZAP_POOL_ENABLED:
        try:
            from app.services.zap_load_balancer import zap_load_balancer
            from app.services.zap_pool_manager import zap_pool_manager
            
            logger.info("🔧 Starting ZAP Load Balancer...")
            await zap_load_balancer.start()
            
            logger.info("🔧 Starting ZAP Pool Manager...")
            await zap_pool_manager.start()
            
            logger.info("✅ ZAP services started successfully")
        except Exception as e:
            logger.error(f"❌ Failed to start ZAP services: {e}")
            # Continue without ZAP pool - fallback to single instance
    
    logger.info("🎯 SecureScan.vn API is ready!")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down SecureScan.vn API...")
    
    # Stop ZAP services
    if settings.ZAP_POOL_ENABLED:
        try:
            from app.services.zap_load_balancer import zap_load_balancer
            from app.services.zap_pool_manager import zap_pool_manager
            
            logger.info("🛑 Stopping ZAP Pool Manager...")
            await zap_pool_manager.stop()
            
            logger.info("🛑 Stopping ZAP Load Balancer...")
            await zap_load_balancer.stop()
            
            logger.info("✅ ZAP services stopped")
        except Exception as e:
            logger.error(f"❌ Error stopping ZAP services: {e}")


# Create FastAPI app
app = FastAPI(
    title="SecureScan.vn API",
    description="Vulnerability Scanner API for SME Vietnam",
    version="1.0.0",
    docs_url="/docs" if settings.APP_DEBUG else None,
    redoc_url="/redoc" if settings.APP_DEBUG else None,
    openapi_url="/openapi.json" if settings.APP_DEBUG else None,
    lifespan=lifespan,
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response


# Global exception handler
@app.exception_handler(SecureScanException)
async def securescan_exception_handler(request: Request, exc: SecureScanException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details,
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SecureScan.vn API",
        "version": "1.0.0",
        "timestamp": time.time(),
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "🛡️ SecureScan.vn API",
        "description": "Vulnerability Scanner for SME Vietnam",
        "version": "1.0.0",
        "docs": "/docs" if settings.APP_DEBUG else "Contact support for API documentation",
        "status": "operational",
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.APP_DEBUG,
        log_level="info",
    )