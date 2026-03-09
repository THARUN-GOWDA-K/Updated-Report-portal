from fastapi import APIRouter, HTTPException, status
from app.models.schemas import UserRegister, UserLogin, TokenResponse, User
from app.database import users_collection
from app.utils import hash_password, verify_password, create_access_token
from bson.objectid import ObjectId
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=dict)
async def register(user: UserRegister):
    normalized_email = user.email.strip().lower()

    # Check if user already exists
    existing_user = users_collection.find_one({"email": normalized_email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    # Auto-approve students and admins, pending for lecturers
    approval_status = "approved" if user.role in ["student", "admin"] else "pending"
    
    user_data = {
        "email": normalized_email,
        "name": user.name,
        "password_hash": hash_password(user.password),
        "role": user.role,
        "department": None,
        "approval_status": approval_status,
        "created_at": datetime.utcnow()
    }
    
    result = users_collection.insert_one(user_data)
    
    return {
        "message": f"Registration successful. {'You can now login.' if approval_status == 'approved' else 'Awaiting admin approval.'}",
        "user_id": str(result.inserted_id)
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    normalized_email = credentials.email.strip().lower()
    user = users_collection.find_one({"email": normalized_email})

    password_hash = user.get("password_hash") if user else None
    password_valid = verify_password(credentials.password, password_hash) if password_hash else False

    if not user or not password_valid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    if user.get("approval_status") != "approved":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account pending admin approval")
    
    access_token = create_access_token(data={"sub": str(user["_id"]), "role": user["role"]})
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=User(
            id=str(user["_id"]),
            email=user["email"],
            name=user["name"],
            role=user["role"],
            department=user.get("department"),
            approval_status=user.get("approval_status")
        )
    )
