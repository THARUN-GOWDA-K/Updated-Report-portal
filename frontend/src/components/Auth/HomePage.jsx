import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const { user } = useAuth();

  if (user) {
    const dashboardLinks = {
      admin: '/admin-dashboard',
      lecturer: '/lecturer-dashboard',
      student: '/student-dashboard',
    };

    return (
      <div className="home-page">
        <div className="container">
          <h1>Welcome to Annual Report Portal</h1>
          <p>Hello, {user.name}!</p>
          <Link 
            to={dashboardLinks[user.role]} 
            className="btn btn-primary"
          >
            Go to {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Annual Report Portal</h1>
        <p>Manage student reports efficiently</p>
        <div className="buttons">
          <Link to="/login" className="btn btn-primary">Login</Link>
          <Link to="/register" className="btn btn-secondary">Register</Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
