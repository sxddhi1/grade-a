from django.contrib import admin

# Register your models here.
from .models import Student, Result

# This registers your models with the admin panel
@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    # These are the columns shown in the admin list view
    list_display = ['name', 'roll_number', 'department', 'semester']
    search_fields = ['name', 'roll_number']

@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ['student', 'subject_name', 'marks_obtained', 'max_marks', 'semester']
    search_fields = ['student__name', 'subject_name']