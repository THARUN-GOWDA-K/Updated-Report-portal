from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import FileResponse
from app.middleware.auth import require_role, get_current_user
from app.database import attendance_collection, grades_collection, feedback_collection, users_collection
from bson.objectid import ObjectId
import json
from datetime import datetime
import os

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/generate")
async def generate_report(current_user = Depends(require_role("student"))):
    """Generate comprehensive report data for PDF export"""
    try:
        student_id = str(current_user["_id"])
        
        # Get attendance data
        attendance_records = list(attendance_collection.find({"student_id": student_id}))
        total_lectures = len(attendance_records)
        present = len([a for a in attendance_records if a["status"] == "present"])
        attendance_percentage = (present / total_lectures * 100) if total_lectures > 0 else 0
        
        # Get grades data
        grade_records = list(grades_collection.find({"student_id": student_id}))
        scores = [g["score"] for g in grade_records]
        average_score = sum(scores) / len(scores) if scores else 0
        
        # Get feedback data
        feedback_records = list(feedback_collection.find({"student_id": student_id}))
        
        # Get lecturer names for feedback
        feedback_with_names = []
        for f in feedback_records:
            lecturer = users_collection.find_one({"_id": ObjectId(f["lecturer_id"])})
            feedback_with_names.append({
                "lecturer_name": lecturer.get("name", "Unknown") if lecturer else "Unknown",
                "feedback_text": f["feedback_text"],
                "created_at": f.get("created_at")
            })
        
        report_data = {
            "student_name": current_user["name"],
            "email": current_user["email"],
            "generated_at": datetime.utcnow().isoformat(),
            "attendance": {
                "total_lectures": total_lectures,
                "present": present,
                "absent": total_lectures - present,
                "percentage": attendance_percentage
            },
            "grades": {
                "courses": len(grade_records),
                "average": average_score,
                "grades": [{"course_id": g["course_id"], "score": g["score"]} for g in grade_records]
            },
            "feedback": {
                "total": len(feedback_records),
                "records": feedback_with_names
            }
        }
        
        return report_data
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
