from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Student, Result, StudyProfile, TodoItem, PDFDocument
from .serializers import StudentSerializer, ResultSerializer, TodoItemSerializer, PDFDocumentSerializer


# -------------------------------------------------------
# LIST VIEW — returns ALL students
# GET /api/students/
# -------------------------------------------------------
class StudentListView(generics.ListAPIView):
    # ListAPIView is a pre-built DRF view that handles
    # "give me a list of all objects" automatically.
    # You just tell it which data and which serializer.

    queryset = Student.objects.all()
    # queryset = "which records to fetch from the database"
    # Student.objects.all() = "get every student row"

    serializer_class = StudentSerializer
    # serializer_class = "use this serializer to convert to JSON"

    # That's it. DRF does the rest. No more code needed for listing.


# -------------------------------------------------------
# DETAIL VIEW — returns ONE student with all their results
# GET /api/students/1/
# -------------------------------------------------------
class StudentDetailView(generics.RetrieveAPIView):
    # RetrieveAPIView = pre-built view for "get one specific object"

    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    # Because StudentSerializer has nested ResultSerializer,
    # this automatically includes all the student's results too.


# -------------------------------------------------------
# RESULT LIST + CREATE VIEW
# GET  /api/results/   → returns all results
# POST /api/results/   → saves a new result
# -------------------------------------------------------
class ResultListCreateView(generics.ListCreateAPIView):
    # ListCreateAPIView handles BOTH listing AND creating.
    # GET request → returns list
    # POST request → saves new record

    queryset = Result.objects.all()
    serializer_class = ResultSerializer

class ResultUpdateView(generics.RetrieveUpdateAPIView):
    # This allows PATCH requests to /api/results/1/
    queryset = Result.objects.all()
    serializer_class = ResultSerializer


# -------------------------------------------------------
# STUDENT RESULTS VIEW — all results for ONE student
# GET /api/students/1/results/
# -------------------------------------------------------
class StudentResultsView(generics.ListAPIView):
    serializer_class = ResultSerializer

    def get_queryset(self):
        # self.kwargs['pk'] gets the number from the URL
        # e.g. if URL is /api/students/3/results/, pk = 3
        student_id = self.kwargs['pk']
        return Result.objects.filter(student_id=student_id)
        # filter() = "only get results where student_id matches"


from rest_framework.views import APIView
from django.db.models import Avg, Sum
from django.conf import settings
from django.contrib.auth.models import User
from groq import Groq

class RegisterView(APIView):
    def post(self, request, *args, **kwargs):
        data = request.data
        required_fields = ['roll_number', 'password', 'name', 'email', 'department', 'semester']
        for field in required_fields:
            val = data.get(field)
            if val is None or str(val).strip() == "":
                readable_name = field.replace('_', ' ').title()
                return Response({"error": f"{readable_name} is a required field."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=data.get('roll_number')).exists():
            return Response({"error": "Roll Number already exists."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.create_user(
                username=data.get('roll_number'),
                password=data.get('password'),
                email=data.get('email', '')
            )
            user.is_active = False # Requires Admin Approval
            user.save()

            student = Student.objects.create(
                user=user,
                name=data.get('name'),
                roll_number=data.get('roll_number'),
                email=data.get('email'),
                department=data.get('department'),
                semester=data.get('semester')
            )
            return Response({"message": "Registration successful. Please wait for an Admin to approve your account."}, status=status.HTTP_201_CREATED)
        except Exception as e:
            if 'email' in str(e).lower() and 'unique' in str(e).lower():
                return Response({"error": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)
            return Response({"error": "An unexpected server error occurred: " + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PendingApprovalsView(APIView):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get users that are inactive but not staff
        inactive_users = User.objects.filter(is_active=False, is_staff=False, student__isnull=False)
        data = []
        for u in inactive_users:
            data.append({
                "id": u.id,
                "name": u.student.name,
                "roll_number": u.student.roll_number,
                "department": u.student.department,
                "email": u.student.email
            })
        return Response(data, status=status.HTTP_200_OK)


class ApproveStudentView(APIView):
    def post(self, request, pk, *args, **kwargs):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            user = User.objects.get(id=pk)
            user.is_active = True
            user.save()
            return Response({"message": "User approved successfully."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

class StudentMeView(APIView):
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response({"error": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)
        
        try:
            student = Student.objects.get(user=request.user)
            serializer = StudentSerializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            # If user is admin but has no student profile
            return Response({"error": "No student profile found for this user", "is_admin": request.user.is_staff}, status=status.HTTP_404_NOT_FOUND)

class StudentInsightsView(APIView):
    def get(self, request, pk, *args, **kwargs):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

        results = student.results.all()
        
        semester_q = request.query_params.get('semester')
        if semester_q and semester_q != 'All Semesters':
            results = results.filter(semester=semester_q)

        if not results.exists():
            return Response({"error": "No results found for this student/semester"}, status=status.HTTP_400_BAD_REQUEST)

        # Calculate Best and Weakest Subject based on percentage
        best_result = max(results, key=lambda r: r.percentage)
        weakest_result = min(results, key=lambda r: r.percentage)
        
        # Overall percentage
        total_obtained = sum(r.marks_obtained for r in results)
        total_max = sum(r.max_marks for r in results)
        overall_percentage = round((total_obtained / total_max) * 100, 2) if total_max else 0

        if overall_percentage >= 80:
            performance_level = "Excellent"
        elif overall_percentage >= 60:
            performance_level = "Average"
        else:
            performance_level = "Needs Improvement"

        # Calculate GPA
        grade_points = {'O': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'F': 0}
        total_points = sum(grade_points.get(r.grade, 0) for r in results)
        overall_gpa = round(total_points / len(results), 2) if results else 0.0

        # Class averages per subject
        class_averages = []
        student_marks = []
        for res in results:
            # Avg percentage in the same subject
            subject_results = Result.objects.filter(subject_name=res.subject_name)
            
            # Since percentage is a property, we compute avg manually or we can approximate using avg of marks
            # If max_marks is fixed, we can just average marks_obtained. We'll do it manually to be exact.
            avg_percentage = 0
            if subject_results.exists():
                all_perc = [r.percentage for r in subject_results]
                avg_percentage = round(sum(all_perc) / len(all_perc), 2)
            
            class_averages.append({
                "subject": res.subject_name,
                "student_percentage": res.percentage,
                "class_average_percentage": avg_percentage
            })

        return Response({
            "best_subject": best_result.subject_name,
            "best_percentage": best_result.percentage,
            "weakest_subject": weakest_result.subject_name,
            "weakest_percentage": weakest_result.percentage,
            "overall_percentage": overall_percentage,
            "overall_gpa": overall_gpa,
            "performance_level": performance_level,
            "comparisons": class_averages
        })


class StudentLLMSummaryView(APIView):
    def get(self, request, pk, *args, **kwargs):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
        results = student.results.all()
        
        semester_q = request.query_params.get('semester')
        if semester_q and semester_q != 'All Semesters':
            results = results.filter(semester=semester_q)

        if not results.exists():
            return Response({"error": "No results found"}, status=status.HTTP_400_BAD_REQUEST)

        # Build context
        context = f"Student Name: {student.name}, Roll No: {student.roll_number}, Semester: {student.semester}\n"
        context += "Results:\n"
        
        grade_points = {'O': 10, 'A': 9, 'B': 8, 'C': 7, 'D': 6, 'F': 0}
        total_points = sum(grade_points.get(r.grade, 0) for r in results)
        gpa = round(total_points / len(results), 2) if results else 0.0
        context += f"Overall GPA: {gpa}\n"

        for r in results:
            context += f"- {r.subject_name}: {r.marks_obtained}/{r.max_marks} ({r.percentage}%, Grade: {r.grade})\n"

        prompt = f"""
You are an expert academic advisor. Review the student context below.
Provide a structured, encouraging performance summary. Crucially, you must:
1. Identify the student's weakest subject(s) and logically infer 2 or 3 EXACT sub-topics/concepts within that field they are likely lacking in (e.g. if DBMS is weak, say 'SQL Joins' or 'Normalization').
2. Point out exactly which single subject they should focus on studying next to boost their overall GPA the fastest.

Format the response cleanly with bullet points for readability. DO NOT just repeat their marks. Keep the total output brief and under 300 words maximum.
{context}
        """

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                model="llama-3.1-8b-instant",
            )
            summary = chat_completion.choices[0].message.content
            return Response({"summary": summary})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudyPlannerView(APIView):
    def get(self, request, pk, *args, **kwargs):
        try:
            student = Student.objects.get(pk=pk)
            profile, created = StudyProfile.objects.get_or_create(student=student)
            return Response({
                "weekly_schedule": profile.weekly_schedule or "",
                "coursework": profile.coursework or ""
            })
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request, pk, *args, **kwargs):
        try:
            student = Student.objects.get(pk=pk)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Save profile
        profile, created = StudyProfile.objects.get_or_create(student=student)
        profile.weekly_schedule = request.data.get('weekly_schedule', profile.weekly_schedule)
        profile.coursework = request.data.get('coursework', profile.coursework)
        profile.save()

        # Gather academic performance
        results = student.results.all()
        academic_context = "\nStudent Academic Standing:\n"
        for r in results:
            academic_context += f"- {r.subject_name}: {r.marks_obtained}/{r.max_marks} ({r.percentage}%, Grade: {r.grade})\n"

        prompt = f"""
You are an expert AI Study Scheduler. Based on the student's constraints and grades below, generate an optimized, personalized week-long study timetable (Monday to Sunday) in Markdown TABLE format.

Constraints:
1. Student's FIXED Weekly Unavailable Schedule (do NOT schedule study sessions here):
{profile.weekly_schedule or "None specified."}

2. Upcoming Coursework / Exams / Goals:
{profile.coursework or "None specified."}

{academic_context}

Task:
Calculate which subjects are weakest and prioritize assigning extra study hours to those subjects.
Output a beautifully formatted Markdown Table (with columns: Day, Time, Subject, Focus Topic). Keep the total output brief and under 300 words maximum. Be direct, encouraging, and highly specific.
        """

        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
            )
            timetable = chat_completion.choices[0].message.content
            return Response({
                "weekly_schedule": profile.weekly_schedule,
                "coursework": profile.coursework,
                "timetable_markdown": timetable
            })
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


import pypdf
from rest_framework.parsers import MultiPartParser, FormParser

class TodoListCreateView(generics.ListCreateAPIView):
    queryset = TodoItem.objects.all()
    serializer_class = TodoItemSerializer

class StudentTodoListAPIView(generics.ListAPIView):
    serializer_class = TodoItemSerializer

    def get_queryset(self):
        student_id = self.kwargs['student_id']
        return TodoItem.objects.filter(student_id=student_id).order_by('date', 'created_at')

class TodoDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = TodoItem.objects.all()
    serializer_class = TodoItemSerializer

class TodoAIResourcesView(APIView):
    def post(self, request, pk, *args, **kwargs):
        try:
            todo = TodoItem.objects.get(pk=pk)
        except TodoItem.DoesNotExist:
            return Response({"error": "Todo not found"}, status=status.HTTP_404_NOT_FOUND)

        prompt = f"""
You are an expert AI Study Assistant.
Generate a list of curated study resources to help a student complete the following study task:
Task: "{todo.task}"

Please output:
1. Two highly optimized YouTube search query strings and a clickable mock search URL (e.g. https://www.youtube.com/results?search_query=...) that the student can click to find relevant tutorials.
2. Two authoritative reference documentation/learning websites (like MDN, GeeksforGeeks, Wikipedia, or official language docs) with clean descriptive links.

Format the output in clean, beautiful Markdown. Keep it concise, professional, and directly actionable.
"""
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
            )
            resources = chat_completion.choices[0].message.content
            return Response({"resources": resources})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class StudentPDFDocumentListUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, student_id, *args, **kwargs):
        docs = PDFDocument.objects.filter(student_id=student_id).order_by('-uploaded_at')
        serializer = PDFDocumentSerializer(docs, many=True)
        return Response(serializer.data)

    def post(self, request, student_id, *args, **kwargs):
        try:
            student = Student.objects.get(pk=student_id)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

        pdf_file = request.FILES.get('file')
        if not pdf_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if pdf_file.size > 5 * 1024 * 1024:
            return Response({"error": "File size exceeds 5MB limit"}, status=status.HTTP_400_BAD_REQUEST)

        if not pdf_file.name.lower().endswith('.pdf'):
            return Response({"error": "Only PDF files are supported"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reader = pypdf.PdfReader(pdf_file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            return Response({"error": f"Failed to parse PDF file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if not text.strip():
            return Response({"error": "No readable text extracted from PDF"}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
You are a brilliant student assistant and learning tutor.
Analyze the following text extracted from a study PDF, and generate clean, comprehensive, structured study notes.
The notes should contain:
- **Executive Summary**: A concise high-level overview.
- **Key Terms & Concepts**: Bulleted list of critical definitions/concepts.
- **Core Breakdown**: In-depth explanations of the key sections.
- **Quick Review Q&A**: 3-5 quick self-assessment questions with answers.

Format the output in beautiful, highly readable Markdown.

Extracted Document Text (truncated to context length if needed):
{text[:20000]}
"""
        try:
            client = Groq(api_key=settings.GROQ_API_KEY)
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
            )
            notes_markdown = chat_completion.choices[0].message.content
            
            doc = PDFDocument.objects.create(
                student=student,
                filename=pdf_file.name,
                notes=notes_markdown
            )
            
            serializer = PDFDocumentSerializer(doc)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"AI Generation error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PDFDocumentDetailView(generics.DestroyAPIView):
    queryset = PDFDocument.objects.all()
    serializer_class = PDFDocumentSerializer

