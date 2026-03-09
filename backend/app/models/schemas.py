from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserRegister(UserBase):
    password: str
    role: str  # "student", "lecturer", "admin"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: Optional[str] = None
    role: str
    department: Optional[str] = None
    approval_status: str = "pending"  # "pending", "approved", "rejected"
    created_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class LectureCreate(BaseModel):
    course_id: str
    date: str

class AttendanceRecord(BaseModel):
    lecture_id: str
    student_id: str
    status: str  # "present" or "absent"

class GradeRecord(BaseModel):
    student_id: str
    course_id: str
    score: float

class FeedbackCreate(BaseModel):
    student_id: str
    feedback_text: str
    created_at: Optional[datetime] = None

class CourseCreate(BaseModel):
    name: str
    code: str
    department: str
    credits: int
