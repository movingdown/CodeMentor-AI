"""Aggregate all v1 routers."""
from fastapi import APIRouter

from app.api.v1 import analyze, auth, chats, dashboard, github, health, projects

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(chats.router, prefix="/chats", tags=["chats"])
api_router.include_router(github.router, prefix="/github", tags=["github"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(analyze.router, tags=["analyze"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
