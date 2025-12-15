"""
Main API router for v1
"""

from fastapi import APIRouter
from app.api.v1.endpoints import auth, domains, scans, reports, users, websocket, admin

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(domains.router, prefix="/domains", tags=["domains"])
api_router.include_router(scans.router, prefix="/scans", tags=["scans"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(websocket.router, prefix="/ws", tags=["websocket"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

# Dashboard stats endpoint
@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return {
        "success": True,
        "data": {
            "totalDomains": 3,
            "totalScans": 12,
            "openIssues": 7,
            "averageRiskScore": "B"
        }
    }