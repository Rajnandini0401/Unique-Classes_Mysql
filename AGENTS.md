# AGENTS.MD — Unique Classes Tuition Management System

## Project Overview
This repository contains the full-stack **Tuition Management System** application for **Unique Classes**.
The project is built as a Single Page Application (SPA) with 4 dedicated role-based portals interfacing with a Node.js Express REST API server backed by a normalized **MySQL** relational database (`tuition_db`).

* **Frontend Path**: `d:\New folder\Unique Classes Project Using MySQL`
* **Backend Path**: `d:\New folder\Unique Classes Project Using MySQL\server`

---

## Technology Stack

### Frontend
* **Core Framework**: React 18.3.1
* **Build Tool**: Vite 5.4.1
* **Routing**: React Router DOM 6.26.1 (`BrowserRouter`, `Routes`, `Route`, Protected Route Wrappers)
* **Icons & Animations**: Lucide React (`lucide-react`), Framer Motion (`framer-motion`)
* **Styling**: Vanilla CSS with CSS Custom Properties (`src/styles/variables.css`, `components.css`, `index.css`, `src/styles/admin/*.css`)

### Backend
* **Runtime**: Node.js (ES Modules)
* **Framework**: Express.js REST API (`http://localhost:5000/api`)
* **Database**: MySQL 8.0 / XAMPP MariaDB (Default Port `3306` or `3307`)
* **Driver**: `mysql2/promise` connection pool (`server/config/db.js`)
* **Authentication**: JWT (`jsonwebtoken`) & BCrypt (`bcryptjs`)
* **Integrations**: WhatsApp Service (`whatsappService.js`, `whatsappAutomationService.js`)
* **Config**: `server/.env` (`PORT`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`)

---

## System Architecture & Conventions

### 1. Student ID & Roll Number Format
* **ID Structure**: `UC + CURRENT_YEAR + CLASS_NUM + SERIAL` (Strictly **NO hyphens**).
* **Examples (Year 2026)**:
  * 10th Class: `UC202610001`, `UC202610002`
  * 9th Class: `UC202690001`
  * 12th Class: `UC202612001`
* **Atomic Concurrency Lock**: Generated server-side inside a MySQL transaction using `SELECT ... FOR UPDATE` on `student_id_counters` to prevent duplicate IDs during simultaneous admin submissions.
* **Roll Numbers**: Auto-assigned sequence per class using `roll_no_counters`.
* **Preview Endpoint**: `GET /api/students/next-id?standard=10th` previews the next ID without incrementing or reserving sequence numbers.

### 2. Photo Storage Strategy
* Base64 images submitted in form JSON payloads are written to disk under:
  * Students: `server/uploads/students/`
  * Teachers: `server/uploads/teachers/`
  * Staff: `server/uploads/staff/`
* MySQL stores clean relative paths (`/uploads/students/UC202610001_1725800000.jpg`).
* Frontend helper [`src/utils/photoUtils.js`](file:///d:/New%20folder/Unique%20Classes%20Project%20Using%20MySQL/src/utils/photoUtils.js) prepends API origin `http://localhost:5000` to serve photos.

### 3. Role-Based Multi-Portal Architecture
* **Admin Panel (`/admin/*`)**: Full system management (Admissions, Directory, Faculty, Office Staff, Batches, Attendance, Exam Results, Fees, Broadcast Announcements).
* **Teacher Panel (`/teacher/*`)**: Assigned Batches/Schedules, My Classes, Attendance marking, Test Results entry, Homework Assignments, Announcements, Profile.
* **Office Staff Panel (`/staff/*`)**: Admissions, Student records, Daily/Monthly Attendance register, Fee collection & receipts, Batches, Tests, Announcements, Profile.
* **Student Panel (`/student/*`)**: Dashboard, Profile, Attendance history, Exam Marks, Fee Ledger & payment receipts, Timetable, Assignments submission, Announcements.

### 4. Normalized MySQL Database Schema (`tuition_db`)
* **`classes`**: Master standards (`5th` through `12th`, `Navodaya`).
* **`subjects`**: Master canonical subjects (`Science`, `English`, `Physics`, `Chemistry`, `Biology`, `Mathematics`).
* **`students`**: Master student registry table with demographics, class FK, roll number, and photo paths.
* **`student_subjects`**: Junction table linking students and subjects (`UNIQUE(student_id, subject_id)`).
* **`teachers`**: Master faculty directory.
* **`teacher_subjects`**, **`teacher_classes`**, **`teacher_class_subjects`**: Faculty allocations and permission junction tables.
* **`staff`**: Master office staff directory.
* **`users`**: Authentication table linking accounts to `student_id`, `teacher_id`, or `staff_id`.
* **`fee_accounts`**: Master fee ledger (`total_fees`, `amount_paid`, `balance_amount`).
* **`fee_payments`**: Installment payment history & receipt log (`receipt_number` UNIQUE).
* **`batches`**: Master timetable scheduling.
* **`attendance_sessions`** & **`attendance_records`**: Session and student attendance register.
* **`tests`** & **`test_results`**: Exam scheduling & student marks ledger.
* **`assignments`**: Homework assignments & attachments.
* **`announcements`**: System announcements by role/audience.
* **`student_id_counters`** & **`roll_no_counters`**: Atomic sequence counters for IDs and roll numbers.

---

## Commands & Execution Guide

### Initializing Database Schema (MySQL / XAMPP)
```bash
node server/scripts/init_db.js
```

### Running Backend Server (Port 5000)
```bash
cd server
npm start
```

### Running Frontend React App (Port 5173)
```bash
npm run dev
```

---

## Guidelines for Future AI Agent Migration Tasks
1. **Preserve System Paths**: Keep all paths aligned with `d:\New folder\Unique Classes Project Using MySQL`.
2. **Module-by-Module Development**: Maintain REST API contracts and database schema integrity.
3. **Preserve UI & Business Logic**: Do NOT break frontend multi-portal navigation, luxury gold styling for Admin/Teacher, or modern responsive layouts for Staff/Student.
4. **Transactional Safety**: Wrap multi-table database operations inside explicit MySQL transactions (`START TRANSACTION ... COMMIT / ROLLBACK`).
