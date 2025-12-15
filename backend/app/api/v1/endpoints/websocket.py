"""
WebSocket endpoints for real-time updates
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json
import asyncio
import uuid
from typing import Dict, Set
import logging

from app.core.database import get_db
from app.models.scan import Scan
from app.models.user import User
from app.core.auth import get_current_user_from_token

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user_id not in self.user_connections:
            self.user_connections[user_id] = set()
        self.user_connections[user_id].add(connection_id)
        
        logger.info(f"WebSocket connected: {connection_id} for user {user_id}")
    
    def disconnect(self, connection_id: str, user_id: str):
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if user_id in self.user_connections:
            self.user_connections[user_id].discard(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    async def send_to_user(self, user_id: str, message: dict):
        """Send message to all connections of a user"""
        if user_id in self.user_connections:
            disconnected_connections = []
            
            for connection_id in self.user_connections[user_id]:
                if connection_id in self.active_connections:
                    try:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                    except:
                        disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.disconnect(connection_id, user_id)
    
    async def send_scan_update(self, scan_id: str, user_id: str, update_data: dict):
        """Send scan progress update to user"""
        message = {
            "type": "scan_update",
            "scan_id": scan_id,
            "data": update_data,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.send_to_user(user_id, message)

manager = ConnectionManager()


async def get_current_user_from_token(token: str, db: AsyncSession) -> User:
    """Get user from JWT token for WebSocket authentication"""
    from jose import JWTError, jwt
    from app.core.config import settings
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        if user_id is None:
            return None
        
        result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
        return result.scalar_one_or_none()
    except JWTError:
        return None


@router.websocket("/scan-progress")
async def websocket_scan_progress(
    websocket: WebSocket,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db)
):
    """WebSocket endpoint for real-time scan progress updates"""
    
    # Authenticate user
    user = await get_current_user_from_token(token, db)
    if not user:
        await websocket.close(code=4001, reason="Unauthorized")
        return
    
    connection_id = str(uuid.uuid4())
    
    try:
        await manager.connect(websocket, connection_id, str(user.id))
        
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "user_id": str(user.id),
            "connection_id": connection_id
        }))
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                if message.get("type") == "subscribe_scan":
                    scan_id = message.get("scan_id")
                    if scan_id:
                        # Verify user owns this scan
                        result = await db.execute(
                            select(Scan).where(
                                Scan.id == uuid.UUID(scan_id),
                                Scan.user_id == user.id
                            )
                        )
                        scan = result.scalar_one_or_none()
                        
                        if scan:
                            # Send current scan status
                            await websocket.send_text(json.dumps({
                                "type": "scan_status",
                                "scan_id": scan_id,
                                "data": {
                                    "status": scan.status,
                                    "progress": scan.progress,
                                    "started_at": scan.started_at.isoformat() if scan.started_at else None,
                                    "estimated_completion": None  # TODO: Calculate based on progress
                                }
                            }))
                        else:
                            await websocket.send_text(json.dumps({
                                "type": "error",
                                "message": "Scan not found or access denied"
                            }))
                
                elif message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    
            except WebSocketDisconnect:
                break
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Internal server error"
                }))
                
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(connection_id, str(user.id))


# Function to send scan updates (called from scan service)
async def send_scan_progress_update(scan_id: uuid.UUID, user_id: uuid.UUID, progress_data: dict):
    """Send scan progress update via WebSocket"""
    await manager.send_scan_update(str(scan_id), str(user_id), progress_data)