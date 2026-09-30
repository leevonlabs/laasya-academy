# Laasya Cultural Academy Mobile App (Flutter)

This is the mobile application for **Trainers** and **Students** of **Laasya Cultural Academy (లాస్య సాంస్కృతిక అకాడమి)**, connecting to the central Supabase backend and synchronized in real time with the Owner Web Portal.

---

## Features

### 1. Unified Authentication
- Single mobile sign-in screen for all mobile users.
- Automatically detects user role (`trainer` vs `student`) and opens their tailored workspace.
- Built-in 1-tap quick login buttons for testing Trainer and Student experiences.

### 2. Trainer Workspace
- **Today's Classes & Timetable**: Live schedule for the day with start/end times and room allocations.
- **Session Starter**: Launches class session and generates the prominent **6-digit Student Check-in PIN**.
- **1-Tap Attendance**: Fast toggles for each enrolled student (Present, Absent, Late) and "All Present" shortcut.
- **Batch Rosters**: View enrolled students and guardian contact details.

### 3. Student Learning Portal
- **Enrolled Disciplines**: Overview of enrolled courses (e.g., *Kuchupudi, Carnatic Music, Karatte*).
- **Self Check-In**: Large 6-digit PIN input with real-time verification against the database RPC function (`student_self_check_in`).
- **Attendance Percentage Ring**: Visual circular gauge displaying attendance rate.
- **Attendance History Log**: Class-by-class audit showing presence status and check-in method.

---

## How to Run the Flutter App

### Prerequisites
- Flutter SDK installed on your machine (`flutter --version` >= 3.0.0).
- Android Studio / Xcode / Chrome for running the app on a simulator or device.

### Steps
1. Open terminal in this folder:
   ```bash
   cd "d:\laasya academy\mobile"
   ```

2. Install dependencies:
   ```bash
   flutter pub get
   ```

3. Run on your connected device or Chrome:
   ```bash
   flutter run
   ```

### Test Accounts Pre-configured
- **Trainer Login**: `radhika.dance@laasyaacademy.com` / `Trainer@123`
- **Student Login**: `ananya.rao@example.com` / `Student@123`
