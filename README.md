# GradeA: Student Academic Analytics & AI Study Hub

GradeA is a full-stack academic analytics and smart student dashboard. Designed for higher education settings, GradeA empowers students to analyze their academic history, obtain Llama-3-powered course advisements, organize a calendar-based weekly agenda, and convert PDF slides/notes into structured study guides. 

It is built with a decoupled architecture featuring a **Django REST Framework** backend, an SQLite database, and a **React Vite** frontend styled with clean, responsive Vanilla CSS.

---

## Key Features

1. **📊 Academic Performance Analytics**
   * **Insights Engine**: Dynamically displays overall GPA, subject percentages, best vs. weakest subjects, and comparative metrics against the class average.
   * **Interactive Charts**: Responsive line charts mapping academic progression across multiple semesters.
   * **Critical Risk Alert**: A pulsing dashboard banner that alerts users if any semester grade percentage falls below 50%.
   * **Dynamic Goal Tracker**: Interactive card grids where students can modify target percentages and write study logs directly.

2. **✦ AI Study Planner**
   * Computes weakest subjects using Django database lookups and merges them with a student's weekly commitments/coursework.
   * Leverages the Llama-3-8b model via Groq to construct a personalized week-long study plan in markdown tables.

3. **📅 Study To-Do List (Calendar-wise)**
   * Organizes tasks on a calendar-date basis.
   * Supports relative day navigation and custom date selection.
   * **Groq Resource Integration**: Evaluates study tasks to suggest custom YouTube search strings, quick links, and reference URLs (e.g., MDN, Wikipedia).

4. **📝 PDF Notes Generator**
   * Accepts study documents up to 5MB.
   * Parses text locally using `pypdf` and formats structured notes (Summary, Key Terms, Core Breakdown, self-assessment Q&A) via Llama-3.
   * Tracks past documents in a sidebar library. Offers a local `.md` (Markdown) notes downloader.

5. **🔑 Admin Registration Approval Flow**
   * Restricts student registration to pending status.
   * Admins log in to view registration details and approve accounts.

---

## Technology Stack

* **Frontend**: React (Vite), Axios (with JWT interceptors), Chart.js, React Markdown, CSS Variables.
* **Backend**: Django, Django REST Framework, Simple JWT (JSON Web Tokens), PyPDF.
* **Database**: SQLite3.
* **AI Integration**: Groq Cloud SDK (running `llama-3.1-8b-instant`).

---


## Installation & Setup

### Prerequisites
Make sure you have installed:
* **Python 3.8+**
* **Node.js** (v18+) & **npm**
* **Git**

---

### Step 1: Backend Setup (Django)

1. **Clone the Repository**
   ```bash
   git clone https://github.com/sxddhi1/gradea.git
   cd gradea
   ```

2. **Create a Python Virtual Environment**
   ```bash
   python -m venv venv
   ```

3. **Activate the Virtual Environment**
   * **On Windows (CMD/PowerShell):**
     ```cmd
     .\venv\Scripts\activate
     ```
   * **On macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

4. **Install Backend Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure Environment Variables**
   Create a `.env` file in the root directory (based on `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in your Groq API Key (required for LLM operations):
   ```env
   GROQ_API_KEY=gsk_your_groq_api_key_string_here
   ```

6. **Initialize the SQLite Database**
   Generate database schemas, apply standard migrations, and pre-populate the database:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python seed.py
   ```

7. **Start the Backend Server**
   ```bash
   python manage.py runserver
   ```
   The backend API will run on `http://127.0.0.1:8000/`.

---

### Step 2: Frontend Setup (React/Vite)

1. **Navigate to the Frontend Folder**
   ```bash
   cd frontend
   ```

2. **Install Packages**
   ```bash
   npm install
   ```

3. **Launch the Development Server**
   ```bash
   npm run dev
   ```
   The frontend UI will start on `http://localhost:5173/`. Open it in your web browser.

---

## Seeded Login Credentials

Running `python seed.py` auto-fills the database with 100 students and an administrator.

### 👤 Student Login
Use any roll number between `CS1001` and `CS1100` as the username.
* **Username:** `CS1001`
* **Password:** `pass123`

### 🔑 Administrator Login
* **Username:** `admin`
* **Password:** `adminpass`




