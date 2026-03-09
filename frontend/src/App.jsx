import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './context/ProtectedRoute';
import HomePage from './components/Auth/HomePage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import LecturerDashboard from './components/LecturerDashboard/LecturerDashboard';
import StudentDashboard from './components/StudentDashboard/StudentDashboard';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/lecturer-dashboard"
            element={
              <ProtectedRoute requiredRole="lecturer">
                <LecturerDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

const UnauthorizedPage = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', textAlign: 'center', padding: '2rem'
  }}>
    <h1 style={{
      fontSize: '3rem', fontWeight: 800, marginBottom: '1rem',
      background: 'linear-gradient(135deg, #ff006e, #ff4fa4)',
      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
    }}>Access Denied</h1>
    <p style={{ color: '#b8c5ff', fontSize: '1.2rem', marginBottom: '2rem' }}>
      You don't have permission to access this page.
    </p>
    <a href="/" style={{
      padding: '0.9rem 2.5rem', borderRadius: '12px', fontWeight: 700,
      background: 'linear-gradient(135deg, rgba(0,255,200,0.3), rgba(0,255,100,0.2))',
      border: '2px solid #00ffcc', color: '#00ffff', textDecoration: 'none',
      textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.95rem',
      boxShadow: '0 0 25px rgba(0,255,180,0.4)'
    }}>Return Home</a>
  </div>
);

export default App;
