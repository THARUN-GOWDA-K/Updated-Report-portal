import re
from fastapi import APIRouter, HTTPException, status, Depends
from app.middleware.auth import require_role, get_current_user
from app.models.schemas import AttendanceRecord, GradeRecord, FeedbackCreate, LectureCreate
from app.database import attendance_collection, grades_collection, feedback_collection, lectures_collection, users_collection
from bson.objectid import ObjectId
from datetime import datetime

COURSE_ID_PATTERN = re.compile(r'^B[A-Z]{2}\d{3}$')

def validate_course_id(course_id: str):
    if not COURSE_ID_PATTERN.match(course_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Course ID. Must be in format BXXNNN (e.g., BCS101, BEC201) where X = department letters, N = digits."
        )

router = APIRouter(prefix="/api/lecturer", tags=["lecturer"])

@router.post("/attendance")
async def mark_attendance(attendance: AttendanceRecord, current_user = Depends(require_role("lecturer"))):
    try:
        attendance_data = {
            "lecture_id": attendance.lecture_id,
            "student_id": attendance.student_id,
            "status": attendance.status,
            "marked_at": datetime.utcnow(),
            "lecturer_id": str(current_user["_id"])
        }
        
        result = attendance_collection.insert_one(attendance_data)
        return {"message": "Attendance marked", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/grades")
async def input_grades(grade: GradeRecord, current_user = Depends(require_role("lecturer"))):
    validate_course_id(grade.course_id)
    try:
        grade_data = {
            "student_id": grade.student_id,
            "course_id": grade.course_id,
            "score": grade.score,
            "graded_at": datetime.utcnow(),
            "lecturer_id": str(current_user["_id"])
        }
        
        result = grades_collection.insert_one(grade_data)
        return {"message": "Grade recorded", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/feedback")
async def submit_feedback(feedback: FeedbackCreate, current_user = Depends(require_role("lecturer"))):
    try:
        feedback_data = {
            "student_id": feedback.student_id,
            "lecturer_id": str(current_user["_id"]),
            "feedback_text": feedback.feedback_text,
            "created_at": datetime.utcnow()
        }
        
        result = feedback_collection.insert_one(feedback_data)
        return {"message": "Feedback submitted", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/class-performance/{course_id}")
async def get_class_performance(course_id: str, current_user = Depends(require_role("lecturer"))):
    try:
        # Get grades for the course
        grades = list(grades_collection.find({"course_id": course_id}))
        
        if not grades:
            return {"scores": [], "average": 0, "total_students": 0}
        
        scores = [g["score"] for g in grades]
        average = sum(scores) / len(scores)
        
        return {
            "scores": scores,
            "average": average,
            "total_students": len(scores),
            "min": min(scores),
            "max": max(scores)
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/create-lecture")
async def create_lecture(lecture: LectureCreate, current_user = Depends(require_role("lecturer"))):
    validate_course_id(lecture.course_id)
    try:
        lecture_data = {
            "course_id": lecture.course_id,
            "lecturer_id": str(current_user["_id"]),
            "date": lecture.date,
            "created_at": datetime.utcnow()
        }
        
        result = lectures_collection.insert_one(lecture_data)
        return {"message": "Lecture created", "id": str(result.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/analytics")
async def get_lecturer_analytics(current_user = Depends(require_role("lecturer"))):
    """Full analytics dashboard data for the logged-in lecturer."""
    try:
        lecturer_id = str(current_user["_id"])

        # --- Courses this lecturer teaches (from lectures + grades) ---
        lecture_course_ids = lectures_collection.distinct("course_id", {"lecturer_id": lecturer_id})
        grade_course_ids = grades_collection.distinct("course_id", {"lecturer_id": lecturer_id})
        all_course_ids = sorted(set(lecture_course_ids + grade_course_ids))

        # --- Per-course grade analytics ---
        course_analytics = []
        all_student_ids = set()
        for cid in all_course_ids:
            grades = list(grades_collection.find({"course_id": cid, "lecturer_id": lecturer_id}))
            scores = [g["score"] for g in grades]
            student_ids_in_course = list({g["student_id"] for g in grades})
            all_student_ids.update(student_ids_in_course)

            # Grade distribution buckets
            dist = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
            for s in scores:
                if s >= 80: dist["A"] += 1
                elif s >= 70: dist["B"] += 1
                elif s >= 60: dist["C"] += 1
                elif s >= 50: dist["D"] += 1
                else: dist["F"] += 1

            # Per-student scores for this course
            student_scores = []
            for g in grades:
                stu = None
                try:
                    stu = users_collection.find_one({"_id": ObjectId(g["student_id"])})
                except Exception:
                    pass
                student_scores.append({
                    "student_id": g["student_id"],
                    "student_name": stu.get("name", "Unknown") if stu else "Unknown",
                    "score": g["score"],
                    "graded_at": g.get("graded_at").isoformat() if g.get("graded_at") else None,
                })

            course_analytics.append({
                "course_id": cid,
                "total_students": len(student_ids_in_course),
                "average": round(sum(scores) / len(scores), 2) if scores else 0,
                "min": min(scores) if scores else 0,
                "max": max(scores) if scores else 0,
                "scores": scores,
                "distribution": dist,
                "student_scores": student_scores,
            })

        # --- Attendance analytics per course ---
        attendance_analytics = []
        for cid in all_course_ids:
            lectures = list(lectures_collection.find({"course_id": cid, "lecturer_id": lecturer_id}))
            lecture_ids = [str(l["_id"]) for l in lectures]
            if not lecture_ids:
                continue
            att_records = list(attendance_collection.find({"lecture_id": {"$in": lecture_ids}}))
            total = len(att_records)
            present = len([a for a in att_records if a["status"] == "present"])
            absent = total - present
            attendance_analytics.append({
                "course_id": cid,
                "total_lectures": len(lectures),
                "total_records": total,
                "present": present,
                "absent": absent,
                "attendance_rate": round(present / total * 100, 1) if total > 0 else 0,
            })

        # --- At-risk students (score < 50 or attendance < 60%) ---
        at_risk = []
        for ca in course_analytics:
            for ss in ca["student_scores"]:
                if ss["score"] < 50:
                    at_risk.append({
                        "student_name": ss["student_name"],
                        "course_id": ca["course_id"],
                        "score": ss["score"],
                        "reason": "Low score",
                    })

        # --- Feedback summary ---
        feedback_records = list(feedback_collection.find({"lecturer_id": lecturer_id}))

        return {
            "courses": all_course_ids,
            "total_students": len(all_student_ids),
            "total_courses": len(all_course_ids),
            "total_lectures_created": lectures_collection.count_documents({"lecturer_id": lecturer_id}),
            "total_feedback_given": len(feedback_records),
            "course_analytics": course_analytics,
            "attendance_analytics": attendance_analytics,
            "at_risk_students": at_risk,
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
