import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 20px', backgroundColor: '#2c3e50', color: 'white'
    }}>
      <div>
        <Link to="/" style={{ color: 'white', fontWeight: 'bold', fontSize: '1.5rem', textDecoration: 'none' }}>
          DocCollab
        </Link>
      </div>
      <div>
        {!token ? (
          <>
            <Link to="/login" style={{ color: 'white', marginRight: '15px' }}>Login</Link>
            <Link to="/register" style={{ color: 'white' }}>Register</Link>
          </>
        ) : (
          <>
            <Link to="/dashboard" style={{ color: 'white', marginRight: '15px' }}>Dashboard</Link>
            <Link to="/profile" style={{ color: 'white', marginRight: '15px' }}>Profile</Link>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: '#e74c3c',
                border: 'none',
                color: 'white',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;