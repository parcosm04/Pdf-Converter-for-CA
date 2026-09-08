from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.config import settings
from app.crud import crud
from app.schemas import schemas
from app.services import security

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user account, hashes their password, and creates a default Organization.
    """
    db_user = crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
    
    # 1. Create Organization
    org_name = f"{user_in.email.split('@')[0]}'s Workspace"
    db_org = crud.create_organization(db, name=org_name)
    
    # 2. Create User and link to organization
    hashed_pass = security.get_password_hash(user_in.password)
    new_user = crud.create_user(db, user_schema=user_in, hashed_pass=hashed_pass, org_id=db_org.id)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Authenticates username (email) and password, and returns a JWT access token.
    """
    user = crud.get_user_by_email(db, email=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password."
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive account."
        )
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user=Depends(security.get_current_active_user)):
    """
    Returns current authenticated user details.
    """
    return current_user

@router.post("/guest", response_model=schemas.Token)
def guest_login(db: Session = Depends(get_db)):
    """
    Auto-authenticates a guest session, creating a default user if needed, and returning a JWT token.
    """
    guest_email = "guest@finextract.com"
    user = crud.get_user_by_email(db, email=guest_email)
    if not user:
        user = crud.get_user_by_email(db, email="user@ubsp.com")
        if not user:
            org = crud.create_organization(db, name="Guest Workspace")
            hashed_pass = security.get_password_hash("guestpass123")
            user_create = schemas.UserCreate(email=guest_email, password="guestpass123")
            user = crud.create_user(db, user_schema=user_create, hashed_pass=hashed_pass, org_id=org.id)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": token, "token_type": "bearer"}

