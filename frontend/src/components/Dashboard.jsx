import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Dashboard() {
    const [students, setStudents] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [me, setMe] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students'); // 'students' or 'approvals'
    const navigate = useNavigate();

    // Toolbar States
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState('All Departments');
    const [semFilter, setSemFilter] = useState('All Semesters');
    const [sortBy, setSortBy] = useState('name-asc'); // name-asc, name-desc, gpa-desc, gpa-asc

    const fetchPendingApprovals = async () => {
        try {
            const res = await api.get('/approvals/');
            setPendingUsers(res.data);
        } catch(err) {
            console.error("Failed to fetch approvals", err);
        }
    };

    const fetchStudents = async () => {
        try {
            const stdRes = await api.get('/students/');
            setStudents(stdRes.data);
        } catch(err) {
            console.error("Failed to fetch students", err);
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const meRes = await api.get('/students/me/');
                setMe(meRes.data);
                await fetchStudents();
            } catch (err) {
                if (err.response?.status === 404 && err.response?.data?.is_admin) {
                     setIsAdmin(true);
                     await fetchStudents();
                     await fetchPendingApprovals();
                } else if (err.response?.status === 401) {
                     navigate('/login');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    const handleApprove = async (id) => {
        try {
            await api.post(`/approvals/approve/${id}/`);
            await fetchPendingApprovals();
            await fetchStudents();
        } catch(err) {
            alert("Failed to approve user");
        }
    }

    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };

    // Helper to calculate student statistics from nested results
    const getStudentStats = (student) => {
        const results = student.results || [];
        if (results.length === 0) return { gpa: null, fails: 0 };
        
        const gradePoints = { 'O': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'F': 0 };
        const totalPoints = results.reduce((acc, curr) => acc + (gradePoints[curr.grade] || 0), 0);
        const gpa = (totalPoints / results.length).toFixed(2);
        
        const fails = results.filter(r => r.percentage < 50).length;
        return { gpa, fails };
    };

    // Compute unique departments in our student list for filter dropdown options
    const departmentsList = useMemo(() => {
        const depts = new Set(students.map(s => s.department));
        return ['All Departments', ...Array.from(depts).sort()];
    }, [students]);

    // Filtered and Sorted Students
    const processedStudents = useMemo(() => {
        let list = [...students];

        // 1. Search Query Filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            list = list.filter(s => 
                s.name.toLowerCase().includes(query) || 
                s.roll_number.toLowerCase().includes(query)
            );
        }

        // 2. Department Filter
        if (deptFilter !== 'All Departments') {
            list = list.filter(s => s.department === deptFilter);
        }

        // 3. Semester Filter
        if (semFilter !== 'All Semesters') {
            list = list.filter(s => s.semester.toString() === semFilter.toString());
        }

        // 4. Sorting
        list.sort((a, b) => {
            const statsA = getStudentStats(a);
            const statsB = getStudentStats(b);

            switch (sortBy) {
                case 'name-desc':
                    return b.name.localeCompare(a.name);
                case 'gpa-desc':
                    return (parseFloat(statsB.gpa) || 0) - (parseFloat(statsA.gpa) || 0);
                case 'gpa-asc':
                    return (parseFloat(statsA.gpa) || 0) - (parseFloat(statsB.gpa) || 0);
                case 'name-asc':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        return list;
    }, [students, searchQuery, deptFilter, semFilter, sortBy]);

    if (loading) return <div className="loading-spinner"></div>;

    if (me && !isAdmin) {
        navigate(`/student/${me.id}`);
        return null;
    }

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogoIcon />
                    <span>GradeA Admin</span>
                </div>
                <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                    {isAdmin && (
                        <div style={{display: 'flex', gap: '1rem', marginRight: '2rem'}}>
                            <button 
                                onClick={() => setActiveTab('students')}
                                style={{
                                    background: 'transparent', 
                                    color: activeTab === 'students' ? 'var(--accent)' : 'var(--text-muted)',
                                    fontWeight: activeTab === 'students' ? '700' : '500',
                                    borderBottom: activeTab === 'students' ? '2px solid var(--accent)' : 'none',
                                    paddingBottom: '4px'
                                }}
                            >
                                Directory
                            </button>
                            <button 
                                onClick={() => setActiveTab('approvals')}
                                style={{
                                    background: 'transparent', 
                                    color: activeTab === 'approvals' ? 'var(--warning)' : 'var(--text-muted)',
                                    fontWeight: activeTab === 'approvals' ? '700' : '500',
                                    borderBottom: activeTab === 'approvals' ? '2px solid var(--warning)' : 'none',
                                    paddingBottom: '4px'
                                }}
                            >
                                Approvals ({pendingUsers.length})
                            </button>
                        </div>
                    )}
                    <button className="logout-btn" onClick={logout}>Sign Out</button>
                </div>
            </nav>

            <div className="container">
                {activeTab === 'students' ? (
                    <>
                        <div className="page-header">
                            <h1 className="page-title">Student Directory</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Select a student to view academic details, schedule planners, and goals.</p>
                        </div>

                        {/* Toolbar Controls */}
                        <div className="toolbar">
                            <input 
                                type="text"
                                placeholder="Search by name or roll number..."
                                className="animated-input search-input"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />

                            <select 
                                className="filter-select"
                                value={deptFilter}
                                onChange={e => setDeptFilter(e.target.value)}
                            >
                                {departmentsList.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>

                            <select 
                                className="filter-select"
                                value={semFilter}
                                onChange={e => setSemFilter(e.target.value)}
                            >
                                <option value="All Semesters">All Semesters</option>
                                <option value="1">Semester 1</option>
                                <option value="2">Semester 2</option>
                                <option value="3">Semester 3</option>
                                <option value="4">Semester 4</option>
                                <option value="5">Semester 5</option>
                                <option value="6">Semester 6</option>
                                <option value="7">Semester 7</option>
                                <option value="8">Semester 8</option>
                            </select>

                            <select 
                                className="filter-select"
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                            >
                                <option value="name-asc">Name: A-Z</option>
                                <option value="name-desc">Name: Z-A</option>
                                <option value="gpa-desc">GPA: High to Low</option>
                                <option value="gpa-asc">GPA: Low to High</option>
                            </select>
                        </div>
                        
                        <div className="grid-dashboard">
                            {processedStudents.map(student => {
                                const { gpa, fails } = getStudentStats(student);
                                return (
                                    <div
                                        key={student.id}
                                        className="student-card"
                                        onClick={() => navigate(`/student/${student.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <h3 style={{ fontFamily: 'Outfit' }}>{student.name}</h3>
                                        <p style={{ marginBottom: '0.25rem' }}>Roll No: <strong>{student.roll_number}</strong></p>
                                        <p style={{ marginBottom: '0.25rem' }}>Dept: {student.department}</p>
                                        <p>Current Semester: {student.semester}</p>
                                        
                                        <div className="student-badge-container">
                                            {gpa ? (
                                                <span className="badge badge-gpa">
                                                    GPA: {gpa}
                                                </span>
                                            ) : (
                                                <span className="badge badge-gpa">
                                                    No Grades Yet
                                                </span>
                                            )}

                                            {fails > 0 && (
                                                <span className="badge badge-danger">
                                                    ⚠️ {fails} Critical Failures
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {processedStudents.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                    No matching students found in directory.
                                </p>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="page-header">
                            <h1 className="page-title" style={{color: 'var(--warning)'}}>Pending Approvals</h1>
                            <p style={{ color: 'var(--text-muted)' }}>Review and verify newly registered student accounts before they are granted system access.</p>
                        </div>

                        <div className="grid-dashboard">
                            {pendingUsers.map(user => (
                                <div key={user.id} className="student-card" style={{ borderColor: 'var(--warning)', position: 'relative' }}>
                                    <h3 style={{ fontFamily: 'Outfit' }}>{user.name}</h3>
                                    <p>Roll No: {user.roll_number}</p>
                                    <p>Email: {user.email}</p>
                                    <p>Department: {user.department}</p>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleApprove(user.id); }}
                                        style={{
                                            marginTop: '1rem',
                                            width: '100%',
                                            padding: '0.6rem',
                                            borderRadius: '6px',
                                            background: 'rgba(129, 178, 154, 0.15)',
                                            color: 'var(--success)',
                                            fontWeight: 600,
                                            border: '1px solid rgba(129, 178, 154, 0.3)'
                                        }}
                                        className="verify-btn"
                                    >
                                        Verify & Allow Access
                                    </button>
                                </div>
                            ))}
                            {pendingUsers.length === 0 && (
                                <p style={{ color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
                                    No pending approvals. All caught up!
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </>
    );
}

function LogoIcon({ size = 28 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent)" />
                    <stop offset="100%" stopColor="hsl(20, 35%, 78%)" />
                </linearGradient>
            </defs>
            <path d="M3 20L12 3L21 20" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8 13.5L11 16.5L19 7.5" stroke="url(#logoGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}
