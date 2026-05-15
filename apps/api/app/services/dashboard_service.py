"""Dashboard aggregation.

원칙:
  - 모든 쿼리는 user_id로 격리.
  - usage_events 테이블은 미래용 — 현재는 messages + analyses 에서 집계.
  - 단일 트랜잭션(같은 세션)에서 순차 실행.
"""
import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.analysis import Analysis
from app.db.models.chat import Chat
from app.db.models.message import Message
from app.db.models.project import Project
from app.schemas.dashboard import (
    DashboardSummary,
    RecentAnalysisItem,
    RecentChatItem,
    RecentProjectItem,
    StatsSummary,
    UsageDay,
)


async def _count(db: AsyncSession, stmt) -> int:
    return (await db.scalar(stmt)) or 0


async def get_dashboard_summary(
    db: AsyncSession, user_id: uuid.UUID
) -> DashboardSummary:
    now = datetime.now(UTC)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    seven_days_ago = (now - timedelta(days=6)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # ===== 1) Counts =====
    total_chats = await _count(
        db, select(func.count(Chat.id)).where(Chat.user_id == user_id)
    )
    total_projects = await _count(
        db, select(func.count(Project.id)).where(Project.user_id == user_id)
    )
    total_analyses = await _count(
        db, select(func.count(Analysis.id)).where(Analysis.user_id == user_id)
    )

    # ===== 2) AI 요청 (이번 달) =====
    user_msgs_month = await _count(
        db,
        select(func.count(Message.id))
        .select_from(Message)
        .join(Chat, Chat.id == Message.chat_id)
        .where(
            Chat.user_id == user_id,
            Message.role == "user",
            Message.created_at >= month_start,
        ),
    )
    analyses_month = await _count(
        db,
        select(func.count(Analysis.id)).where(
            Analysis.user_id == user_id,
            Analysis.created_at >= month_start,
        ),
    )
    ai_requests_this_month = user_msgs_month + analyses_month

    # ===== 3) 7-day usage =====
    msg_day = func.date_trunc("day", Message.created_at).label("day")
    msg_rows = (
        await db.execute(
            select(msg_day, func.count(Message.id))
            .select_from(Message)
            .join(Chat, Chat.id == Message.chat_id)
            .where(
                Chat.user_id == user_id,
                Message.role == "user",
                Message.created_at >= seven_days_ago,
            )
            .group_by(msg_day)
        )
    ).all()

    ana_day_col = func.date_trunc("day", Analysis.created_at).label("day")
    ana_rows = (
        await db.execute(
            select(ana_day_col, func.count(Analysis.id))
            .where(
                Analysis.user_id == user_id,
                Analysis.created_at >= seven_days_ago,
            )
            .group_by(ana_day_col)
        )
    ).all()

    buckets: dict[date, int] = {
        (now.date() - timedelta(days=i)): 0 for i in range(6, -1, -1)
    }
    for day, count in msg_rows:
        d = day.date() if isinstance(day, datetime) else day
        if d in buckets:
            buckets[d] += count
    for day, count in ana_rows:
        d = day.date() if isinstance(day, datetime) else day
        if d in buckets:
            buckets[d] += count

    usage_7days = [
        UsageDay(date=d.isoformat(), count=c) for d, c in sorted(buckets.items())
    ]

    # ===== 4) Recent items =====
    recent_chats = list(
        await db.scalars(
            select(Chat)
            .where(Chat.user_id == user_id)
            .order_by(desc(Chat.updated_at))
            .limit(5)
        )
    )

    recent_projects = list(
        await db.scalars(
            select(Project)
            .where(Project.user_id == user_id)
            .order_by(desc(Project.created_at))
            .limit(5)
        )
    )

    ana_rows = (
        await db.execute(
            select(Analysis, Project.name)
            .join(Project, Project.id == Analysis.project_id)
            .where(Analysis.user_id == user_id)
            .order_by(desc(Analysis.created_at))
            .limit(5)
        )
    ).all()

    recent_analyses = [
        RecentAnalysisItem(
            id=a.id,
            project_id=a.project_id,
            project_name=pname,
            analysis_type=a.analysis_type,
            created_at=a.created_at,
        )
        for a, pname in ana_rows
    ]

    return DashboardSummary(
        stats=StatsSummary(
            total_chats=total_chats,
            total_projects=total_projects,
            total_analyses=total_analyses,
            ai_requests_this_month=ai_requests_this_month,
        ),
        usage_7days=usage_7days,
        recent_chats=[RecentChatItem.model_validate(c) for c in recent_chats],
        recent_projects=[
            RecentProjectItem.model_validate(p) for p in recent_projects
        ],
        recent_analyses=recent_analyses,
    )
