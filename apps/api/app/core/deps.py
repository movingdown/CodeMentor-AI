"""Reusable FastAPI dependencies — single import point for routers.

라우터에서 사용:
    from app.core.deps import DbSession, CurrentUser
"""
import uuid
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import decode_access_token
from app.db.models.user import User
from app.db.session import get_db

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.api_v1_prefix}/auth/login",
    auto_error=True,
)

DbSession = Annotated[AsyncSession, Depends(get_db)]
TokenDep = Annotated[str, Depends(oauth2_scheme)]


async def get_current_user(token: TokenDep, db: DbSession) -> User:
    """Bearer token → User. 401 on any failure."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="유효하지 않은 인증 정보입니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = decode_access_token(token)
    except JWTError as exc:
        raise credentials_exc from exc

    if payload.get("type") != "access":
        raise credentials_exc

    sub = payload.get("sub")
    if not sub:
        raise credentials_exc

    try:
        user_id = uuid.UUID(sub)
    except (ValueError, TypeError) as exc:
        raise credentials_exc from exc

    user = await db.scalar(select(User).where(User.id == user_id))
    if user is None or not user.is_active:
        raise credentials_exc
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


__all__ = ["get_db", "get_current_user", "DbSession", "CurrentUser"]
