import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../api';
import { AuthContext } from '../context/AuthContext';
import { LogOut, Layout, Users, Power, Calendar, Clock, BookOpen } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const SUBJECTS = ["DAA", "java", "CC", "OS", "SE", "softskills", "aptitude"];
const TIME_SLOTS = [
  "9:30 - 10:30",
  "10:30 - 11:30",
  "11:30 - 12:30",
  "1:30 - 2:30",
  "2:30 - 3:30",
  "3:30 - 4:30"
];

const DEFAULT_SCAN_HOST = "172.29.210.170";

function AdminDashboard() {
  const { logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('session'); // 'session' | 'history' | 'profile'
  const [sessionData, setSessionData] = useState(null);
  const [records, setRecords] = useState([]);
  const [history, setHistory] = useState([]);
  const [profile, setProfile] = useState({ name: '', empId: '', profileImage: '' });
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    subject: SUBJECTS[0],
    date: new Date().toISOString().split('T')[0],
    timePeriod: TIME_SLOTS[0]
  });

  const currentHost = window.location.hostname;
  const isLocalhost = currentHost === 'localhost' || currentHost === '127.0.0.1';
  const [hostIp, setHostIp] = useState(() => {
    const savedHost = localStorage.getItem('scanHost');
    if (savedHost && savedHost !== "172.25.84.86") return savedHost;
    return isLocalhost ? DEFAULT_SCAN_HOST : currentHost;
  });

  useEffect(() => {
    localStorage.setItem('scanHost', hostIp.trim());
  }, [hostIp]);

  // Fetch Profile on Load
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/profile');
        setProfile(res.data);
      } catch (err) {
        console.error("Profile load error:", err);
      }
    };
    fetchProfile();
  }, []);

  const fetchRecords = useCallback(async (token) => {
    const sessionToken = token || sessionData?.sessionToken;
    if (!sessionToken) return;
    try {
      const res = await api.get(`/attendance/records/${sessionToken}`);
      setRecords(res.data || []);
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [sessionData]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get('/attendance/history');
      setHistory(res.data || []);
    } catch (err) {
      console.error("History error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!sessionData?.sessionToken || !sessionData?.active) return;
    
    fetchRecords();
    const interval = setInterval(() => fetchRecords(), 3000);
    return () => clearInterval(interval);
  }, [sessionData?.sessionToken, sessionData?.active, fetchRecords]);

  const generateSession = async (e) => {
    e.preventDefault();
    setSessionData(null); // Force clear old state
    setLoading(true);
    try {
      const res = await api.post('/attendance/generate-qr', form);
      // Add a timestamp to force QR canvas refresh even if everything else is similar
      setSessionData({ ...res.data, isViewing: true, ts: Date.now() });
      setRecords([]); 
    } catch (err) {
      alert("Error creating session.");
    }
    setLoading(false);
  };

  const stopAttendance = async () => {
    if (!sessionData?.sessionToken) return;
    try {
      await api.post(`/attendance/session/${sessionData.sessionToken}/stop`);
      // Update local state to reflect stopped
      setSessionData(prev => prev ? ({ ...prev, active: false }) : null);
    } catch (err) {
      console.error(err);
    }
  };

  const viewHistoryDetail = (session) => {
    setSessionData({ ...session, isViewing: true });
    setRecords([]); // Clear old records
    fetchRecords(session.sessionToken); // Immediate fetch
    setActiveTab('session');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/profile', profile);
      alert("Profile updated successfully!");
    } catch (err) {
      alert("Failed to update profile.");
    }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const scanHost = hostIp.trim() || (isLocalhost ? DEFAULT_SCAN_HOST : currentHost);
  const scanOrigin = scanHost.startsWith('http://') || scanHost.startsWith('https://')
    ? scanHost.replace(/\/$/, '')
    : `http://${scanHost}:5173`;
  const shareUrl = sessionData?.sessionToken 
    ? `${scanOrigin}/scan/${sessionData.sessionToken}?v=${sessionData.ts || 'live'}` 
    : "";

  return (
    <div className="container animate-fade-in" style={{ color: 'white' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {profile.profileImage ? (
            <img src={profile.profileImage} alt="Profile" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}/>
          ) : (
            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={24} />
            </div>
          )}
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.2rem' }}>{profile.name || 'Admin'} Portal</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{profile.empId ? `EMP ID: ${profile.empId}` : 'Manage your attendance sessions'}</p>
          </div>
        </div>
        <button onClick={logout} className="btn btn-danger" style={{ padding: '8px 16px' }}><LogOut size={18} /> Logout</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>
        <button 
          onClick={() => setActiveTab('session')} 
          className={`btn ${activeTab === 'session' ? 'btn-accent' : ''}`} 
          style={{ background: activeTab === 'session' ? '' : 'transparent', border: activeTab === 'session' ? '' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layout size={18} /> New Session
        </button>
        <button 
          onClick={() => { setActiveTab('history'); fetchHistory(); }} 
          className={`btn ${activeTab === 'history' ? 'btn-accent' : ''}`}
          style={{ background: activeTab === 'history' ? '' : 'transparent', border: activeTab === 'history' ? '' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} /> History
        </button>
        <button 
          onClick={() => setActiveTab('profile')} 
          className={`btn ${activeTab === 'profile' ? 'btn-accent' : ''}`}
          style={{ background: activeTab === 'profile' ? '' : 'transparent', border: activeTab === 'profile' ? '' : 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> Profile
        </button>
      </div>

      <div style={{ minHeight: '60vh' }}>
        
        {/* SESSION TAB */}
        {activeTab === 'session' && (
          <div style={{ display: 'grid', gridTemplateColumns: sessionData?.isViewing ? '1.2fr 2fr' : '1fr', gap: '2rem', transition: 'all 0.5s ease' }}>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              {!sessionData?.isViewing ? (
                <form onSubmit={generateSession}>
                  <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <Layout size={40} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}/>
                    <h3>Create QR Session</h3>
                  </div>

                  <div className="input-group">
                    <label><BookOpen size={14} /> Subject</label>
                    <select className="input-field" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})}>
                      {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="input-group">
                    <label><Calendar size={14} /> Date</label>
                    <input type="date" className="input-field" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                  </div>

                  <div className="input-group">
                    <label><Clock size={14} /> Time Period</label>
                    <select className="input-field" value={form.timePeriod} onChange={e => setForm({...form, timePeriod: e.target.value})}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <button className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                    {loading ? 'Creating...' : 'Generate Attendance QR'}
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center' }} className="animate-fade-in">
                  <button onClick={() => setSessionData(null)} className="btn" style={{ marginBottom: '1rem', fontSize: '0.75rem', padding: '5px 10px', background: 'rgba(255,255,255,0.05)' }}>
                    + New Session
                  </button>
                  
                  {sessionData.active && (
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)', position: 'relative' }}>
                      {shareUrl && <QRCodeCanvas value={shareUrl} size={220} />}
                      <span style={{ color: '#666', fontSize: '0.65rem', fontFamily: 'monospace' }}>
                        ID: {sessionData.sessionToken.slice(0, 8)}... (Generated {new Date(sessionData.ts).toLocaleTimeString()})
                      </span>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', justifyContent: 'center', marginBottom: '1rem' }}>
                      {profile.profileImage && <img src={profile.profileImage} alt="Sir" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}/>}
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{profile.name || 'Professor'}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{profile.empId}</p>
                      </div>
                    </div>
                    {sessionData.active ? (
                      <h4 style={{ color: 'var(--success)', marginBottom: '0.2rem' }}>Session Active</h4>
                    ) : (
                      <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Session Closed</h4>
                    )}
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{sessionData?.subject} | {sessionData?.timePeriod}</p>
                    
                    <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
                      {sessionData.active && (
                        <>
                          <div className="input-group" style={{ marginBottom: '0.25rem', textAlign: 'left' }}>
                            <label>Phone Scan Host</label>
                            <input
                              type="text"
                              className="input-field"
                              value={hostIp}
                              onChange={e => setHostIp(e.target.value)}
                              placeholder="Wi-Fi IP or public https URL"
                              style={{ fontSize: '0.85rem' }}
                            />
                          </div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', wordBreak: 'break-all', marginBottom: '0.5rem' }}>
                            {shareUrl}
                          </p>
                          <button onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            alert("URL Copied!");
                          }} className="btn btn-accent" style={{ width: '100%', opacity: 0.9 }}>Copy Scan Link</button>
                          <button onClick={stopAttendance} className="btn btn-danger" style={{ width: '100%' }}>
                            <Power size={18} /> Stop Session
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {sessionData?.isViewing && (
              <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={24} style={{ color: 'var(--accent)' }}/>
                    <h3>{sessionData.active ? 'Live Attendee Log' : 'Historical Records'}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {sessionData.active && (
                      <span className="pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }}></span>
                    )}
                    <span style={{ fontSize: '0.8rem', background: 'rgba(34, 211, 238, 0.1)', padding: '4px 12px', borderRadius: '20px', color: 'var(--accent)' }}>
                      {records.length} Present
                    </span>
                  </div>
                </div>
                
                <div style={{ overflowX: 'auto', maxHeight: '550px' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>UID</th>
                        <th>Name</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem' }}>{sessionData.active ? 'Waiting for scans...' : 'No records found for this session.'}</td></tr>
                      ) : (
                        records.map(record => (
                          <tr key={record.id}>
                            <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{record.studentUid}</td>
                            <td>{record.studentName}</td>
                            <td>{new Date(record.scannedAt).toLocaleTimeString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
            <h3>Attendance History</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Review all past attendance sessions.</p>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem' }}>No history found.</td></tr>
                  ) : (
                    history.map(s => (
                      <tr key={s.id}>
                        <td>{s.date}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.subject}</td>
                        <td>{s.timePeriod}</td>
                        <td>{s.active ? <span style={{ color: 'var(--success)' }}>Active</span> : <span style={{ color: 'var(--text-muted)' }}>Closed</span>}</td>
                        <td>
                          <button onClick={() => viewHistoryDetail(s)} className="btn btn-accent" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>View Details</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="glass-panel animate-fade-in" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
            <h3>Admin Profile</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Update your personal and professional details.</p>
            
            <form onSubmit={handleProfileUpdate}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
                <div style={{ position: 'relative' }}>
                  {profile.profileImage ? (
                    <img src={profile.profileImage} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--accent)' }}/>
                  ) : (
                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px dashed rgba(255,255,255,0.1)' }}>
                      <Users size={48} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                  )}
                  <label style={{ position: 'absolute', bottom: '0', right: '0', background: 'var(--accent)', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}>
                    <Layout size={16} />
                    <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label>Full Name</label>
                <input type="text" className="input-field" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} placeholder="e.g. Dr. Satya Kumar" />
              </div>

              <div className="input-group">
                <label>EMP ID</label>
                <input type="text" className="input-field" value={profile.empId} onChange={e => setProfile({...profile, empId: e.target.value})} placeholder="e.g. EMP-2024-001" />
              </div>

              <div className="input-group">
                <label>Email (Account)</label>
                <input type="text" className="input-field" value={profile.email} disabled style={{ opacity: 0.5 }} />
              </div>

              <button className="btn btn-accent" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
                {loading ? 'Updating...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
