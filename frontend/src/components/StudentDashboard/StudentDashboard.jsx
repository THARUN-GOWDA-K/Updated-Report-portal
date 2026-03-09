import React, { useState, useEffect, useMemo } from 'react';
import { studentService, reportService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState('progress');
  const [attendance, setAttendance] = useState(null);
  const [grades, setGrades] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [attendanceRes, gradesRes, feedbackRes, profileRes] = await Promise.all([
        studentService.getAttendance(),
        studentService.getGrades(),
        studentService.getFeedback(),
        studentService.getProfile(),
      ]);
      
      setAttendance(attendanceRes.data);
      setGrades(gradesRes.data);
      setFeedback(feedbackRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const downloadReport = async () => {
    try {
      const reportData = await reportService.generateReport();
      const data = reportData.data;

      // Create PDF using jsPDF
      const pdf = new jsPDF();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('Academic Report Card', 20, yPosition);
      yPosition += 15;

      // Student Info
      pdf.setFontSize(12);
      pdf.text(`Name: ${data.student_name}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Email: ${data.email}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Generated: ${new Date(data.generated_at).toLocaleDateString()}`, 20, yPosition);
      yPosition += 15;

      // Attendance Section
      pdf.setFontSize(14);
      pdf.text('Attendance', 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Total Lectures: ${data.attendance.total_lectures}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Present: ${data.attendance.present}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Absent: ${data.attendance.absent}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Attendance %: ${data.attendance.percentage.toFixed(2)}%`, 20, yPosition);
      yPosition += 15;

      // Grades Section
      pdf.setFontSize(14);
      pdf.text('Grades', 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(11);
      pdf.text(`Courses: ${data.grades.courses}`, 20, yPosition);
      yPosition += 6;
      pdf.text(`Average Score: ${data.grades.average.toFixed(2)}`, 20, yPosition);
      yPosition += 12;

      // Feedback Section
      pdf.setFontSize(14);
      pdf.text('Feedback from Lecturers', 20, yPosition);
      yPosition += 8;
      pdf.setFontSize(10);
      data.feedback.records.forEach((fb, index) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. From: ${fb.lecturer_name}`, 20, yPosition);
        yPosition += 5;
        const splitText = pdf.splitTextToSize(fb.feedback_text, 170);
        pdf.text(splitText, 25, yPosition);
        yPosition += splitText.length * 5 + 5;
      });

      // Save PDF
      pdf.save(`academic_report_${data.student_name}.pdf`);
    } catch (error) {
      alert('Error generating report: ' + error.message);
    }
  };

  // --- Chart color palette ---
  const COLORS = {
    cyan: '#00d4ff',
    magenta: '#ff006e',
    green: '#39ff14',
    purple: '#a78bfa',
    orange: '#ff9f43',
    pink: '#ff6b9d',
    teal: '#00ffff',
    yellow: '#ffe066',
  };
  const PIE_COLORS = [COLORS.cyan, COLORS.magenta];
  const BAR_COLORS = [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.orange, COLORS.pink, COLORS.teal, COLORS.yellow, COLORS.magenta];

  // --- Derived chart data ---
  const attendancePieData = useMemo(() => {
    if (!attendance) return [];
    return [
      { name: 'Present', value: attendance.present || 0 },
      { name: 'Absent', value: attendance.absent || 0 },
    ];
  }, [attendance]);

  const gradesBarData = useMemo(() => {
    if (!grades?.grades) return [];
    return grades.grades.map((g) => ({
      course: g.course_id,
      score: g.score,
    }));
  }, [grades]);

  const gradesTrendData = useMemo(() => {
    if (!grades?.grades) return [];
    const sorted = [...grades.grades].sort(
      (a, b) => new Date(a.graded_at || 0) - new Date(b.graded_at || 0)
    );
    let runningTotal = 0;
    return sorted.map((g, i) => {
      runningTotal += g.score;
      return {
        index: i + 1,
        course: g.course_id,
        score: g.score,
        average: Math.round((runningTotal / (i + 1)) * 100) / 100,
      };
    });
  }, [grades]);

  const radarData = useMemo(() => {
    if (!grades?.grades) return [];
    return grades.grades.map((g) => ({
      subject: g.course_id,
      score: g.score,
      fullMark: 100,
    }));
  }, [grades]);

  const getGradeLabel = (score) => {
    if (score >= 90) return { label: 'A+', color: COLORS.green };
    if (score >= 80) return { label: 'A', color: COLORS.cyan };
    if (score >= 70) return { label: 'B', color: COLORS.teal };
    if (score >= 60) return { label: 'C', color: COLORS.yellow };
    if (score >= 50) return { label: 'D', color: COLORS.orange };
    return { label: 'F', color: COLORS.magenta };
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="chart-tooltip-label">{label || payload[0].name}</p>
          {payload.map((entry, i) => (
            <p key={i} style={{ color: entry.color || entry.fill }}>
              {entry.name || entry.dataKey}: <strong>{entry.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="dashboard"><p>Loading...</p></div>;
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="tabs">
          <button
            className={`tab ${tab === 'progress' ? 'active' : ''}`}
            onClick={() => setTab('progress')}
          >
            Progress Report
          </button>
          <button
            className={`tab ${tab === 'attendance' ? 'active' : ''}`}
            onClick={() => setTab('attendance')}
          >
            Attendance
          </button>
          <button
            className={`tab ${tab === 'grades' ? 'active' : ''}`}
            onClick={() => setTab('grades')}
          >
            Grades
          </button>
          <button
            className={`tab ${tab === 'feedback' ? 'active' : ''}`}
            onClick={() => setTab('feedback')}
          >
            Feedback
          </button>
          <button
            className={`tab ${tab === 'download' ? 'active' : ''}`}
            onClick={() => setTab('download')}
          >
            Download Report
          </button>
        </div>

        <div className="content">
          {tab === 'progress' && (
            <div className="progress-section">
              <h2>Academic Progress</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Attendance</h3>
                  <p className="big-number">{attendance?.percentage?.toFixed(1)}%</p>
                  <p>{attendance?.present}/{attendance?.total_lectures} lectures</p>
                </div>
                <div className="stat-card">
                  <h3>Grade Average</h3>
                  <p className="big-number">{grades?.average?.toFixed(1)}</p>
                  <p>{grades?.total_courses} courses</p>
                </div>
                <div className="stat-card">
                  <h3>Feedback</h3>
                  <p className="big-number">{feedback?.total || 0}</p>
                  <p>from lecturers</p>
                </div>
              </div>

              {/* Overview Charts Row */}
              <div className="charts-row">
                {/* Attendance Donut */}
                <div className="chart-card">
                  <h3 className="chart-title">Attendance Overview</h3>
                  {attendance && attendance.total_lectures > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={attendancePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={95}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {attendancePieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ color: '#e0e8ff', fontSize: '0.85rem' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data-msg">No attendance data yet</p>
                  )}
                </div>

                {/* Scores by Subject Bar */}
                <div className="chart-card">
                  <h3 className="chart-title">Scores by Subject</h3>
                  {gradesBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={gradesBarData} barSize={36}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="course" stroke="#a0aec0" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} stroke="#a0aec0" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                          {gradesBarData.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data-msg">No grades data yet</p>
                  )}
                </div>
              </div>

              {/* Improvement Trend */}
              {gradesTrendData.length > 1 && (
                <div className="chart-card chart-card-wide">
                  <h3 className="chart-title">Score Improvement Trend</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={gradesTrendData}>
                      <defs>
                        <linearGradient id="gradCyan" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradPurple" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="course" stroke="#a0aec0" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#a0aec0" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#e0e8ff', fontSize: '0.85rem' }} />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke={COLORS.cyan}
                        strokeWidth={2.5}
                        fill="url(#gradCyan)"
                        name="Score"
                        dot={{ r: 4, fill: COLORS.cyan }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke={COLORS.purple}
                        strokeWidth={2}
                        strokeDasharray="6 3"
                        name="Running Avg"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {tab === 'attendance' && (
            <div className="attendance-section">
              <h2>Attendance Record</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Lectures</h3>
                  <p className="big-number">{attendance?.total_lectures || 0}</p>
                </div>
                <div className="stat-card stat-card-green">
                  <h3>Present</h3>
                  <p className="big-number">{attendance?.present || 0}</p>
                </div>
                <div className="stat-card stat-card-red">
                  <h3>Absent</h3>
                  <p className="big-number">{attendance?.absent || 0}</p>
                </div>
              </div>

              <div className="charts-row">
                <div className="chart-card">
                  <h3 className="chart-title">Attendance Breakdown</h3>
                  {attendance && attendance.total_lectures > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={attendancePieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={110}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {attendancePieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: '#e0e8ff', fontSize: '0.9rem' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data-msg">No attendance data available</p>
                  )}
                </div>

                <div className="chart-card">
                  <h3 className="chart-title">Attendance Rate</h3>
                  <div className="attendance-ring">
                    <div className="ring-container">
                      <svg viewBox="0 0 180 180" className="ring-svg">
                        <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
                        <circle
                          cx="90" cy="90" r="75"
                          fill="none"
                          stroke="url(#ringGrad)"
                          strokeWidth="14"
                          strokeLinecap="round"
                          strokeDasharray={`${(attendance?.percentage || 0) / 100 * 471} 471`}
                          transform="rotate(-90 90 90)"
                          style={{ transition: 'stroke-dasharray 1s ease' }}
                        />
                        <defs>
                          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={COLORS.cyan} />
                            <stop offset="100%" stopColor={COLORS.green} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="ring-label">
                        <span className="ring-value">{attendance?.percentage?.toFixed(1) || 0}%</span>
                        <span className="ring-subtitle">Attendance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'grades' && (
            <div className="grades-section">
              <h2>Grades</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Average Score</h3>
                  <p className="big-number">{grades?.average?.toFixed(1) || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Courses</h3>
                  <p className="big-number">{grades?.total_courses || 0}</p>
                </div>
                <div className="stat-card">
                  <h3>Best Score</h3>
                  <p className="big-number">
                    {grades?.grades?.length ? Math.max(...grades.grades.map(g => g.score)) : '-'}
                  </p>
                </div>
              </div>

              <div className="charts-row">
                {/* Radar chart – subject strengths */}
                <div className="chart-card">
                  <h3 className="chart-title">Subject Strengths</h3>
                  {radarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={310}>
                      <RadarChart data={radarData} outerRadius="75%">
                        <PolarGrid stroke="rgba(255,255,255,0.12)" />
                        <PolarAngleAxis dataKey="subject" stroke="#a0aec0" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar
                          name="Score"
                          dataKey="score"
                          stroke={COLORS.cyan}
                          fill={COLORS.cyan}
                          fillOpacity={0.25}
                          strokeWidth={2}
                        />
                        <Tooltip content={<CustomTooltip />} />
                      </RadarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data-msg">No grades available</p>
                  )}
                </div>

                {/* Bar chart – scores per subject */}
                <div className="chart-card">
                  <h3 className="chart-title">Score Distribution</h3>
                  {gradesBarData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={310}>
                      <BarChart data={gradesBarData} barSize={40}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="course" stroke="#a0aec0" tick={{ fontSize: 12 }} />
                        <YAxis domain={[0, 100]} stroke="#a0aec0" tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="score" radius={[8, 8, 0, 0]}>
                          {gradesBarData.map((_, i) => (
                            <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="no-data-msg">No grades available</p>
                  )}
                </div>
              </div>

              {/* Improvement trend */}
              {gradesTrendData.length > 1 && (
                <div className="chart-card chart-card-wide">
                  <h3 className="chart-title">Improvement Over Time</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={gradesTrendData}>
                      <defs>
                        <linearGradient id="gradCyan2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.35} />
                          <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="course" stroke="#a0aec0" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} stroke="#a0aec0" tick={{ fontSize: 12 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#e0e8ff', fontSize: '0.85rem' }} />
                      <Area type="monotone" dataKey="score" stroke={COLORS.cyan} strokeWidth={2.5} fill="url(#gradCyan2)" name="Score" dot={{ r: 4, fill: COLORS.cyan }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="average" stroke={COLORS.purple} strokeWidth={2} strokeDasharray="6 3" name="Running Average" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Grade table */}
              {grades?.grades && grades.grades.length > 0 && (
                <div className="grade-table-section">
                  <h3 className="chart-title">Detailed Grades</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course ID</th>
                        <th>Score</th>
                        <th>Grade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.grades.map(grade => {
                        const { label, color } = getGradeLabel(grade.score);
                        return (
                          <tr key={grade.id}>
                            <td>{grade.course_id}</td>
                            <td>
                              <div className="score-bar-cell">
                                <span>{grade.score}</span>
                                <div className="mini-bar">
                                  <div className="mini-bar-fill" style={{ width: `${grade.score}%`, background: color }} />
                                </div>
                              </div>
                            </td>
                            <td><span className="grade-badge" style={{ background: color }}>{label}</span></td>
                            <td style={{ color }}>{grade.score >= 50 ? 'Pass' : 'Fail'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'feedback' && (
            <div>
              <h2>Feedback from Lecturers</h2>
              {feedback?.feedback && feedback.feedback.length > 0 ? (
                <div className="feedback-list">
                  {feedback.feedback.map((fb, index) => (
                    <div key={index} className="feedback-card">
                      <div className="feedback-header">
                        <span className="feedback-number">#{index + 1}</span>
                        <h4>{fb.lecturer_name || 'Lecturer'}</h4>
                      </div>
                      <p>{fb.feedback_text}</p>
                      {fb.created_at && (
                        <small>{new Date(fb.created_at).toLocaleDateString()}</small>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data-msg">No feedback received yet</p>
              )}
            </div>
          )}

          {tab === 'download' && (
            <div className="download-section">
              <h2>Download Your Report</h2>
              <p>Generate and download your complete academic report card as PDF</p>
              <button onClick={downloadReport} className="btn btn-primary btn-large">
                Download Report (PDF)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
