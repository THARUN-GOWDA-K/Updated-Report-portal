import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { lecturerService, studentService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import './Dashboard.css';

const LecturerDashboard = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('attendance');
  const [courseId, setCourseId] = useState('');
  const [lectureId, setLectureId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentsList, setStudentsList] = useState([]);
  const [status, setStatus] = useState('present');
  const [score, setScore] = useState('');
  const [lectureDate, setLectureDate] = useState('');
  const [lectureTime, setLectureTime] = useState('');
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [courseIdError, setCourseIdError] = useState('');
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');

  // --- Chart colors ---
  const COLORS = {
    cyan: '#00d4ff', magenta: '#ff006e', green: '#39ff14',
    purple: '#a78bfa', orange: '#ff9f43', pink: '#ff6b9d',
    teal: '#00ffff', yellow: '#ffe066',
  };
  const GRADE_COLORS = { A: '#39ff14', B: '#00d4ff', C: '#ffe066', D: '#ff9f43', F: '#ff006e' };
  const BAR_PALETTE = [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.orange, COLORS.pink, COLORS.teal, COLORS.yellow, COLORS.magenta];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label || payload[0].name}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color || entry.fill }}>
              {entry.name || entry.dataKey}: <strong>{typeof entry.value === 'number' ? Math.round(entry.value * 100) / 100 : entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsError(false);
    try {
      const res = await lecturerService.getAnalytics();
      setAnalytics(res.data);
      if (res.data.courses?.length && !selectedCourse) {
        setSelectedCourse(res.data.courses[0]);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setAnalyticsError(true);
    }
  }, []);

  // Derived data for the selected course
  const activeCourseData = useMemo(() => {
    if (!analytics || !selectedCourse) return null;
    return analytics.course_analytics?.find(c => c.course_id === selectedCourse) || null;
  }, [analytics, selectedCourse]);

  const activeAttendance = useMemo(() => {
    if (!analytics || !selectedCourse) return null;
    return analytics.attendance_analytics?.find(a => a.course_id === selectedCourse) || null;
  }, [analytics, selectedCourse]);

  const distributionData = useMemo(() => {
    if (!activeCourseData) return [];
    return Object.entries(activeCourseData.distribution).map(([grade, count]) => ({
      grade, count, fill: GRADE_COLORS[grade],
    }));
  }, [activeCourseData]);

  const studentScoresData = useMemo(() => {
    if (!activeCourseData) return [];
    return activeCourseData.student_scores
      .map(s => ({ name: s.student_name, score: s.score }))
      .sort((a, b) => b.score - a.score);
  }, [activeCourseData]);

  const courseComparisonData = useMemo(() => {
    if (!analytics) return [];
    return analytics.course_analytics?.map(c => ({
      course: c.course_id, average: c.average, max: c.max, min: c.min, students: c.total_students,
    })) || [];
  }, [analytics]);

  const attendancePieData = useMemo(() => {
    if (!activeAttendance) return [];
    return [
      { name: 'Present', value: activeAttendance.present },
      { name: 'Absent', value: activeAttendance.absent },
    ];
  }, [activeAttendance]);

  const radarData = useMemo(() => {
    if (!analytics) return [];
    return analytics.course_analytics?.map(c => ({
      subject: c.course_id, average: c.average, students: c.total_students, fullMark: 100,
    })) || [];
  }, [analytics]);

  const COURSE_ID_REGEX = /^B[A-Z]{2}\d{3}$/;
  const validateCourseId = (value) => {
    if (!value) { setCourseIdError(''); return true; }
    const upper = value.toUpperCase();
    if (!COURSE_ID_REGEX.test(upper)) {
      setCourseIdError('Course ID must be in format BXXNNN (e.g., BCS101, BEC201)');
      return false;
    }
    setCourseIdError('');
    return true;
  };
  const handleCourseIdChange = (e) => {
    const val = e.target.value.toUpperCase();
    setCourseId(val);
    validateCourseId(val);
  };

  // Fetch students list on component mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await studentService.getStudentsList();
        setStudentsList(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };
    fetchStudents();
    fetchAnalytics();
  }, []);

  // Handle student selection from dropdown
  const handleStudentSelect = (e) => {
    const id = e.target.value;
    setStudentId(id);
    const student = studentsList.find(s => s.id === id);
    setSelectedStudent(student);
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      await lecturerService.markAttendance({
        lecture_id: lectureId,
        student_id: studentId,
        status: status,
      });
      setMessage('Attendance marked successfully');
      setLectureId('');
      setStudentId('');
      setSelectedStudent(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error marking attendance: ' + error.response?.data?.detail);
    }
  };

  const handleInputGrades = async (e) => {
    e.preventDefault();
    if (!validateCourseId(courseId)) return;
    try {
      await lecturerService.inputGrades({
        student_id: studentId,
        course_id: courseId,
        score: parseFloat(score),
      });
      setMessage('Grade recorded successfully');
      setStudentId('');
      setSelectedStudent(null);
      setCourseId('');
      setScore('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error recording grade: ' + error.response?.data?.detail);
    }
  };

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    try {
      await lecturerService.submitFeedback({
        student_id: studentId,
        feedback_text: feedback,
      });
      setMessage('Feedback submitted successfully');
      setStudentId('');
      setSelectedStudent(null);
      setFeedback('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error submitting feedback: ' + error.response?.data?.detail);
    }
  };

  const handleCreateLecture = async (e) => {
    e.preventDefault();
    if (!validateCourseId(courseId)) return;
    try {
      const dateTimeStr = lectureTime ? `${lectureDate}T${lectureTime}` : `${lectureDate}T09:00`;
      await lecturerService.createLecture({
        course_id: courseId,
        date: dateTimeStr,
      });
      setMessage('Lecture created successfully');
      setCourseId('');
      setLectureDate('');
      setLectureTime('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error creating lecture: ' + error.response?.data?.detail);
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Lecturer Dashboard</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="tabs">
          <button
            className={`tab ${tab === 'attendance' ? 'active' : ''}`}
            onClick={() => setTab('attendance')}
          >
            Mark Attendance
          </button>
          <button
            className={`tab ${tab === 'grades' ? 'active' : ''}`}
            onClick={() => setTab('grades')}
          >
            Input Grades
          </button>
          <button
            className={`tab ${tab === 'feedback' ? 'active' : ''}`}
            onClick={() => setTab('feedback')}
          >
            Feedback
          </button>
          <button
            className={`tab ${tab === 'lecture' ? 'active' : ''}`}
            onClick={() => setTab('lecture')}
          >
            Create Lecture
          </button>
          <button
            className={`tab ${tab === 'analytics' ? 'active' : ''}`}
            onClick={() => setTab('analytics')}
          >
            📊 Analytics
          </button>
        </div>

        <div className="content">
          {message && <div className="message">{message}</div>}

          {tab === 'attendance' && (
            <div className="form-section">
              <h2>Mark Attendance</h2>
              <form onSubmit={handleMarkAttendance}>
                <div className="form-group">
                  <label>Lecture ID:</label>
                  <input
                    type="text"
                    value={lectureId}
                    onChange={(e) => setLectureId(e.target.value)}
                    placeholder="e.g., Lecture ID from created lecture"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Select Student:</label>
                  <select value={studentId} onChange={handleStudentSelect} required>
                    <option value="">-- Choose a student --</option>
                    {studentsList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.id.slice(-6)})
                      </option>
                    ))}
                  </select>
                  {selectedStudent && (
                    <small className="helper-text">
                      Student: {selectedStudent.name} • {selectedStudent.email}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Attendance Status:</label>
                  <div className="status-options">
                    <button
                      type="button"
                      className={`status-btn ${status === 'present' ? 'active-present' : ''}`}
                      onClick={() => setStatus('present')}
                    >
                      ✓ Present
                    </button>
                    <button
                      type="button"
                      className={`status-btn ${status === 'absent' ? 'active-absent' : ''}`}
                      onClick={() => setStatus('absent')}
                    >
                      ✗ Absent
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary">Mark Attendance</button>
              </form>
            </div>
          )}

          {tab === 'grades' && (
            <div className="form-section">
              <h2>Input Grades</h2>
              <form onSubmit={handleInputGrades}>
                <div className="form-group">
                  <label>Select Student:</label>
                  <select value={studentId} onChange={handleStudentSelect} required>
                    <option value="">-- Choose a student --</option>
                    {studentsList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.id.slice(-6)})
                      </option>
                    ))}
                  </select>
                  {selectedStudent && (
                    <small className="helper-text">
                      Student: {selectedStudent.name} • {selectedStudent.email}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Course ID:</label>
                  <input
                    type="text"
                    value={courseId}
                    onChange={handleCourseIdChange}
                    placeholder="e.g., BCS101"
                    required
                  />
                  {courseIdError && <small className="field-error">{courseIdError}</small>}
                </div>
                <div className="form-group">
                  <label>Score (0-100):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter score"
                    required
                  />
                  {score && <div className="score-display">📊 Score: {score}%</div>}
                </div>
                <button type="submit" className="btn btn-primary">Record Grade</button>
              </form>
            </div>
          )}

          {tab === 'feedback' && (
            <div className="form-section">
              <h2>Submit Feedback</h2>
              <form onSubmit={handleSubmitFeedback}>
                <div className="form-group">
                  <label>Select Student:</label>
                  <select value={studentId} onChange={handleStudentSelect} required>
                    <option value="">-- Choose a student --</option>
                    {studentsList.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} ({student.id.slice(-6)})
                      </option>
                    ))}
                  </select>
                  {selectedStudent && (
                    <small className="helper-text">
                      Student: {selectedStudent.name} • {selectedStudent.email}
                    </small>
                  )}
                </div>
                <div className="form-group">
                  <label>Student Feedback/Comments:</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows="4"
                    placeholder="Enter constructive feedback for the student..."
                    required
                  ></textarea>
                  {feedback && <div className="char-count">📝 {feedback.length} characters</div>}
                </div>
                <button type="submit" className="btn btn-primary">Submit Feedback</button>
              </form>
            </div>
          )}

          {tab === 'lecture' && (
            <div className="form-section">
              <h2>Create Lecture</h2>
              <form onSubmit={handleCreateLecture}>
                <div className="form-group">
                  <label>Course ID:</label>
                  <input
                    type="text"
                    value={courseId}
                    onChange={handleCourseIdChange}
                    placeholder="e.g., BCS101"
                    required
                  />
                  {courseIdError && <small className="field-error">{courseIdError}</small>}
                </div>
                <div className="form-group">
                  <label>Lecture Date:</label>
                  <input
                    type="date"
                    value={lectureDate}
                    onChange={(e) => setLectureDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Lecture Time (optional):</label>
                  <input
                    type="time"
                    value={lectureTime}
                    onChange={(e) => setLectureTime(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Create Lecture</button>
              </form>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="analytics-section">
              {analyticsError ? (
                <div className="no-data-msg">
                  ⚠️ Failed to load analytics. <button className="btn btn-primary" style={{ marginLeft: '1rem', padding: '0.5rem 1.2rem' }} onClick={fetchAnalytics}>Retry</button>
                </div>
              ) : !analytics ? (
                <div className="no-data-msg">Loading analytics data...</div>
              ) : analytics.total_courses === 0 ? (
                <div className="no-data-msg">No course data yet. Start by creating lectures and recording grades.</div>
              ) : (
                <>
                  {/* Overview Cards */}
                  <div className="analytics-overview">
                    <div className="stat-card stat-card-cyan">
                      <span className="stat-value">{analytics.total_students}</span>
                      <span className="stat-label">Total Students</span>
                    </div>
                    <div className="stat-card stat-card-purple">
                      <span className="stat-value">{analytics.total_courses}</span>
                      <span className="stat-label">Courses</span>
                    </div>
                    <div className="stat-card stat-card-green">
                      <span className="stat-value">{analytics.total_lectures_created}</span>
                      <span className="stat-label">Lectures Created</span>
                    </div>
                    <div className="stat-card stat-card-orange">
                      <span className="stat-value">{analytics.total_feedback_given}</span>
                      <span className="stat-label">Feedback Given</span>
                    </div>
                  </div>

                  {/* Course Selector */}
                  {analytics.courses?.length > 0 && (
                    <div className="course-selector">
                      <label>Select Course:</label>
                      <div className="course-chips">
                        {analytics.courses.map(c => (
                          <button
                            key={c}
                            className={`course-chip ${selectedCourse === c ? 'active' : ''}`}
                            onClick={() => setSelectedCourse(c)}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Course Comparison Bar Chart */}
                  {courseComparisonData.length > 0 && (
                    <div className="charts-row">
                      <div className="chart-card chart-card-wide">
                        <h3 className="chart-title">Course Average Comparison</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={courseComparisonData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="course" stroke="#aaa" />
                            <YAxis domain={[0, 100]} stroke="#aaa" />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="average" fill={COLORS.cyan} name="Average" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="max" fill={COLORS.green} name="Max" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="min" fill={COLORS.magenta} name="Min" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Per-Course Charts */}
                  {activeCourseData && (
                    <>
                      <h2 className="section-heading">📘 {selectedCourse} — Detailed Analytics</h2>

                      <div className="charts-row">
                        {/* Grade Distribution Pie */}
                        <div className="chart-card">
                          <h3 className="chart-title">Grade Distribution</h3>
                          {distributionData.some(d => d.count > 0) ? (
                            <ResponsiveContainer width="100%" height={280}>
                              <PieChart>
                                <Pie
                                  data={distributionData}
                                  dataKey="count"
                                  nameKey="grade"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={90}
                                  innerRadius={45}
                                  label={({ grade, count }) => count > 0 ? `${grade}: ${count}` : ''}
                                  stroke="rgba(0,0,0,0.3)"
                                  strokeWidth={2}
                                >
                                  {distributionData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                  ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="no-data-msg">No grades recorded yet</div>
                          )}
                        </div>

                        {/* Student Scores Bar Chart */}
                        <div className="chart-card">
                          <h3 className="chart-title">Student Scores</h3>
                          {studentScoresData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={280}>
                              <BarChart data={studentScoresData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis type="number" domain={[0, 100]} stroke="#aaa" />
                                <YAxis dataKey="name" type="category" width={80} stroke="#aaa" tick={{ fontSize: 12 }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="score" name="Score" radius={[0, 6, 6, 0]}>
                                  {studentScoresData.map((entry, i) => (
                                    <Cell
                                      key={i}
                                      fill={
                                        entry.score >= 80 ? COLORS.green :
                                        entry.score >= 60 ? COLORS.cyan :
                                        entry.score >= 40 ? COLORS.orange :
                                        COLORS.magenta
                                      }
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="no-data-msg">No scores available</div>
                          )}
                        </div>
                      </div>

                      <div className="charts-row">
                        {/* Attendance Pie */}
                        <div className="chart-card">
                          <h3 className="chart-title">Attendance Overview</h3>
                          {activeAttendance && activeAttendance.total_lectures > 0 ? (
                            <>
                              <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                  <Pie
                                    data={attendancePieData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    innerRadius={40}
                                    label={({ name, value }) => `${name}: ${value}`}
                                    stroke="rgba(0,0,0,0.3)"
                                    strokeWidth={2}
                                  >
                                    <Cell fill={COLORS.green} />
                                    <Cell fill={COLORS.magenta} />
                                  </Pie>
                                  <Tooltip content={<CustomTooltip />} />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="attendance-rate-badge">
                                {activeAttendance.attendance_rate}% Attendance Rate
                              </div>
                            </>
                          ) : (
                            <div className="no-data-msg">No attendance data yet</div>
                          )}
                        </div>

                        {/* Course Stats Card */}
                        <div className="chart-card">
                          <h3 className="chart-title">Course Stats</h3>
                          <div className="course-stats-grid">
                            <div className="mini-stat">
                              <span className="mini-stat-val" style={{ color: COLORS.cyan }}>{activeCourseData.total_students}</span>
                              <span className="mini-stat-label">Students</span>
                            </div>
                            <div className="mini-stat">
                              <span className="mini-stat-val" style={{ color: COLORS.green }}>{activeCourseData.average}</span>
                              <span className="mini-stat-label">Average</span>
                            </div>
                            <div className="mini-stat">
                              <span className="mini-stat-val" style={{ color: COLORS.purple }}>{activeCourseData.max}</span>
                              <span className="mini-stat-label">Highest</span>
                            </div>
                            <div className="mini-stat">
                              <span className="mini-stat-val" style={{ color: COLORS.magenta }}>{activeCourseData.min}</span>
                              <span className="mini-stat-label">Lowest</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Radar Chart — Multi-course comparison */}
                  {radarData.length > 1 && (
                    <div className="charts-row">
                      <div className="chart-card chart-card-wide">
                        <h3 className="chart-title">Multi-Course Performance Radar</h3>
                        <ResponsiveContainer width="100%" height={320}>
                          <RadarChart data={radarData}>
                            <PolarGrid stroke="rgba(255,255,255,0.15)" />
                            <PolarAngleAxis dataKey="subject" stroke="#aaa" />
                            <PolarRadiusAxis domain={[0, 100]} stroke="#555" />
                            <Radar name="Average Score" dataKey="average" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.3} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* At-Risk Students */}
                  {analytics.at_risk_students?.length > 0 && (
                    <div className="at-risk-section">
                      <h2 className="section-heading warning-heading">⚠️ At-Risk Students (Score &lt; 50)</h2>
                      <div className="at-risk-table-container">
                        <table className="at-risk-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Student</th>
                              <th>Course</th>
                              <th>Score</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.at_risk_students.map((s, i) => (
                              <tr key={i}>
                                <td>{i + 1}</td>
                                <td>{s.student_name}</td>
                                <td>{s.course_id}</td>
                                <td>
                                  <span className="score-badge danger">{s.score}%</span>
                                </td>
                                <td>
                                  <span className="risk-tag">
                                    {s.score < 30 ? '🔴 Critical' : '🟡 Warning'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Score Distribution Area Chart per course */}
                  {studentScoresData.length > 0 && activeCourseData && (
                    <div className="charts-row">
                      <div className="chart-card chart-card-wide">
                        <h3 className="chart-title">Score Spread — {selectedCourse}</h3>
                        <ResponsiveContainer width="100%" height={260}>
                          <AreaChart data={studentScoresData}>
                            <defs>
                              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.6} />
                                <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0.05} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                            <XAxis dataKey="name" stroke="#aaa" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} stroke="#aaa" />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="score" stroke={COLORS.cyan} fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: COLORS.cyan, r: 4 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
