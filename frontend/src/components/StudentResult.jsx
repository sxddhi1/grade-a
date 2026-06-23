import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bar, Pie } from 'react-chartjs-2';
import ReactMarkdown from 'react-markdown';
import api from '../api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

export default function StudentResult() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [insights, setInsights] = useState(null);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [selectedSemester, setSelectedSemester] = useState('All Semesters');
    const [activeViewTab, setActiveViewTab] = useState('analytics'); // 'analytics', 'planner', 'goals'

    // Add Result State (Modal overlay)
    const [showAddForm, setShowAddForm] = useState(false);
    const [newSub, setNewSub] = useState('');
    const [newSem, setNewSem] = useState(1);
    const [newMarks, setNewMarks] = useState('');
    const [newMax, setNewMax] = useState(100);
    const [addLoading, setAddLoading] = useState(false);

    // Planner State
    const [plannerData, setPlannerData] = useState(null);
    const [weeklySchedule, setWeeklySchedule] = useState('');
    const [coursework, setCoursework] = useState('');
    const [plannerLoading, setPlannerLoading] = useState(false);

    // Todo List States
    const getTodayString = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const [todos, setTodos] = useState([]);
    const [newTodoTask, setNewTodoTask] = useState('');
    const [activeTodoDate, setActiveTodoDate] = useState(getTodayString());
    const [todoLoading, setTodoLoading] = useState(false);
    const [todoResources, setTodoResources] = useState('');
    const [selectedTodoForResources, setSelectedTodoForResources] = useState(null);
    const [showResourcesModal, setShowResourcesModal] = useState(false);
    const [resourcesLoading, setResourcesLoading] = useState(false);

    // PDF States
    const [documents, setDocuments] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [documentsLoading, setDocumentsLoading] = useState(false);

    const fetchTodos = async () => {
        try {
            const res = await api.get(`/students/${id}/todos/`);
            setTodos(res.data);
        } catch (err) {
            console.error("Failed to fetch todos", err);
        }
    };

    const fetchDocuments = async () => {
        setDocumentsLoading(true);
        try {
            const res = await api.get(`/students/${id}/documents/`);
            setDocuments(res.data);
            if (res.data.length > 0 && !selectedDoc) {
                setSelectedDoc(res.data[0]);
            }
        } catch (err) {
            console.error("Failed to fetch documents", err);
        } finally {
            setDocumentsLoading(false);
        }
    };

    const handleDateChange = (daysOffset) => {
        const currentDate = new Date(activeTodoDate);
        currentDate.setDate(currentDate.getDate() + daysOffset);
        const yyyy = currentDate.getFullYear();
        const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dd = String(currentDate.getDate()).padStart(2, '0');
        setActiveTodoDate(`${yyyy}-${mm}-${dd}`);
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodoTask.trim()) return;
        setTodoLoading(true);
        try {
            await api.post('/todos/', {
                student: id,
                date: activeTodoDate,
                task: newTodoTask,
                is_completed: false
            });
            setNewTodoTask('');
            await fetchTodos();
        } catch (err) {
            alert("Failed to add todo task.");
        } finally {
            setTodoLoading(false);
        }
    };

    const handleToggleTodo = async (todoId, isCompleted) => {
        try {
            await api.patch(`/todos/${todoId}/`, {
                is_completed: !isCompleted
            });
            setTodos(prev => prev.map(t => t.id === todoId ? { ...t, is_completed: !isCompleted } : t));
        } catch (err) {
            alert("Failed to update task.");
        }
    };

    const handleDeleteTodo = async (todoId) => {
        try {
            await api.delete(`/todos/${todoId}/`);
            setTodos(prev => prev.filter(t => t.id !== todoId));
        } catch (err) {
            alert("Failed to delete task.");
        }
    };

    const handleGetAIResources = async (todo) => {
        setSelectedTodoForResources(todo);
        setShowResourcesModal(true);
        setResourcesLoading(true);
        setTodoResources('');
        try {
            const res = await api.post(`/todos/${todo.id}/resources/`);
            setTodoResources(res.data.resources);
        } catch (err) {
            setTodoResources("Failed to fetch study resources. Please try again.");
        } finally {
            setResourcesLoading(false);
        }
    };

    const handlePdfUpload = async (file) => {
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            alert("File size exceeds the 5MB limit!");
            return;
        }
        if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
            alert("Only PDF files are supported!");
            return;
        }
        setUploadingPdf(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.post(`/students/${id}/documents/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setDocuments(prev => [res.data, ...prev]);
            setSelectedDoc(res.data);
            alert("PDF uploaded and notes generated successfully!");
        } catch (err) {
            console.error("PDF upload failed", err);
            alert(err.response?.data?.error || "Failed to process PDF file.");
        } finally {
            setUploadingPdf(false);
        }
    };

    const handleDeleteDocument = async (docId, e) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this document and its notes?")) return;
        try {
            await api.delete(`/documents/${docId}/`);
            setDocuments(prev => prev.filter(d => d.id !== docId));
            if (selectedDoc?.id === docId) {
                setSelectedDoc(null);
            }
        } catch (err) {
            alert("Failed to delete document.");
        }
    };

    const fetchStudentBase = async () => {
        try {
            const studRes = await api.get(`/students/${id}/`);
            setStudent(studRes.data);
            document.title = "reportcard";

            // Check admin status
            try {
                const meRes = await api.get('/students/me/');
                if (meRes.data.is_staff) setIsAdmin(true);
            } catch (err) {
                if (err.response?.status === 404 && err.response?.data?.is_admin) {
                    setIsAdmin(true);
                }
            }

            // Fetch existing planner data
            try {
                const planRes = await api.get(`/students/${id}/planner/`);
                setWeeklySchedule(planRes.data.weekly_schedule || '');
                setCoursework(planRes.data.coursework || '');
            } catch (err) {
                console.error("No planner data found:", err);
            }

        } catch (err) {
            console.error("Failed to fetch student:", err);
        } finally {
            setLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        fetchStudentBase();
        fetchTodos();
        fetchDocuments();
    }, [id]);

    // Fetch stats whenever semester or student object changes
    useEffect(() => {
        if (!student) return;

        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const query = selectedSemester !== 'All Semesters' ? `?semester=${selectedSemester}` : '';
                const [insRes, sumRes] = await Promise.all([
                    api.get(`/students/${id}/insights/${query}`),
                    api.get(`/students/${id}/summary/${query}`)
                ]);
                setInsights(insRes.data);
                setSummary(sumRes.data.summary);
            } catch (err) {
                console.error("Failed to fetch insights:", err);
                setInsights(null);
                setSummary("No AI data available for the selected parameters.");
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [id, selectedSemester, student]);

    const availableSemesters = useMemo(() => {
        if (!student) return [];
        const sems = new Set(student.results.map(r => r.semester));
        return ['All Semesters', ...Array.from(sems).sort()];
    }, [student]);

    const logout = () => {
        localStorage.clear();
        navigate('/login');
    };

    const submitResult = async (e) => {
        e.preventDefault();
        if (parseFloat(newMarks) > parseFloat(newMax)) {
            alert("Marks obtained cannot exceed maximum marks!");
            return;
        }
        setAddLoading(true);
        try {
            await api.post('/results/', {
                student: id,
                subject_name: newSub,
                semester: newSem,
                marks_obtained: newMarks,
                max_marks: newMax
            });
            setShowAddForm(false);
            setNewSub('');
            setNewMarks('');
            setNewMax(100);
            await fetchStudentBase();
        } catch (err) {
            alert("Failed to add result.");
        } finally {
            setAddLoading(false);
        }
    };

    const updateGoal = async (resultId, target, notes) => {
        try {
            await api.patch(`/results/${resultId}/`, {
                target_percentage: target || null,
                personal_notes: notes || ""
            });
            await fetchStudentBase(); // Refresh data quietly
        } catch (err) {
            console.error("Failed to update goals", err);
            alert("Failed to save goals");
        }
    };

    const applyPlannerPreset = (preset) => {
        if (preset === 'exam') {
            setWeeklySchedule("College classes: 9 AM - 2 PM (Mon-Fri). Sleeping by 11 PM. Weekend open for study.");
            setCoursework("Upcoming Theory Exam on Friday. Need intensive preparation for the weakest subjects. Midterm preparation for DBMS.");
        } else if (preset === 'balanced') {
            setWeeklySchedule("College classes: 9 AM - 4 PM (Mon-Fri). Gym: 6:00 PM - 7:30 PM. Personal projects: 2 hours Sat/Sun.");
            setCoursework("Establish a steady daily routine. Allot 2 hours each evening for key reviews, focusing on core concepts.");
        } else if (preset === 'project') {
            setWeeklySchedule("Standard College hours. Coding bootcamps on Tuesdays and Thursdays from 7 PM - 9 PM.");
            setCoursework("Major Project Submission due next Monday. Need to allocate blocks of time for development, testing, and debugging.");
        }
    };

    const copyTimetableToClipboard = () => {
        if (plannerData?.timetable_markdown) {
            navigator.clipboard.writeText(plannerData.timetable_markdown);
            alert("Timetable markdown copied to clipboard!");
        }
    };

    if (loading) return <div className="loading-spinner"></div>;
    if (!student) return <div className="container" style={{ textAlign: 'center', marginTop: '2rem' }}>Student not found</div>;

    const filteredResults = selectedSemester === 'All Semesters'
        ? student.results
        : student.results.filter(r => r.semester.toString() === selectedSemester.toString());

    // Check Failing Condition
    const failingSubjects = filteredResults.filter(r => r.percentage < 50);

    const chartData = {
        labels: insights?.comparisons.map(c => c.subject) || [],
        datasets: [
            {
                label: 'Student Percentage',
                data: insights?.comparisons.map(c => c.student_percentage) || [],
                backgroundColor: 'rgba(212, 163, 115, 0.8)',
                borderRadius: 4,
            },
            {
                label: 'Class Average',
                data: insights?.comparisons.map(c => c.class_average_percentage) || [],
                backgroundColor: 'rgba(252, 249, 245, 0.25)',
                borderRadius: 4,
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'top', labels: { color: '#fcf9f5' } },
            title: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 100,
                grid: { color: 'rgba(255, 255, 255, 0.05)' },
                ticks: { color: '#c3b4a8' }
            },
            x: {
                grid: { display: false },
                ticks: { color: '#c3b4a8' }
            }
        }
    };

    const pieOptions = {
        responsive: true,
        plugins: {
            legend: { position: 'right', labels: { color: '#fcf9f5' } },
        }
    };

    const pieData = {
        labels: filteredResults.map(r => r.subject_name),
        datasets: [
            {
                label: 'Lost Marks (Scope for Improvement)',
                data: filteredResults.map(r => r.max_marks - r.marks_obtained),
                backgroundColor: [
                    'rgba(207, 113, 118, 0.8)',
                    'rgba(223, 160, 105, 0.8)',
                    'rgba(212, 163, 115, 0.8)',
                    'rgba(129, 178, 154, 0.8)',
                    'rgba(195, 180, 168, 0.8)',
                ],
                borderColor: 'rgba(0, 0, 0, 0.2)',
                borderWidth: 1,
            }
        ]
    };

    return (
        <>
            <nav className="navbar">
                <div className="nav-brand" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <LogoIcon />
                    <span>GradeA</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <select
                        value={selectedSemester}
                        onChange={(e) => setSelectedSemester(e.target.value)}
                        className="filter-select"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.9rem', minWidth: '150px' }}
                    >
                        {availableSemesters.map(sem => (
                            <option key={sem} value={sem}>{sem !== 'All Semesters' ? `Semester ${sem}` : sem}</option>
                        ))}
                    </select>
                    {isAdmin && <button className="logout-btn" onClick={() => navigate(-1)}>Back</button>}
                    <button className="logout-btn" onClick={logout}>Sign Out</button>
                </div>
            </nav>

            <div className="container" style={{ opacity: statsLoading ? 0.6 : 1, transition: 'opacity 0.3s ease' }}>

                {/* Critical Risk Alert Banner */}
                {failingSubjects.length > 0 && (
                    <div className="critical-risk-banner">
                        <div className="critical-risk-icon">⚠️</div>
                        <div className="critical-risk-message">
                            <strong>Immediate Action Required:</strong> You are critically underperforming in {failingSubjects.map(s => s.subject_name).join(', ')} (marks below 50%).
                        </div>
                    </div>
                )}

                {/* MODAL OVERLAY FOR ADD GRADES */}
                {showAddForm && (
                    <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <button className="modal-close-btn" onClick={() => setShowAddForm(false)}>&times;</button>
                            <h3 style={{ marginBottom: '1.5rem', color: 'var(--accent)', fontFamily: 'Outfit', fontSize: '1.4rem' }}>Upload Semester Grades</h3>

                            <form onSubmit={submitResult} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div>
                                    <label className="input-label">Subject Name</label>
                                    <input
                                        type="text"
                                        className="animated-input"
                                        value={newSub}
                                        onChange={e => setNewSub(e.target.value)}
                                        required
                                        placeholder="E.g., Operating Systems"
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label className="input-label">Semester</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="8"
                                            className="animated-input"
                                            value={newSem}
                                            onChange={e => setNewSem(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="input-label">Max Marks</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="animated-input"
                                            value={newMax}
                                            onChange={e => setNewMax(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="input-label">Marks Obtained</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="animated-input"
                                        value={newMarks}
                                        onChange={e => setNewMarks(e.target.value)}
                                        required
                                        placeholder="E.g., 85"
                                    />
                                    {parseFloat(newMarks) > parseFloat(newMax) && (
                                        <p style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                            ⚠️ Warning: Marks obtained cannot exceed Max Marks ({newMax}).
                                        </p>
                                    )}
                                </div>
                                <button
                                    className="primary-btn"
                                    disabled={addLoading || parseFloat(newMarks) > parseFloat(newMax)}
                                    style={{ marginTop: '0.5rem' }}
                                >
                                    {addLoading ? 'Saving...' : 'Submit Grades'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                <div className="dashboard-layout">
                    {/* LEFT COLUMN: Tabs Navigation & Active Tab Content */}
                    <div className="main-content">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h1 className="page-title" style={{ fontFamily: 'Outfit', fontWeight: 800, margin: 0 }}>
                                    Academic Dashboard
                                </h1>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    Select a tab to view analytics, schedule plans, or manage targets.
                                </p>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {isAdmin && (
                                    <button 
                                        className="primary-btn" 
                                        style={{ width: 'auto', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}
                                        onClick={() => setShowAddForm(true)}
                                    >
                                        + Add Grades
                                    </button>
                                )}
                                <button 
                                    className="primary-btn" 
                                    style={{ background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.875rem' }}
                                    onClick={() => window.print()}
                                >
                                    📥 Download Report Card
                                </button>
                            </div>
                        </div>

                        {/* Tab Navigation Menu */}
                        <div className="tabs-container">
                            <button
                                className={`tab-btn ${activeViewTab === 'analytics' ? 'active' : ''}`}
                                onClick={() => setActiveViewTab('analytics')}
                            >
                                📊 Analytics
                            </button>
                            <button
                                className={`tab-btn ${activeViewTab === 'planner' ? 'active' : ''}`}
                                onClick={() => setActiveViewTab('planner')}
                            >
                                ✦ AI Planner
                            </button>
                            <button
                                className={`tab-btn ${activeViewTab === 'goals' ? 'active' : ''}`}
                                onClick={() => setActiveViewTab('goals')}
                            >
                                🎯 Goals & Notes
                            </button>
                            <button
                                className={`tab-btn ${activeViewTab === 'todos' ? 'active' : ''}`}
                                onClick={() => setActiveViewTab('todos')}
                            >
                                📋 Study To-Do List
                            </button>
                            <button
                                className={`tab-btn ${activeViewTab === 'documents' ? 'active' : ''}`}
                                onClick={() => setActiveViewTab('documents')}
                            >
                                📝 PDF Notes Generator
                            </button>
                        </div>

                        {/* TAB CONTENT 1: Academic Analytics */}
                        {activeViewTab === 'analytics' && (
                            <div>
                                {insights && (
                                    <div className="insights-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                                        <div className="metric-card">
                                            <div className="metric-label">Performance</div>
                                            <div className={`metric-value ${insights.performance_level === 'Excellent' ? 'text-success' :
                                                    insights.performance_level === 'Average' ? 'text-warning' : 'text-danger'
                                                }`}>
                                                {insights.overall_percentage}%
                                            </div>
                                            <div className="metric-label" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>{insights.performance_level}</div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-label">Strongest Subject</div>
                                            <div className="metric-value" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insights.best_subject}</div>
                                            <div className="metric-label" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>{insights.best_percentage}%</div>
                                        </div>
                                        <div className="metric-card">
                                            <div className="metric-label">Weakest Subject</div>
                                            <div className="metric-value" style={{ fontSize: '1.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{insights.weakest_subject}</div>
                                            <div className="metric-label" style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>{insights.weakest_percentage}%</div>
                                        </div>
                                    </div>
                                )}

                                {summary && (
                                    <div className="llm-summary-wrapper">
                                        <div className="llm-summary markdown-body" style={{ marginTop: '1rem' }}>
                                            <ReactMarkdown>{summary}</ReactMarkdown>
                                        </div>
                                    </div>
                                )}

                                {/* Detailed layout for grades table and charts side-by-side */}
                                <div className="analytics-details-layout">
                                    {/* Left Side: Grades Table */}
                                    <div className="table-container" style={{ margin: 0 }}>
                                        <table className="modern-table">
                                            <thead>
                                                <tr>
                                                    <th>Subject</th>
                                                    <th>Semester</th>
                                                    <th>Marks Obtained</th>
                                                    <th>Max Marks</th>
                                                    <th>Percentage</th>
                                                    <th>Grade</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredResults.map((result) => (
                                                    <tr key={result.id}>
                                                        <td style={{ fontWeight: 600 }}>{result.subject_name}</td>
                                                        <td>Semester {result.semester}</td>
                                                        <td>{result.marks_obtained}</td>
                                                        <td>{result.max_marks}</td>
                                                        <td>{result.percentage}%</td>
                                                        <td>
                                                            <span className={`grade-badge grade-${result.grade}`}>
                                                                {result.grade}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredResults.length === 0 && (
                                                    <tr>
                                                        <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No results documented yet.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Right Side: Charts Stack */}
                                    <div className="analytics-charts-sidebar">
                                        {filteredResults.length > 0 && (
                                            <>
                                                <div className="chart-container" style={{ margin: 0 }}>
                                                    <h4 style={{ marginBottom: '1rem', fontFamily: 'Outfit', color: 'var(--text-main)', fontSize: '1rem' }}>
                                                        Performance vs Class Average
                                                    </h4>
                                                    <div style={{ height: '180px', position: 'relative' }}>
                                                        <Bar options={{ ...chartOptions, maintainAspectRatio: false }} data={chartData} />
                                                    </div>
                                                </div>
                                                <div className="chart-container" style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                    <h4 style={{ marginBottom: '1rem', fontFamily: 'Outfit', color: 'var(--text-main)', fontSize: '1rem', width: '100%' }}>
                                                        Scope of Improvement
                                                    </h4>
                                                    <div style={{ width: '100%', maxWidth: '180px', height: '150px', position: 'relative', display: 'flex', justifyContent: 'center' }}>
                                                        <Pie options={{ ...pieOptions, maintainAspectRatio: false, plugins: { legend: { display: false } } }} data={pieData} />
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT 2: AI Study Planner */}
                        {activeViewTab === 'planner' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div className="planner-controls" style={{ padding: '1.5rem' }}>
                                    <h3 style={{ fontFamily: 'Outfit', color: 'var(--accent)', marginBottom: '1rem' }}>✦ Timetable Constraints</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Set your weekly commitments to generate a highly optimized academic schedule.</p>

                                    <label className="input-label">Select Routine Template Presets</label>
                                    <div className="preset-container">
                                        <button className="preset-btn" onClick={() => applyPlannerPreset('exam')}>📚 Intense Exam Prep</button>
                                        <button className="preset-btn" onClick={() => applyPlannerPreset('balanced')}>⚖️ Balanced Study & Gym</button>
                                        <button className="preset-btn" onClick={() => applyPlannerPreset('project')}>💻 Project Delivery Crunch</button>
                                    </div>

                                    <label className="input-label">Fixed Commitments / Unavailable Slots</label>
                                    <textarea
                                        className="animated-input"
                                        style={{ marginBottom: '1.25rem', minHeight: '80px', fontSize: '0.9rem' }}
                                        placeholder="E.g., College classes 9 AM - 4 PM. Gym at 6 PM."
                                        value={weeklySchedule}
                                        onChange={e => setWeeklySchedule(e.target.value)}
                                    />

                                    <label className="input-label">Upcoming Deadlines & Focus Topics</label>
                                    <textarea
                                        className="animated-input"
                                        style={{ marginBottom: '1.5rem', minHeight: '80px', fontSize: '0.9rem' }}
                                        placeholder="E.g., Operating Systems midterm on Friday. Target Database SQL Joins."
                                        value={coursework}
                                        onChange={e => setCoursework(e.target.value)}
                                    />

                                    <button
                                        className="primary-btn"
                                        style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
                                        onClick={async () => {
                                            setPlannerLoading(true);
                                            try {
                                                const res = await api.post(`/students/${id}/planner/`, {
                                                    weekly_schedule: weeklySchedule,
                                                    coursework: coursework
                                                });
                                                setPlannerData(res.data);
                                            } catch (err) {
                                                alert("Failed to generate timetable.");
                                            } finally {
                                                setPlannerLoading(false);
                                            }
                                        }}
                                        disabled={plannerLoading}
                                    >
                                        {plannerLoading ? 'Generating Timetable...' : 'Generate AI Timetable'}
                                    </button>
                                </div>

                                <div className="planner-result">
                                    <div className="planner-header">
                                        <h3 style={{ fontFamily: 'Outfit', color: 'var(--text-main)' }}>📋 Optimized Timetable Output</h3>
                                        {plannerData?.timetable_markdown && (
                                            <button
                                                className="logout-btn"
                                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                                                onClick={copyTimetableToClipboard}
                                            >
                                                Copy Markdown
                                            </button>
                                        )}
                                    </div>
                                    <div className="planner-body markdown-body">
                                        {plannerData?.timetable_markdown ? (
                                            <TimetableRenderer markdown={plannerData.timetable_markdown} />
                                        ) : (
                                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '4rem 2rem' }}>
                                                <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📅</span>
                                                Configure constraints and click "Generate AI Timetable" to populate your study calendar.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT 3: Goals & Study Notes */}
                        {activeViewTab === 'goals' && (
                            <>
                                <div className="page-header" style={{ marginBottom: '1rem' }}>
                                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.25rem', margin: 0 }}>🎯 Goals & Notes Panel</h2>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Configure target grade percentages and write personal review notes per subject.</p>
                                </div>

                                <div className="goals-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
                                    {filteredResults.map(res => {
                                        const targetSet = res.target_percentage > 0;
                                        const targetMarks = targetSet ? (res.max_marks * (res.target_percentage / 100)).toFixed(1) : 0;
                                        const needed = targetSet ? Math.max((targetMarks - res.marks_obtained).toFixed(1), 0) : 0;
                                        const fillWidth = targetSet ? Math.min((res.marks_obtained / targetMarks) * 100, 100) : res.percentage;

                                        return (
                                            <GoalCard
                                                key={res.id}
                                                result={res}
                                                fillWidth={fillWidth}
                                                needed={needed}
                                                onSave={updateGoal}
                                            />
                                        );
                                    })}
                                    {filteredResults.length === 0 && (
                                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem', gridColumn: '1 / -1' }}>
                                            No subjects listed in this semester to track goals.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* TAB CONTENT 4: Study To-Do List */}
                        {activeViewTab === 'todos' && (
                            <div className="todo-panel-container">
                                <div className="todo-header-section">
                                    <h2 className="todo-title">📋 Daily Study To-Do List</h2>
                                    <p className="todo-subtitle">Set goals and tasks for specific dates using the calendar view.</p>
                                </div>

                                {/* Date Selector Picker */}
                                <div className="date-selector-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', background: 'var(--panel-bg)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid var(--panel-border)', width: 'fit-content', flexWrap: 'wrap' }}>
                                    <button className="day-btn" onClick={() => handleDateChange(-1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                                        ◀ Prev Day
                                    </button>
                                    <input
                                        type="date"
                                        className="animated-input"
                                        style={{ width: '150px', padding: '0.35rem 0.5rem', fontSize: '0.9rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--panel-border)', color: 'white', borderRadius: '6px', cursor: 'pointer' }}
                                        value={activeTodoDate}
                                        onChange={e => setActiveTodoDate(e.target.value)}
                                    />
                                    <button className="day-btn" onClick={() => handleDateChange(1)} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}>
                                        Next Day ▶
                                    </button>
                                    <button className="day-btn" onClick={() => setActiveTodoDate(getTodayString())} style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: 'rgba(212,163,115,0.1)', color: 'var(--accent)', border: '1px solid rgba(212,163,115,0.2)' }}>
                                        Today
                                    </button>
                                </div>

                                <div className="todo-content-layout">
                                    {/* Task List Form & Tasks */}
                                    <div className="todo-list-card">
                                        <form onSubmit={handleAddTodo} className="todo-quick-add-form">
                                            <input
                                                type="text"
                                                className="animated-input todo-input"
                                                placeholder={`Add a new study task for ${new Date(activeTodoDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}...`}
                                                value={newTodoTask}
                                                onChange={e => setNewTodoTask(e.target.value)}
                                                disabled={todoLoading}
                                                required
                                            />
                                            <button type="submit" className="primary-btn todo-add-btn" disabled={todoLoading}>
                                                {todoLoading ? 'Adding...' : 'Add Task'}
                                            </button>
                                        </form>

                                        <div className="todo-items-list">
                                            {todos.filter(t => t.date === activeTodoDate).length === 0 ? (
                                                <div className="empty-todo-state">
                                                    <span style={{ fontSize: '2rem' }}>☀️</span>
                                                    <p>No study tasks scheduled for {new Date(activeTodoDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}. Enjoy your day or add a task above!</p>
                                                </div>
                                            ) : (
                                                todos.filter(t => t.date === activeTodoDate).map(todo => (
                                                    <div key={todo.id} className={`todo-item-row ${todo.is_completed ? 'completed' : ''}`}>
                                                        <label className="todo-checkbox-label">
                                                            <input
                                                                type="checkbox"
                                                                className="todo-checkbox"
                                                                checked={todo.is_completed}
                                                                onChange={() => handleToggleTodo(todo.id, todo.is_completed)}
                                                            />
                                                            <span className="todo-text">{todo.task}</span>
                                                        </label>
                                                        <div className="todo-actions">
                                                            <button
                                                                className="todo-action-btn ai-btn"
                                                                title="Get AI Resources"
                                                                onClick={() => handleGetAIResources(todo)}
                                                            >
                                                                ✦ AI Resources
                                                            </button>
                                                            <button
                                                                className="todo-action-btn delete-btn"
                                                                title="Delete Task"
                                                                onClick={() => handleDeleteTodo(todo.id)}
                                                            >
                                                                &times;
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB CONTENT 5: PDF Notes Generator */}
                        {activeViewTab === 'documents' && (
                            <div className="pdf-panel-container">
                                <div className="pdf-header-section">
                                    <h2 className="pdf-title">📝 AI PDF Notes Generator</h2>
                                    <p className="pdf-subtitle">Upload lecture notes or textbooks (under 5MB) to extract key points, summaries, and Q&A using Groq AI.</p>
                                </div>

                                <div className="pdf-workspace-layout">
                                    {/* Sidebar: Library */}
                                    <div className="pdf-sidebar-library">
                                        <h3 className="sidebar-title">📚 Document Library</h3>
                                        <div className="pdf-dropzone-container">
                                            <label className="pdf-file-label">
                                                <input
                                                    type="file"
                                                    accept=".pdf"
                                                    onChange={e => handlePdfUpload(e.target.files[0])}
                                                    style={{ display: 'none' }}
                                                    disabled={uploadingPdf}
                                                />
                                                <div className="dropzone-text">
                                                    {uploadingPdf ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                                            <div className="spinner-small"></div>
                                                            <span>Analyzing PDF...</span>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span>📤 Drag or Click to Upload PDF</span>
                                                            <span style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.25rem' }}>(Max 5MB)</span>
                                                        </>
                                                    )}
                                                </div>
                                            </label>
                                        </div>

                                        <div className="sidebar-documents-list">
                                            {documentsLoading ? (
                                                <div className="spinner-small" style={{ margin: '2rem auto' }}></div>
                                            ) : documents.length === 0 ? (
                                                <p className="empty-docs-text">No documents uploaded yet.</p>
                                            ) : (
                                                documents.map(doc => (
                                                    <div
                                                        key={doc.id}
                                                        className={`doc-list-item ${selectedDoc?.id === doc.id ? 'active' : ''}`}
                                                        onClick={() => setSelectedDoc(doc)}
                                                    >
                                                        <div className="doc-item-meta">
                                                            <span className="doc-icon">📄</span>
                                                            <span className="doc-name" title={doc.filename}>{doc.filename}</span>
                                                        </div>
                                                        <button
                                                            className="doc-delete-btn"
                                                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                                                            title="Delete PDF"
                                                        >
                                                            &times;
                                                        </button>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Panel: Notes Viewer */}
                                    <div className="pdf-notes-viewer">
                                        {selectedDoc ? (
                                            <div className="notes-viewer-card">
                                                <div className="notes-viewer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                                                    <div>
                                                        <h3 className="notes-doc-title" style={{ margin: 0 }}>{selectedDoc.filename}</h3>
                                                        <span className="notes-doc-date">Uploaded: {new Date(selectedDoc.uploaded_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <button
                                                        className="primary-btn download-notes-btn"
                                                        onClick={async () => {
                                                            const loadHtml2Pdf = () => {
                                                                return new Promise((resolve) => {
                                                                    if (window.html2pdf) {
                                                                        resolve(window.html2pdf);
                                                                        return;
                                                                    }
                                                                    const script = document.createElement('script');
                                                                    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
                                                                    script.async = true;
                                                                    script.onload = () => resolve(window.html2pdf);
                                                                    document.body.appendChild(script);
                                                                });
                                                            };

                                                            const html2pdf = await loadHtml2Pdf();
                                                            const sourceElement = document.querySelector('.notes-viewer-body');
                                                            if (!sourceElement) return;

                                                            // Create a styled off-screen container to isolate document stylesheet styles from the global page styles
                                                            const container = document.createElement('div');
                                                            container.innerHTML = `
                                                                <div style="padding: 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2d3748; background: #ffffff; min-height: 297mm; box-sizing: border-box;">
                                                                    <div style="border-bottom: 2px solid #3182ce; padding-bottom: 12px; margin-bottom: 25px;">
                                                                        <h1 style="font-size: 24px; font-weight: bold; color: #2b6cb0; margin: 0 0 6px 0; line-height: 1.2;">
                                                                            ${selectedDoc.filename.replace('.pdf', '')}
                                                                        </h1>
                                                                        <div style="display: flex; justify-content: space-between; font-size: 11px; color: #718096;">
                                                                            <span>AI STUDY GUIDE &amp; SUMMARY NOTES</span>
                                                                            <span>Uploaded: ${new Date(selectedDoc.uploaded_at).toLocaleDateString()}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div class="pdf-content-body" style="font-size: 13px; line-height: 1.6; color: #2d3748;">
                                                                        ${sourceElement.innerHTML}
                                                                    </div>
                                                                    <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; text-align: center;">
                                                                        Powered by GradeA AI Study Portal
                                                                    </div>
                                                                </div>
                                                            `;

                                                            const styles = document.createElement('style');
                                                            styles.innerHTML = `
                                                                .pdf-content-body h1, .pdf-content-body h2, .pdf-content-body h3 { color: #2d3748; font-weight: bold; margin-top: 18px; margin-bottom: 8px; page-break-after: avoid; }
                                                                .pdf-content-body h1 { font-size: 18px; border-bottom: 1px solid #edf2f7; padding-bottom: 4px; }
                                                                .pdf-content-body h2 { font-size: 15px; }
                                                                .pdf-content-body h3 { font-size: 13px; }
                                                                .pdf-content-body p { margin-top: 0; margin-bottom: 12px; text-align: justify; }
                                                                .pdf-content-body ul, .pdf-content-body ol { margin-top: 0; margin-bottom: 12px; padding-left: 20px; }
                                                                .pdf-content-body li { margin-bottom: 4px; }
                                                                .pdf-content-body code { background: #edf2f7; padding: 2px 4px; border-radius: 4px; font-family: monospace; font-size: 11px; }
                                                                .pdf-content-body pre { background: #edf2f7; padding: 10px; border-radius: 6px; font-family: monospace; font-size: 11px; overflow-x: auto; margin-bottom: 12px; }
                                                                .pdf-content-body blockquote { border-left: 3px solid #cbd5e0; padding-left: 12px; color: #4a5568; margin-top: 0; margin-bottom: 12px; font-style: italic; }
                                                                .pdf-content-body table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                                                                .pdf-content-body th, .pdf-content-body td { border: 1px solid #e2e8f0; padding: 6px 10px; text-align: left; }
                                                                .pdf-content-body th { background: #f7fafc; font-weight: bold; }
                                                            `;
                                                            container.appendChild(styles);

                                                            const opt = {
                                                                margin:       [10, 10, 10, 10],
                                                                filename:     `${selectedDoc.filename.replace('.pdf', '')}_Summary.pdf`,
                                                                image:        { type: 'jpeg', quality: 0.98 },
                                                                html2canvas:  { scale: 2, useCORS: true },
                                                                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
                                                            };

                                                            html2pdf().set(opt).from(container).save();
                                                        }}
                                                        style={{ width: 'auto', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', background: 'var(--success)' }}
                                                    >
                                                        📥 Download Summary
                                                    </button>
                                                </div>
                                                <div className="notes-viewer-body markdown-body">
                                                    <ReactMarkdown>{selectedDoc.notes}</ReactMarkdown>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="empty-viewer-state">
                                                <span style={{ fontSize: '3rem' }}>📝</span>
                                                <h3>No Document Selected</h3>
                                                <p>Upload a study PDF in the library or select an existing document to view its AI notes summary.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* AI Resources Modal Overlay */}
            {showResourcesModal && (
                <div className="modal-overlay" onClick={() => setShowResourcesModal(false)}>
                    <div className="modal-content resources-modal" onClick={e => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setShowResourcesModal(false)}>&times;</button>
                        <h3 className="modal-title" style={{ color: 'var(--accent)', fontFamily: 'Outfit', fontSize: '1.4rem', marginBottom: '1rem' }}>
                            ✦ Study Resources
                        </h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                            Curated reference materials for: <strong>"{selectedTodoForResources?.task}"</strong>
                        </p>
                        
                        {resourcesLoading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 0', gap: '1rem' }}>
                                <div className="loading-spinner"></div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Querying Llama model for resources...</span>
                            </div>
                        ) : (
                            <div className="resources-body markdown-body" style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                                <ReactMarkdown>{todoResources}</ReactMarkdown>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                            <button className="primary-btn" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} onClick={() => setShowResourcesModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Sub-component for Goal Card
function GoalCard({ result, fillWidth, needed, onSave }) {
    const [targetStr, setTargetStr] = useState(result.target_percentage || '');
    const [notesStr, setNotesStr] = useState(result.personal_notes || '');

    useEffect(() => {
        setTargetStr(result.target_percentage || '');
        setNotesStr(result.personal_notes || '');
    }, [result]);

    return (
        <div className="goal-card">
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <div className="goal-header" style={{ fontFamily: 'Outfit', fontWeight: 700, margin: 0 }}>
                        {result.subject_name}
                    </div>
                    <span className="badge badge-gpa">{result.percentage}%</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Semester {result.semester}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target %:</span>
                    <input
                        type="number"
                        value={targetStr}
                        onChange={e => setTargetStr(e.target.value)}
                        style={{
                            width: '70px',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid var(--panel-border)',
                            color: 'white',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>

                <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${fillWidth}%`, background: fillWidth >= 100 ? 'var(--success)' : 'var(--accent-gradient)' }}></div>
                </div>

                {result.target_percentage > 0 && (
                    <p style={{ fontSize: '0.75rem', color: needed > 0 ? 'var(--warning)' : 'var(--success)', marginBottom: '0.85rem', textAlign: 'right' }}>
                        {needed > 0 ? `Needs ${needed} more marks` : 'Target achieved!'}
                    </p>
                )}

                <textarea
                    className="goal-textarea"
                    placeholder="Enter study topics, key notes or tasks..."
                    value={notesStr}
                    onChange={e => setNotesStr(e.target.value)}
                />
            </div>

            <button
                className="save-note-btn"
                onClick={() => onSave(result.id, parseFloat(targetStr), notesStr)}
            >
                Save Goals & Notes
            </button>
        </div>
    );
}

// Sub-component for rendering parsed Markdown tables
function TimetableRenderer({ markdown }) {
    if (!markdown) return null;

    const lines = markdown.split(/\r?\n/);
    const introLines = [];
    const tableRows = [];
    const outroLines = [];

    let tablePhase = 0; // 0: intro, 1: table, 2: outro

    for (let line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('|')) {
            tablePhase = 1;
            if (trimmed.includes('---')) continue;

            const cells = trimmed
                .split('|')
                .map(c => c.trim())
                .filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);

            if (cells.length > 0) {
                tableRows.push(cells);
            }
        } else {
            if (tablePhase === 1) {
                tablePhase = 2;
            }
            if (tablePhase === 0) {
                introLines.push(line);
            } else if (tablePhase === 2) {
                outroLines.push(line);
            }
        }
    }

    const introText = introLines.join('\n').trim();
    const outroText = outroLines.join('\n').trim();

    return (
        <div className="custom-timetable-container">
            {introText && (
                <div style={{ marginBottom: '1rem' }}>
                    <ReactMarkdown>{introText}</ReactMarkdown>
                </div>
            )}

            {tableRows.length > 0 && (
                <div className="table-container" style={{ margin: '1.5rem 0', overflowX: 'auto' }}>
                    <table className="modern-table" style={{ border: '1px solid var(--accent)', width: '100%' }}>
                        <thead>
                            <tr>
                                {tableRows[0].map((header, i) => (
                                    <th key={i} style={{ background: 'rgba(212, 163, 115, 0.15)', color: 'var(--accent)', fontWeight: 700 }}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tableRows.slice(1).map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                        <td key={cellIndex} style={{ borderBottom: '1px solid var(--panel-border)' }}>
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {outroText && (
                <div style={{ marginTop: '1rem' }}>
                    <ReactMarkdown>{outroText}</ReactMarkdown>
                </div>
            )}
        </div>
    );
}

// Sub-component for rendering a beautiful radial GPA gauge
function GpaGauge({ gpa }) {
    const percentage = (parseFloat(gpa) || 0) * 10;
    const strokeDashoffset = 251.2 - (251.2 * percentage) / 100;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0.75rem 0' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px' }}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                    <circle
                        cx="50" cy="50" r="40"
                        stroke="var(--accent)" strokeWidth="8" fill="transparent"
                        strokeDasharray="251.2"
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        transform="rotate(-90 50 50)"
                        style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                    />
                </svg>
                <div style={{
                    position: 'absolute',
                    top: '52%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '1.35rem',
                    fontWeight: '800',
                    fontFamily: 'Outfit',
                    color: 'var(--text-main)'
                }}>
                    {gpa}
                </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Overall GPA
            </span>
        </div>
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
