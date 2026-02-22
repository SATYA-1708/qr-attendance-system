import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { UserCheck, Calendar, Clock, BookOpen, AlertCircle, CheckCircle, Users } from 'lucide-react';

function ScanPage() {
  const { token } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ studentUid: '', studentName: '' });
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', msg: string }
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(`/attendance/session/${token}`, { skipAuth: true });
        setSession(res.data);
      } catch (err) {
        console.error("Scan fetch error:", err);
        const detail = err.response?.data || err.message || "Network Error";
        setError(`Session details could not load: ${detail}`);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.studentUid.trim() || !formData.studentName.trim()) return;
    
    setStatus(null);
    setSubmitting(true);
    try {
      await api.post(
        '/attendance/mark',
        {
          sessionToken: token,
          studentUid: formData.studentUid.trim(),
          studentName: formData.studentName.trim()
        },
        { skipAuth: true }
      );
      setStatus({ type: 'success', msg: 'Attendance marked successfully!' });
      setFormData({ studentUid: '', studentName: '' });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data || err.message || "Failed to mark attendance." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '80vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', marginBottom: '1rem' }}>
            <UserCheck size={32} style={{ color: 'var(--primary)' }} />
          </div>
          <h2 style={{ marginBottom: '0.5rem' }}>Mark Attendance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Please enter your details for the current session.</p>
        </div>

        {/* Teacher Profile Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          {session?.teacherImage ? (
            <img src={session.teacherImage} alt="Sir" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}/>
          ) : (
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
          )}
          <div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Professor</p>
            <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{session?.teacherName || 'Attendance'}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{session?.teacherEmpId || 'Open scan form'}</p>
          </div>
        </div>

        {error && (
          <div className="animate-fade-in" style={{ padding: '12px', borderRadius: '8px', marginBottom: '1.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.45)', display: 'flex', alignItems: 'center', gap: '12px', color: '#fbbf24' }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: '0.85rem' }}>{error}. You can still submit attendance below.</span>
          </div>
        )}

        {/* Session Info Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <BookOpen size={18} style={{ color: 'var(--accent)' }} />
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject</p>
              <p style={{ fontWeight: '600' }}>{session?.subject || 'Current QR Session'}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Date</p>
                <p style={{ fontWeight: '500' }}>{session?.date || 'Today'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={18} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Period</p>
                <p style={{ fontWeight: '500' }}>{session?.timePeriod || 'Active'}</p>
              </div>
            </div>
          </div>
        </div>

        {status && (
          <div className="animate-fade-in" style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            background: status.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: status.type === 'success' ? 'var(--success)' : 'var(--danger)'
          }}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span style={{ fontSize: '0.9rem' }}>{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Student UID</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. 21BCS1234" 
              value={formData.studentUid}
              onChange={e => setFormData({...formData, studentUid: e.target.value})}
              required
            />
          </div>
          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. Satya Kumar" 
              value={formData.studentName}
              onChange={e => setFormData({...formData, studentName: e.target.value})}
              required
            />
          </div>
          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Attendance'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ScanPage;
