from django.urls import path
from . import views

# urlpatterns is a list Django reads to match URLs to views
urlpatterns = [

    # /api/students/
    # calls StudentListView — returns all students
    path('students/', views.StudentListView.as_view(), name='student-list'),

    # /api/students/1/
    # <int:pk> means "capture a number from the URL and call it pk"
    # so /api/students/3/ will call StudentDetailView with pk=3
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),

    # /api/students/1/results/
    # all results for one specific student
    path('students/<int:pk>/results/', views.StudentResultsView.as_view(), name='student-results'),

    # /api/results/
    # list all results OR post a new one
    path('results/', views.ResultListCreateView.as_view(), name='result-list-create'),

    # /api/results/1/
    # update a single result (targets and notes)
    path('results/<int:pk>/', views.ResultUpdateView.as_view(), name='result-update'),

    # /api/students/me/ (Get logged in student)
    path('students/me/', views.StudentMeView.as_view(), name='student-me'),

    # /api/register/
    path('register/', views.RegisterView.as_view(), name='register'),
    
    # /api/approvals/
    path('approvals/', views.PendingApprovalsView.as_view(), name='approvals-list'),
    
    # /api/approvals/approve/1/
    path('approvals/approve/<int:pk>/', views.ApproveStudentView.as_view(), name='approve-student'),

    # /api/students/1/insights/
    path('students/<int:pk>/insights/', views.StudentInsightsView.as_view(), name='student-insights'),

    # /api/students/1/summary/
    path('students/<int:pk>/summary/', views.StudentLLMSummaryView.as_view(), name='student-summary'),

    # /api/students/1/planner/
    path('students/<int:pk>/planner/', views.StudyPlannerView.as_view(), name='student-planner'),

    # Todo list URLs
    path('students/<int:student_id>/todos/', views.StudentTodoListAPIView.as_view(), name='student-todos'),
    path('todos/', views.TodoListCreateView.as_view(), name='todo-list-create'),
    path('todos/<int:pk>/', views.TodoDetailView.as_view(), name='todo-detail'),
    path('todos/<int:pk>/resources/', views.TodoAIResourcesView.as_view(), name='todo-resources'),

    # PDF Notes URLs
    path('students/<int:student_id>/documents/', views.StudentPDFDocumentListUploadView.as_view(), name='student-documents'),
    path('documents/<int:pk>/', views.PDFDocumentDetailView.as_view(), name='document-detail'),
]