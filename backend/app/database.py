from pymongo import MongoClient
from app.config import settings

client = MongoClient(settings.MONGODB_URL)
db = client[settings.DATABASE_NAME]

# Collections
users_collection = db["users"]
courses_collection = db["courses"]
lectures_collection = db["lectures"]
attendance_collection = db["attendance"]
grades_collection = db["grades"]
feedback_collection = db["feedback"]

def get_db():
    return db
