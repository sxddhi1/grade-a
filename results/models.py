from django.db import models
from django.contrib.auth.models import User
from datetime import date

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True)
    # CharField = a field that stores text (like a name or roll number)
    # max_length = the maximum number of characters allowed
    name = models.CharField(max_length=100)
    roll_number = models.CharField(max_length=20, unique=True)
    # unique=True means no two students can have the same roll number

    email = models.EmailField(unique=True)
    # EmailField is like CharField but Django also checks it looks like an email

    department = models.CharField(max_length=100)

    semester = models.IntegerField()
    # IntegerField = stores a whole number like 1, 2, 3, 4

    # This method controls what you see when you print a Student object
    # Instead of seeing <Student object (1)>, you'll see the student's name
    def __str__(self):
        return f"{self.name} ({self.roll_number})"


class Result(models.Model):
    # ForeignKey = "this result is connected to one Student"
    # on_delete=CASCADE means: if a student is deleted, delete their results too
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')

    subject_name = models.CharField(max_length=100)

    marks_obtained = models.FloatField()
    # FloatField = stores decimal numbers like 87.5

    max_marks = models.FloatField(default=100)
    # default=100 means if you don't say what max_marks is, it assumes 100

    semester = models.IntegerField()

    target_percentage = models.FloatField(null=True, blank=True)
    personal_notes = models.TextField(null=True, blank=True)

    # A property is a calculated value — not stored in DB, computed on the fly
    # This calculates percentage automatically from marks
    @property
    def percentage(self):
        if self.max_marks == 0:
            return 0
        return round((self.marks_obtained / self.max_marks) * 100, 2)

    # This calculates the grade automatically based on percentage
    @property
    def grade(self):
        p = self.percentage
        if p >= 90:
            return 'O'    # Outstanding
        elif p >= 75:
            return 'A'
        elif p >= 60:
            return 'B'
        elif p >= 50:
            return 'C'
        elif p >= 40:
            return 'D'
        else:
            return 'F'    # Fail

    def __str__(self):
        return f"{self.student.name} - {self.subject_name}: {self.marks_obtained}"

class StudyProfile(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='study_profile')
    weekly_schedule = models.TextField(blank=True, null=True)
    coursework = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Study Profile: {self.student.name}"

class TodoItem(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='todos')
    date = models.DateField(default=date.today)
    task = models.CharField(max_length=255)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.date} - {self.task[:20]} ({'Done' if self.is_completed else 'Pending'})"

class PDFDocument(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='documents')
    filename = models.CharField(max_length=255)
    notes = models.TextField() # AI-generated markdown notes
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student.name} - {self.filename}"
