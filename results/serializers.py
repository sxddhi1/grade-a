from rest_framework import serializers
from .models import Student, Result, TodoItem, PDFDocument

# -----------------------------------------------
# ResultSerializer — converts ONE result to JSON
# -----------------------------------------------
class ResultSerializer(serializers.ModelSerializer):

    # These two fields don't exist in the database.
    # They are @property fields we wrote in models.py.
    # We have to explicitly tell the serializer to include them.
    percentage = serializers.ReadOnlyField()
    grade = serializers.ReadOnlyField()
    # ReadOnlyField means: "include this in JSON output, but
    # don't try to save it back to the database when data comes in"

    class Meta:
        # Meta is a class inside the class — it gives the
        # serializer its configuration/instructions
        model = Result
        # 'model = Result' means: this serializer is for the Result model

        fields = [
            'id',
            'student',
            'subject_name',
            'marks_obtained',
            'max_marks',
            'semester',
            'percentage',   # calculated, not stored in DB
            'grade',        # calculated, not stored in DB
            'target_percentage',
            'personal_notes',
        ]
        # 'fields' is the list of things to include in the JSON.
        # Anything NOT in this list will be hidden from React.


# -----------------------------------------------
# StudentSerializer — converts ONE student to JSON
# -----------------------------------------------
class StudentSerializer(serializers.ModelSerializer):

    # This is the powerful part — nested serializer.
    # Instead of just showing student.results = [1, 2, 3] (just IDs),
    # this will expand each result into full JSON objects.
    results = ResultSerializer(many=True, read_only=True)
    # many=True means "there can be many results for one student"
    # read_only=True means "don't try to save results when saving a student"

    class Meta:
        model = Student
        fields = [
            'id',
            'name',
            'roll_number',
            'email',
            'department',
            'semester',
            'results',      # this is the nested list of all results
        ]

class TodoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = TodoItem
        fields = ['id', 'student', 'date', 'task', 'is_completed', 'created_at']

class PDFDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFDocument
        fields = ['id', 'student', 'filename', 'notes', 'uploaded_at']