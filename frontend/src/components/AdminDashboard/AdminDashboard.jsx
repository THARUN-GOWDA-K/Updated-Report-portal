import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('approvals');

  const fetchData = async (activeTab) => {
    setLoading(true);
    try {
      if (activeTab === 'approvals') {
        const response = await adminService.getPendingApprovals();
        setPendingUsers(response.data);
      } else if (activeTab === 'users') {
        const response = await adminService.getAllUsers();
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData(tab);
  }, []);

  const handleApprove = async (userId) => {
    try {
      await adminService.approveUser(userId);
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      alert('User approved successfully');
    } catch (error) {
      alert('Error approving user');
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminService.deleteUser(userId);
        setAllUsers(allUsers.filter(u => u.id !== userId));
        alert('User deleted successfully');
      } catch (error) {
        alert('Error deleting user');
      }
    }
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <h1>Admin Dashboard</h1>
        <div className="user-info">
          <span>{user?.name}</span>
          <button onClick={logout} className="btn btn-secondary">Logout</button>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="tabs">
          <button
            className={`tab ${tab === 'approvals' ? 'active' : ''}`}
            onClick={() => { setTab('approvals'); fetchData('approvals'); }}
          >
            Pending Approvals
          </button>
          <button
            className={`tab ${tab === 'users' ? 'active' : ''}`}
            onClick={() => { setTab('users'); fetchData('users'); }}
          >
            All Users
          </button>
        </div>

        <div className="content">
          {loading && <p>Loading...</p>}

          {tab === 'approvals' && !loading && (
            <div>
              <h2>Pending Teacher Approvals</h2>
              {pendingUsers.length === 0 ? (
                <p>No pending approvals</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="btn btn-success"
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'users' && !loading && (
            <div>
              <h2>All Users</h2>
              {allUsers.length === 0 ? (
                <p>No users found</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map(user => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.approval_status}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="btn btn-danger"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
