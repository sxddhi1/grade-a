import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth.models import User
from results.models import Student, Result

SUBJECTS_MAP = {
    "Computer Science": {
        1: [
            ("Basic Electronics", 100),
            ("Communication Skills in English", 100),
            ("Universal Human Values and Professional Ethics", 100),
            ("Engineering Mathematics - I", 100),
            ("Basic Mechanical Engineering", 100),
            ("Workshop Practice", 50),
            ("Engineering Graphics - I", 100),
            ("Engineering Physics", 100),
            ("Engineering Physics Lab", 50),
            ("Mechanics of Solids", 100)
        ],
        2: [
            ("Biology for Engineers", 100),
            ("Engineering Graphics - II", 100),
            ("Engineering Mathematics - II", 100),
            ("Human Rights and Constitution", 100),
            ("Basic Electrical Technology", 100),
            ("Problem Solving Using Computers Lab", 50),
            ("Problem Solving Using Computers", 100),
            ("Environmental Studies", 100),
            ("Engineering Chemistry Lab", 50),
            ("Engineering Chemistry", 100)
        ],
        3: [
            ("Object Oriented Programming Lab", 50),
            ("Computer Organization & Architecture", 100),
            ("Data Structures", 100),
            ("Digital System Design", 100),
            ("Object Oriented Programming", 100),
            ("Data Structures Lab", 50),
            ("Digital System Design Lab", 50),
            ("Engineering Mathematics - III", 100)
        ],
        4: [
            ("Formal Languages and Automata Theory", 100),
            ("Engineering Mathematics-IV", 100),
            ("Embedded Systems Lab", 50),
            ("Algorithms Lab", 50),
            ("Database Systems Lab", 50),
            ("Database Systems", 100),
            ("Embedded Systems", 100),
            ("Design and Analysis of Algorithms", 100)
        ],
        5: [
            ("Software Engineering Lab", 50),
            ("Principles of Cryptography", 100),
            ("Software Engineering", 100),
            ("Operating Systems", 100),
            ("Computer Networks", 100),
            ("Creativity, Problem Solving and Innovation", 100),
            ("Essentials of Management", 100),
            ("Operating Systems Lab", 50),
            ("Computer Networks Lab", 50)
        ],
        6: [
            ("Parallel Computer Architecture and Programming", 100),
            ("Compiler Design", 100),
            ("Parallel Programming Lab", 50),
            ("Compiler Design Lab", 50),
            ("Web Programming Lab", 50),
            ("Data Warehousing and Mining", 100),
            ("Engineering Economics and Financial Management", 100),
            ("Business Intelligence and Analytics", 100),
            ("German Language-OE-VI", 100)
        ]
    },
    "Electrical Core": {
        1: [
            ("Basic Electronics", 100),
            ("Communication Skills in English", 100),
            ("Universal Human Values and Professional Ethics", 100),
            ("Engineering Mathematics - I", 100),
            ("Basic Mechanical Engineering", 100),
            ("Workshop Practice", 50),
            ("Engineering Graphics - I", 100),
            ("Engineering Physics", 100),
            ("Engineering Physics Lab", 50),
            ("Mechanics of Solids", 100)
        ],
        2: [
            ("Biology for Engineers", 100),
            ("Engineering Graphics - II", 100),
            ("Engineering Mathematics - II", 100),
            ("Human Rights and Constitution", 100),
            ("Basic Electrical Technology", 100),
            ("Electrical Circuits Lab", 50),
            ("Electrical Technology", 100),
            ("Environmental Studies", 100),
            ("Engineering Chemistry Lab", 50),
            ("Engineering Chemistry", 100)
        ],
        3: [
            ("Network Analysis Lab", 50),
            ("Electrical Measurements", 100),
            ("Network Analysis & Synthesis", 100),
            ("Signals & Systems", 100),
            ("Electronic Devices & Circuits", 100),
            ("Electronic Devices Lab", 50),
            ("Signals Lab", 50),
            ("Engineering Mathematics - III", 100)
        ],
        4: [
            ("Electromagnetic Field Theory", 100),
            ("Engineering Mathematics-IV", 100),
            ("Analog Electronics Lab", 50),
            ("Microprocessors Lab", 50),
            ("Control Systems Lab", 50),
            ("Analog Communication", 100),
            ("Microprocessors & Microcontrollers", 100),
            ("Control Systems", 100)
        ],
        5: [
            ("Digital Signal Processing Lab", 50),
            ("Digital Signal Processing", 100),
            ("Antennas & Wave Propagation", 100),
            ("VLSI Design", 100),
            ("Information Theory & Coding", 100),
            ("Creativity, Problem Solving and Innovation", 100),
            ("Essentials of Management", 100),
            ("VLSI Lab", 50),
            ("Communication Lab", 50)
        ],
        6: [
            ("Power Electronics & Drives", 100),
            ("Wireless Communication", 100),
            ("Power Electronics Lab", 50),
            ("Advanced Communication Lab", 50),
            ("Embedded Systems Lab", 50),
            ("Data Warehousing and Mining", 100),
            ("Engineering Economics and Financial Management", 100),
            ("Fiber Optic Communication", 100),
            ("German Language-OE-VI", 100)
        ]
    },
    "Mechanical Tech": {
        1: [
            ("Basic Electronics", 100),
            ("Communication Skills in English", 100),
            ("Universal Human Values and Professional Ethics", 100),
            ("Engineering Mathematics - I", 100),
            ("Basic Mechanical Engineering", 100),
            ("Workshop Practice", 50),
            ("Engineering Graphics - I", 100),
            ("Engineering Physics", 100),
            ("Engineering Physics Lab", 50),
            ("Mechanics of Solids", 100)
        ],
        2: [
            ("Biology for Engineers", 100),
            ("Engineering Graphics - II", 100),
            ("Engineering Mathematics - II", 100),
            ("Human Rights and Constitution", 100),
            ("Basic Electrical Technology", 100),
            ("Machine Drawing Lab", 50),
            ("Thermodynamics", 100),
            ("Environmental Studies", 100),
            ("Engineering Chemistry Lab", 50),
            ("Engineering Chemistry", 100)
        ],
        3: [
            ("Strength of Materials Lab", 50),
            ("Material Science & Metallurgy", 100),
            ("Strength of Materials", 100),
            ("Fluid Mechanics", 100),
            ("Kinematics of Machinery", 100),
            ("Fluid Mechanics Lab", 50),
            ("Metallurgy Lab", 50),
            ("Engineering Mathematics - III", 100)
        ],
        4: [
            ("Applied Thermodynamics", 100),
            ("Engineering Mathematics-IV", 100),
            ("Dynamics Lab", 50),
            ("Metrology Lab", 50),
            ("Machine Shop Practice", 50),
            ("Fluid Machinery", 100),
            ("Dynamics of Machinery", 100),
            ("Machine Design - I", 100)
        ],
        5: [
            ("Heat Transfer Lab", 50),
            ("Heat & Mass Transfer", 100),
            ("Machine Design - II", 100),
            ("Internal Combustion Engines", 100),
            ("Automobile Engineering", 100),
            ("Creativity, Problem Solving and Innovation", 100),
            ("Essentials of Management", 100),
            ("IC Engines Lab", 50),
            ("Metrology & Instrumentation", 50)
        ],
        6: [
            ("Refrigeration & Air Conditioning", 100),
            ("CAD/CAM", 100),
            ("RAC Lab", 50),
            ("CAD/CAM Lab", 50),
            ("Simulation Lab", 50),
            ("Finite Element Analysis", 100),
            ("Engineering Economics and Financial Management", 100),
            ("Industrial Engineering", 100),
            ("German Language-OE-VI", 100)
        ]
    },
    "Information Tech": {
        1: [
            ("Basic Electronics", 100),
            ("Communication Skills in English", 100),
            ("Universal Human Values and Professional Ethics", 100),
            ("Engineering Mathematics - I", 100),
            ("Basic Mechanical Engineering", 100),
            ("Workshop Practice", 50),
            ("Engineering Graphics - I", 100),
            ("Engineering Physics", 100),
            ("Engineering Physics Lab", 50),
            ("Mechanics of Solids", 100)
        ],
        2: [
            ("Biology for Engineers", 100),
            ("Engineering Graphics - II", 100),
            ("Engineering Mathematics - II", 100),
            ("Human Rights and Constitution", 100),
            ("Basic Electrical Technology", 100),
            ("Programming Lab", 50),
            ("Introduction to Programming", 100),
            ("Environmental Studies", 100),
            ("Engineering Chemistry Lab", 50),
            ("Engineering Chemistry", 100)
        ],
        3: [
            ("Object Oriented Programming Lab", 50),
            ("Computer Organization & Architecture", 100),
            ("Data Structures", 100),
            ("Digital System Design", 100),
            ("Object Oriented Programming", 100),
            ("Data Structures Lab", 50),
            ("Digital System Design Lab", 50),
            ("Engineering Mathematics - III", 100)
        ],
        4: [
            ("Formal Languages and Automata Theory", 100),
            ("Engineering Mathematics-IV", 100),
            ("Software Engineering Lab", 50),
            ("Algorithms Lab", 50),
            ("Database Systems Lab", 50),
            ("Database Systems", 100),
            ("Software Engineering", 100),
            ("Design and Analysis of Algorithms", 100)
        ],
        5: [
            ("Web Technologies Lab", 50),
            ("Information Security", 100),
            ("Web Technologies", 100),
            ("Operating Systems", 100),
            ("Computer Networks", 100),
            ("Creativity, Problem Solving and Innovation", 100),
            ("Essentials of Management", 100),
            ("Operating Systems Lab", 50),
            ("Computer Networks Lab", 50)
        ],
        6: [
            ("Cloud Computing & Virtualization", 100),
            ("Data Science & Big Data", 100),
            ("Cloud Lab", 50),
            ("Big Data Lab", 50),
            ("Web Programming Lab", 50),
            ("Data Warehousing and Mining", 100),
            ("Engineering Economics and Financial Management", 100),
            ("Business Intelligence and Analytics", 100),
            ("German Language-OE-VI", 100)
        ]
    }
}

def run_seed():
    # Delete existing
    User.objects.all().delete()
    Student.objects.all().delete()
    Result.objects.all().delete()

    print("Seeding Users and Students (Refined structure)...")
    
    # Admin User
    admin = User.objects.create_superuser('admin', 'admin@example.com', 'adminpass')
    print("Created Admin User: admin / adminpass")

    first_names = ["Alice", "Bob", "Charlie", "Diana", "Ethan", "Fiona", "George", "Hannah", "Ian", "Julia"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"]
    departments = ["Computer Science", "Electrical Core", "Mechanical Tech", "Information Tech"]

    print("Generating Students & Results...")

    for i in range(1, 101):
        roll = f"CS1{i:03d}"
        fname = random.choice(first_names)
        lname = random.choice(last_names)
        dept = random.choice(departments)
        
        # Determine if this user is active or needs approval
        is_active = random.random() > 0.2
        
        user = User.objects.create_user(roll, f"{fname.lower()}@example.com", 'pass123')
        user.is_active = is_active
        user.save()
        
        # Random student semester from 1 to 6
        current_sem = random.randint(1, 6)
        
        student = Student.objects.create(
            name=f"{fname} {lname}", 
            roll_number=roll, 
            email=f"{fname.lower()}{i}@example.com", 
            department=dept, 
            semester=current_sem, 
            user=user
        )

        # Generate results for each semester up to their current semester
        for s in range(1, current_sem + 1):
            branch_data = SUBJECTS_MAP.get(dept, SUBJECTS_MAP["Computer Science"])
            sem_subjects = branch_data.get(s, [])
            for sub_name, max_m in sem_subjects:
                # Random realistic marks obtained (generally passing, but some random variation)
                # Fails can happen if marks obtained is less than half of max marks.
                # Average will be around 75%.
                is_fail = random.random() < 0.05
                if is_fail:
                    marks = round(random.uniform(max_m * 0.3, max_m * 0.49), 1)
                else:
                    marks = round(random.uniform(max_m * 0.5, max_m * 0.98), 1)
                
                Result.objects.create(
                    student=student, 
                    subject_name=sub_name, 
                    marks_obtained=marks, 
                    max_marks=max_m, 
                    semester=s
                )

    print("Seeding Complete!")
    print("Test users all use password: pass123")
    print("Some users are left as pending approval (is_active=False) for testing Admin dashboard!")

if __name__ == '__main__':
    run_seed()
