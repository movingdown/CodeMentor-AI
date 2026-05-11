"""Auth endpoints: signup / login / me."""
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import get_settings
from app.core.deps import CurrentUser, DbSession
from app.core.security import create_access_token
from app.schemas.auth import Token, UserCreate, UserRead
from app.services import auth_service

router = APIRouter()
settings = get_settings()


@router.post(
    "/signup",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입",
)
async def signup(payload: UserCreate, db: DbSession) -> UserRead:
    try:
        user = await auth_service.signup(db, payload)
    except auth_service.EmailAlreadyExists as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 사용 중인 이메일입니다.",
        ) from exc
    return UserRead.model_validate(user)


@router.post(
    "/login",
    response_model=Token,
    summary="로그인 (OAuth2 password flow)",
)
async def login(
    form: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: DbSession,
) -> Token:
    """form-data 형식: username = email."""
    try:
        user = await auth_service.authenticate(
            db, email=form.username, password=form.password
        )
    except auth_service.InvalidCredentials as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    token = create_access_token(subject=str(user.id))
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=settings.jwt_expire_minutes * 60,
    )


@router.get("/me", response_model=UserRead, summary="현재 로그인 사용자")
async def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)
