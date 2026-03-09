from fastapi import APIRouter, HTTPException, status, Depends
from app.middleware.auth import require_role, get_current_user
from app.database import users_collection
from bson.objectid import ObjectId

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/pending-approvals")
async def get_pending_approvals(current_user = Depends(require_role("admin"))):
    pending_users = list(users_collection.find(
        {"approval_status": "pending", "role": {"$in": ["lecturer"]}}
    ))
    
    return [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "created_at": user.get("created_at")
        }
        for user in pending_users
    ]

@router.post("/approve-user/{user_id}")
async def approve_user(user_id: str, current_user = Depends(require_role("admin"))):
    try:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"approval_status": "approved"}}
        )
        return {"message": "User approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/users")
async def get_all_users(current_user = Depends(require_role("admin"))):
    users = list(users_collection.find({}, {"password_hash": 0}))
    
    return [
        {
            "id": str(user["_id"]),
            "email": user["email"],
            "name": user["name"],
            "role": user["role"],
            "department": user.get("department"),
            "approval_status": user.get("approval_status"),
            "created_at": user.get("created_at")
        }
        for user in users
    ]

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user = Depends(require_role("admin"))):
    try:
        result = users_collection.delete_one({"_id": ObjectId(user_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return {"message": "User deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
