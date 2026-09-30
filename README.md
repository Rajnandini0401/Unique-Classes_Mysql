# 🎓 Unique Classes — Full-Stack Tuition Management System

A high-performance, role-based **Tuition Management System** built with **React 18**, **Vite**, **Node.js (Express)**, and **MySQL Database**. Designed specifically for coaching institutes and academies to streamline admissions, fee collection, attendance tracking, exam results, timetable scheduling, homework assignments, and multi-portal operations.

---

## 🚀 Key Features & Role-Based Portals

The application features **4 distinct role-based portals** with dedicated interfaces and tailored security permissions:

### 👑 1. Admin Portal (`/admin/*`)
* **Complete System Oversight**: Dashboard metrics for total active students, faculty, staff, total fees collected, and pending balances.
* **Student Admissions**: Form for new student admissions with atomic Student ID generation, roll number allocation, photo upload, and class/subject enrollment.
* **Faculty Directory**: Manage teachers, assign subjects and classes, and view faculty schedules.
* **Office Staff Directory**: Manage institute administrative staff and operational roles.
* **Batches & Timetable**: Create, schedule, and allocate regular and test batches across standards and subjects.
* **Attendance Management**: Review institute-wide daily attendance logs, monthly registers, and mark official holidays/closures.
* **Exams & Marks Ledger**: Schedule tests, enter marks, calculate pass/fail percentages, and publish student results.
* **Fee Management**: Master fee ledger, installment payment collection, balance calculation, and instant payment receipt generation.
* **Announcements**: Broadcast system-wide announcements to all students, specific classes, teachers, or staff.

---

### 👨‍🏫 2. Teacher Portal (`/teacher/*`)
* **My Batches & Timetable**: View assigned daily/weekly class schedules and timings.
* **Attendance Marking**: Mark session-wise student attendance (Present, Absent, Late, Excused) with one-click toggles.
* **Assignments & Homework**: Create and distribute class-and-subject-scoped assignments with due dates and file attachments.
* **Test Results Entry**: Enter test scores for enrolled students with instant pass/fail validation.
* **Faculty Profile**: Update profile details, view qualifications, and check assigned classes.

---

### 🧑‍💼 3. Office Staff Portal (`/staff/*`)
* **Admissions & Roster**: Admit new students, inspect student profiles, and update demographics.
* **Daily Attendance Register**: Track daily attendance across classes and generate attendance summaries.
* **Fee Collection & Receipts**: Record installment payments (Cash, UPI, Cheque, Online) and issue receipts.
* **Tests & Marks Entry**: Assist faculty in recording test marks and maintaining student progress records.

---

### 👨‍🎓 4. Student Portal (`/student/*`)
* **Interactive Student Dashboard**: View enrolled subjects, today's schedule, recent marks, and announcement notifications.
* **Smart Attendance & Streak Tracking**: Track attendance percentage, present/absent days, and active attendance streaks.
* **Class & Subject Scoped Assignments**: View homework assignments filtered strictly to the student's enrolled standard and subjects.
* **Test Results & Reports**: View test performance, marks obtained, total marks, and subject rankings.
* **Fee Ledger & Payment Receipts**: Track total course fees, amount paid, balance due, and view payment receipt history.

---

## 🛠️ Technology Stack

### **Frontend**
* **Framework**: React 18.3.1
* **Build Tool**: Vite 5.4.1
* **Routing**: React Router DOM 6.26.1 (Protected Routes & Auth Wrappers)
* **Styling**: Vanilla CSS Design System with CSS Variables, Luxury Gold Admin Theme, Modern Student Dark/Light Layouts
* **Icons & Motion**: Lucide React (`lucide-react`), Framer Motion (`framer-motion`)

### **Backend**
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js REST API
* **Database**: MySQL 8.0 / MariaDB
* **Driver**: `mysql2/promise` connection pool
* **Authentication**: JWT (`jsonwebtoken`) & BCrypt (`bcryptjs`)
* **Integrations**: WhatsApp Automation Service

---

## 🆔 Business Logic & Concurrency Rules

### 1. Atomic Student ID Format
* **Structure**: `UC` + `CURRENT_YEAR` + `CLASS_NUM` + `SERIAL` (No hyphens).
* **Examples (Year 2026)**:
  * 10th Standard: `UC202610001`, `UC202610002`
  * 9th Standard: `UC202690001`
  * 12th Standard: `UC202612001`
* **Concurrency Lock**: Generated server-side inside a MySQL transaction using `SELECT ... FOR UPDATE` on `student_id_counters` to eliminate duplicate IDs during simultaneous submissions.

### 2. Smart Attendance & Streak Algorithm
* **Calculation**: Increments when a student is present in at least 2 subject sessions (or 1 if only 1 session was conducted) on a given day.
* **Holiday Exemption**: Official institute holidays and closures automatically skip calculation without resetting active streaks.

### 3. Class + Subject Scoped Assignments & Announcements
* Homework and announcements created by subject teachers are visible **only** to students enrolled in that specific class AND subject.

---

## 🔐 Credentials & Authentication

The system supports multi-option authentication for user convenience:

| Role | Username / ID | Default Passwords (Any option works) |
| :--- | :--- | :--- |
| **Admin** | `askkmane@gmail.com` | `UCadmin` *(Configurable in `.env`)* |
| **Teacher** | Email / Teacher ID / Mobile | `teacher123` **OR** `Teacher ID` **OR** `Mobile Number` |
| **Staff** | Staff ID / Mobile | `staff123` **OR** `Staff ID` **OR** `Mobile Number` |
| **Student** | Student ID (`UC2026...`) / Mobile | `student123` **OR** `Student ID` **OR** `Mobile Number` |

---

## ⚙️ Installation & Development Setup

### **Prerequisites**
* Node.js (v18.0.0 or higher)
* MySQL 8.0 / XAMPP MariaDB (Port `3306` or `3307`)

### **1. Clone & Install Dependencies**
```bash
# Clone the repository
git clone https://github.com/your-repo/unique-classes-tuition-system.git
cd unique-classes-tuition-system

# Install Frontend dependencies
npm install

# Install Backend dependencies
cd server
npm install
```

### **2. Configure Environment Variables**

Create `server/.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=tuition_db
JWT_SECRET=unique-classes-secret-key-2026
ADMIN_EMAIL=askkmane@gmail.com
ADMIN_PASSWORD=UCadmin
```

Create root `.env` (Frontend):
```env
VITE_API_URL=http://localhost:5000/api
```

### **3. Initialize MySQL Database Schema**
```bash
node server/scripts/init_db.js
```
*This command creates `tuition_db`, builds all normalized tables, and seeds master classes (`5th` to `12th`, `Navodaya`), canonical subjects (`Mathematics`, `Science`, `Physics`, etc.), and default Admin user.*

### **4. Start Local Development Servers**

**Terminal 1 (Backend REST Server):**
```bash
cd server
npm start
```
*Backend runs on `http://localhost:5000`*

**Terminal 2 (Frontend React App):**
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## 🌐 Production Deployment (Hostinger / Cloud)

1. **Database Setup**: Import `server/scripts/schema.sql` into Hostinger MySQL Database (via phpMyAdmin or MySQL CLI).
2. **Backend**: Upload `server` folder to Hostinger Node Application or VPS, configure `server/.env`, and run `npm start`.
3. **Frontend**: Set `VITE_API_URL` to your production domain API endpoint, run `npm run build`, and upload the generated `dist` folder to Hostinger `public_html`.

---

## 📄 License

This project is proprietary software developed for **Unique Classes**. All rights reserved.
