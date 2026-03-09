<<<<<<< HEAD
# Updated-Report-portal
=======
# Annual Report Portal

A comprehensive student report management system with role-based dashboards for Admin, Lecturers, and Students.

## Features

- **Home/Login Page**: Entry point with login and registration
- **Self-Registration**: Students auto-approved, lecturers pending admin approval
- **Three Role-Based Dashboards**:
  - **Admin Dashboard**: Manage users, approve teacher registrations, view all users
  - **Lecturer Dashboard**: Mark per-lecture attendance, input grades, submit feedback, create lectures
  - **Student Dashboard**: View academic progress, attendance, grades, feedback, and download reports
- **On-Demand Report Generation**: Students can download their report as PDF with attendance, grades, and feedback
- **RBAC (Role-Based Access Control)**: Protected routes and API endpoints per role

## Tech Stack

### Frontend
- React 18 + Vite
- React Router for navigation
- Axios for API calls
- JsPDF for PDF generation
- Recharts for visualizations (ready for expansion)
- CSS for styling

### Backend
- FastAPI (Python 3.12)
- MongoDB for data storage
- JWT authentication
- Bcrypt for password hashing
- Pydantic for data validation

## Project Structure

```
annual-portal/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── Auth.css
│   │   │   ├── AdminDashboard/
│   │   │   ├── LecturerDashboard/
│   │   │   ├── StudentDashboard/
│   │   │   └── Common/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── App.css
│   ├── .env
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── utils.py
│   │   ├── models/
│   │   │   └── schemas.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── admin.py
│   │   │   ├── lecturer.py
│   │   │   ├── student.py
│   │   │   └── reports.py
│   │   └── middleware/
│   │       └── auth.py
│   ├── .env
│   ├── venv/
│   └── requirements.txt
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 20+ and npm
- Python 3.12+
- MongoDB installed locally or connection string ready

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Activate virtual environment**
   ```bash
   # Windows
   .\venv\Scripts\Activate.ps1
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   - Update `.env` with your MongoDB connection string and secret key
   ```
   MONGODB_URL=mongodb://localhost:27017
   DATABASE_NAME=annual_portal
   SECRET_KEY=your-super-secret-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```
   Backend runs on: `http://localhost:8000`
   API Docs: `http://localhost:8000/docs`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   - `.env` already has `VITE_API_URL=http://localhost:8000/api`
   - Update if your backend runs on a different URL

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Frontend runs on: `http://localhost:5173`

## Usage

### 1. Registration & Login

**Home Page**: Navigate to `http://localhost:5173`

- **Student Registration**: 
  - Click "Register" → Select "Student" role
  - Auto-approved immediately
  - Can login right away

- **Lecturer Registration**:
  - Click "Register" → Select "Lecturer" role
  - Status set to "pending"
  - Admin must approve before login allowed

- **Admin**:
  - Manually create admin account in MongoDB with role "admin"
  - Set approval_status to "approved"

### 2. Admin Dashboard

After login as admin:
- **Pending Approvals Tab**: Approve pending lecturer registrations
- **All Users Tab**: View all registered users, delete users if needed

### 3. Lecturer Dashboard

After login as lecturer (post-approval):
- **Mark Attendance Tab**: 
  - Input lecture_id, student_id
  - Select Present/Absent
  - Records attendance for per-lecture tracking

- **Input Grades Tab**:
  - Enter student_id, course_id, score (0-100)
  - Records grades for students

- **Feedback Tab**:
  - Enter student_id with feedback text
  - Submit suggestions for individual students

- **Create Lecture Tab**:
  - Create a lecture with course_id and date/time
  - Generates lecture_id for attendance marking

### 4. Student Dashboard

After login as student:
- **Progress Report Tab**: View key metrics (attendance %, GPA, feedback count)
- **Attendance Tab**: View attendance record
- **Grades Tab**: View all course grades and average
- **Feedback Tab**: View all feedback from lecturers
- **Download Report Tab**: Generate and download PDF with complete academic report

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Admin
- `GET /api/admin/pending-approvals` - Get pending lecturer approvals
- `POST /api/admin/approve-user/{user_id}` - Approve a user
- `GET /api/admin/users` - Get all users
- `DELETE /api/admin/users/{user_id}` - Delete a user

### Lecturer
- `POST /api/lecturer/attendance` - Mark attendance
- `POST /api/lecturer/grades` - Input grades
- `POST /api/lecturer/feedback` - Submit feedback
- `POST /api/lecturer/create-lecture` - Create a lecture
- `GET /api/lecturer/class-performance/{course_id}` - Get class stats

### Student
- `GET /api/student/attendance` - Get attendance records
- `GET /api/student/grades` - Get grades
- `GET /api/student/feedback` - Get feedback
- `GET /api/student/profile` - Get profile

### Reports
- `GET /api/reports/generate` - Generate report data for PDF

## MongoDB Collections

```javascript
// Users
{
  _id: ObjectId,
  email: String,
  name: String,
  password_hash: String,
  role: String ("student"|"lecturer"|"admin"),
  department: String,
  approval_status: String ("pending"|"approved"|"rejected"),
  created_at: Date
}

// Lectures
{
  _id: ObjectId,
  course_id: String,
  lecturer_id: String,
  date: Date,
  created_at: Date
}

// Attendance
{
  _id: ObjectId,
  lecture_id: String,
  student_id: String,
  status: String ("present"|"absent"),
  lecturer_id: String,
  marked_at: Date
}

// Grades
{
  _id: ObjectId,
  student_id: String,
  course_id: String,
  score: Number,
  lecturer_id: String,
  graded_at: Date
}

// Feedback
{
  _id: ObjectId,
  student_id: String,
  lecturer_id: String,
  feedback_text: String,
  created_at: Date
}
```

## File Descriptions

### Backend Files
- **app/main.py**: FastAPI app initialization, route includes, CORS setup
- **app/config.py**: Configuration management with pydantic-settings
- **app/database.py**: MongoDB connection and collection references
- **app/utils.py**: Password hashing and JWT token utilities
- **app/routes/auth.py**: Registration and login endpoints
- **app/routes/admin.py**: Admin management endpoints
- **app/routes/lecturer.py**: Attendance, grades, feedback, lecture creation
- **app/routes/student.py**: Student data retrieval endpoints
- **app/routes/reports.py**: Report data generation for PDF export
- **app/middleware/auth.py**: JWT validation and RBAC dependency injection

### Frontend Files
- **src/App.jsx**: Router setup with protected routes
- **src/context/AuthContext.jsx**: Auth state management
- **src/context/ProtectedRoute.jsx**: Role-based route protection
- **src/services/api.js**: Axios instance and API service functions
- **src/components/Auth/**: Login, Register, Home pages
- **src/components/*Dashboard/**: Dashboard components for each role

## Authentication Flow

1. User registers with email, password, name, and role
2. Backend hashes password with bcrypt
3. Students auto-approved, teachers marked as pending
4. Admin approves pending teachers
5. User logs in with email/password
6. Backend returns JWT token
7. Frontend stores token in localStorage
8. Token included in all API requests via Axios interceptor
9. Backend validates token and checks role on protected routes
10. Logout clears token from localStorage

## Next Steps / Future Enhancements

1. **Add visualizations**: Integrate Recharts for attendance trends, grade distribution charts
2. **Email notifications**: Send approval emails to teachers
3. **Attendance analytics**: Track patterns, generate attendance reports
4. **Department management**: Add department assignment and scoping
5. **Bulk operations**: Batch upload students, courses, lectures via CSV
6. **Search & filters**: Find students, filter by course/year
7. **Notifications system**: In-app notifications for approvals, feedback
8. **Export features**: Export data to Excel, JSON formats
9. **Mobile responsive**: Optimize for mobile viewing
10. **Testing**: Add unit and integration tests

## Troubleshooting

**"Invalid token" error on protected routes**
- Clear localStorage and login again
- Check that backend is running and accessible

**"Cannot connect to MongoDB"**
- Ensure MongoDB is running locally or connection string is correct
- Check `.env` MONGODB_URL

**CORS errors**
- Verify `frontend` URL in backend's CORS origins
- Default is `http://localhost:5173`

**Lecturer can't login after registration**
- Admin must approve the pending lecturer first
- Check admin dashboard's "Pending Approvals" tab

## Contributing

1. Create feature branches from main
2. Follow existing code style and structure
3. Test changes locally before submitting
4. Update documentation as needed

## License

MIT License

---

**Happy reporting!** For questions or issues, check the API docs at `http://localhost:8000/docs`
>>>>>>> 767e42d (updated report portal)
