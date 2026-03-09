from fastapi import APIRouter, HTTPException, status, Depends
from app.middleware.auth import require_role, get_current_user
from app.database import attendance_collection, grades_collection, feedback_collection, users_collection
from bson.objectid import ObjectId

router = APIRouter(prefix="/api/student", tags=["student"])

@router.get("/attendance")
async def get_attendance(current_user = Depends(require_role("student"))):
    try:
        student_id = str(current_user["_id"])
        attendance_records = list(attendance_collection.find({"student_id": student_id}))
        
        total = len(attendance_records)
        present = len([a for a in attendance_records if a["status"] == "present"])
        
        return {
            "total_lectures": total,
            "present": present,
            "absent": total - present,
            "percentage": (present / total * 100) if total > 0 else 0,
            "records": [
                {
                    "id": str(a["_id"]),
                    "lecture_id": a["lecture_id"],
                    "status": a["status"],
                    "marked_at": a.get("marked_at")
                }
                for a in attendance_records
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/grades")
async def get_grades(current_user = Depends(require_role("student"))):
    try:
        student_id = str(current_user["_id"])
        grade_records = list(grades_collection.find({"student_id": student_id}))
        
        total_score = sum([g["score"] for g in grade_records])
        average = total_score / len(grade_records) if grade_records else 0
        
        return {
            "grades": [
                {
                    "id": str(g["_id"]),
                    "course_id": g["course_id"],
                    "score": g["score"],
                    "graded_at": g.get("graded_at")
                }
                for g in grade_records
            ],
            "average": average,
            "total_courses": len(grade_records)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/feedback")
async def get_feedback(current_user = Depends(require_role("student"))):
    try:
        student_id = str(current_user["_id"])
        feedback_records = list(feedback_collection.find({"student_id": student_id}))
        
        feedback_list = []
        for f in feedback_records:
            lecturer = users_collection.find_one({"_id": ObjectId(f["lecturer_id"])})
            lecturer_name = lecturer.get("name", "Unknown") if lecturer else "Unknown"
            feedback_list.append({
                "id": str(f["_id"]),
                "lecturer_id": f["lecturer_id"],
                "lecturer_name": lecturer_name,
                "feedback_text": f["feedback_text"],
                "created_at": f.get("created_at")
            })
        
        return {
            "feedback": feedback_list,
            "total": len(feedback_records)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/profile")
async def get_profile(current_user = Depends(require_role("student"))):
    try:
        return {
            "id": str(current_user["_id"]),
            "email": current_user["email"],
            "name": current_user["name"],
            "role": current_user["role"],
            "department": current_user.get("department"),
            "created_at": current_user.get("created_at")
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/list")
async def get_students_list(current_user = Depends(require_role("lecturer", "admin"))):
    """
    Get list of all approved students with their names and IDs
    Accessible by lecturers and admins only
    """
    try:
        students = list(users_collection.find(
            {"role": "student", "approval_status": "approved"},
            {"_id": 1, "name": 1, "email": 1}
        ))
        
        return [
            {
                "id": str(student["_id"]),
                "name": student["name"],
                "email": student["email"],
            }
            for student in students
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
