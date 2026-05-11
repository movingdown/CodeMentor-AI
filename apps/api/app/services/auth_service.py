"""Auth business logic.

라우터에서 호출. HTTP를 모름 — 도메인 예외만 throw.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password
from app.db.models.user import User
from app.schemas.auth import UserCreate


class AuthError(Exception):
    pass


class EmailAlreadyExists(AuthError):
    pass


class InvalidCredentials(AuthError):
    pass


def _normalize_email(email: str) -> str:
    return email.lower().strip()


async def signup(db: AsyncSession, payload: UserCreate) -> User:
    email = _normalize_email(payload.email)

    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise EmailAlreadyExists()

    user = User(
        email=email,
        hashed_password=hash_password(payload.password),
        display_name=payload.display_name.strip(),
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    email = _normalize_email(email)
    user = await db.scalar(select(User).where(User.email == email))
    if user is None:
        raise InvalidCredentials()
    if not verify_password(password, user.hashed_password):
        raise InvalidCredentials()
    if not user.is_active:
        raise InvalidCredentials()
    return user
