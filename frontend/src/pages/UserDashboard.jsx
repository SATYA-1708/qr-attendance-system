import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { LogOut, User, CheckCircle } from 'lucide-react';

function UserDashboard() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh' }}>
      
      <div style={{ width: '100%', maxWidth: '500px', display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={logout} className="btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}><LogOut size={18} /> Logout</button>
      </div>

      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '3rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '50%', marginBottom: '1.5rem' }}>
          <User size={48} style={{ color: 'var(--accent)' }} />
        </div>
        
        <h2 style={{ marginBottom: '0.5rem' }}>Welcome, {user?.name || 'Student'}!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          You're logged in to the Attendance Portal. 
        </p>

        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} style={{ color: 'var(--success)' }} /> How to mark attendance:
          </h4>
          <ol style={{ paddingLeft: '1.2rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            <li>Locate the QR code displayed by your instructor.</li>
            <li>Use <strong>Google Lens</strong> or your phone's camera to scan it.</li>
            <li>Follow the link to enter your UID and Name.</li>
            <li>Submit and wait for the success confirmation!</li>
          </ol>
        </div>
        
        <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          No need to stay logged in on this page while scanning.
        </p>
      </div>
    </div>
  );
}

export default UserDashboard;
