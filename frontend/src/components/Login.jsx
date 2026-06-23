import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
    const [isRegistering, setIsRegistering] = useState(false);
    
    // Login / Register common
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    
    // Exta for register
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [department, setDepartment] = useState('');
    const [semester, setSemester] = useState(1);
    
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);
        try {
            const res = await api.post('/token/', { username, password });
            localStorage.setItem('access', res.data.access);
            localStorage.setItem('refresh', res.data.refresh);
            navigate('/dashboard');
        } catch (err) {
            setError("Invalid credentials or Admin Approval pending.");
        }
    };
    
    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            const res = await api.post('/register/', {
                roll_number: username,
                password,
                name,
                email,
                department,
                semester: parseInt(semester)
            });
            setSuccessMsg(res.data.message);
            setIsRegistering(false);
            setPassword('');
        } catch(err) {
            setError(err.response?.data?.error || "Registration failed. Try again.");
        }
    }

    return (
        <div className="auth-container">
            <div className="glass-panel" style={{ width: '100%', maxWidth: '400px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <LogoIcon size={36} />
                    <h1 className="hero-title" style={{ margin: 0 }}>GradeA</h1>
                </div>
                <p className="hero-subtitle">Smart Student Result Viewer</p>
                {error && <div style={{ color: 'var(--danger)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}
                {successMsg && <div style={{ color: 'var(--success)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{successMsg}</div>}
                
                <form onSubmit={isRegistering ? handleRegister : handleLogin}>
                    <div className="input-group">
                        <label className="input-label">Username / Roll No.</label>
                        <input
                            type="text"
                            className="animated-input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    {isRegistering && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Full Name</label>
                                <input type="text" className="animated-input" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email</label>
                                <input type="email" className="animated-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Department</label>
                                <input type="text" className="animated-input" value={department} onChange={(e) => setDepartment(e.target.value)} required />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Current Semester</label>
                                <input type="number" min="1" max="8" className="animated-input" value={semester} onChange={(e) => setSemester(e.target.value)} required />
                            </div>
                        </>
                    )}
                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input
                            type="password"
                            className="animated-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    
                    <button type="submit" className="primary-btn">
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                    
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {isRegistering ? "Already have an account? " : "New to GradeA? "}
                        <span 
                            style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
                            onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                        >
                            {isRegistering ? 'Sign In' : 'Sign Up'}
                        </span>
                    </div>
                </form>
            </div>
        </div>
    );
}

function LogoIcon({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(28, 45%, 65%)" />
                    <stop offset="100%" stopColor="hsl(20, 35%, 78%)" />
                </linearGradient>
            </defs>
            <path d="M3 20L12 3L21 20" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 13.5L11 16.5L19 7.5" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
