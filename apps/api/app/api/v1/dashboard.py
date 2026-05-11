"""Dashboard summary endpoint."""
from fastapi import APIRouter

from app.core.deps import CurrentUser, DbSession
from app.schemas.dashboard import DashboardSummary
from app.services import dashboard_service

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    user: CurrentUser, db: DbSession
) -> DashboardSummary:
    return await dashboard_service.get_dashboard_summary(db, user.id)
