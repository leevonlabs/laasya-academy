import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import 'student_dashboard_tab.dart';
import 'student_courses_tab.dart';
import 'student_schedule_tab.dart';
import 'student_attendance_tab.dart';
import 'student_profile_tab.dart';
import 'student_notifications_screen.dart';

class StudentMainScaffold extends StatefulWidget {
  const StudentMainScaffold({super.key});

  @override
  State<StudentMainScaffold> createState() => _StudentMainScaffoldState();
}

class _StudentMainScaffoldState extends State<StudentMainScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      StudentDashboardTab(
        onNavigateToCourses: () => setState(() => _currentIndex = 1),
        onNavigateToSchedule: () => setState(() => _currentIndex = 2),
        onNavigateToCheckIn: () => setState(() => _currentIndex = 3),
      ),
      const StudentCoursesTab(),
      const StudentScheduleTab(),
      const StudentAttendanceTab(),
      const StudentProfileTab(),
    ];

    final titles = [
      'Student Dashboard',
      'My Enrolled Courses',
      'Class Timetable',
      'Attendance & Check-In',
      'Student Profile & ID',
    ];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        leadingWidth: 0,
        leading: const SizedBox.shrink(),
        title: Row(
          children: [
            Image.asset(
              'assets/images/header_logo.png',
              height: 38,
              fit: BoxFit.contain,
            ),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: LaasyaColors.accentGold.withOpacity(0.18),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: LaasyaColors.accentGold, width: 1),
              ),
              child: Text(
                titles[_currentIndex],
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Stack(
              children: [
                Icon(Icons.notifications_outlined, color: Colors.white, size: 24),
                Positioned(
                  right: 0,
                  top: 0,
                  child: CircleAvatar(
                    radius: 5,
                    backgroundColor: LaasyaColors.accentGold,
                  ),
                ),
              ],
            ),
            tooltip: 'Academy Notifications',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const StudentNotificationsScreen()),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 10,
              offset: const Offset(0, -3),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (idx) => setState(() => _currentIndex = idx),
          type: BottomNavigationBarType.fixed,
          selectedItemColor: LaasyaColors.primary,
          unselectedItemColor: Colors.grey.shade500,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.dashboard_outlined),
              activeIcon: Icon(Icons.dashboard_rounded),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_stories_outlined),
              activeIcon: Icon(Icons.auto_stories_rounded),
              label: 'Courses',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month_rounded),
              label: 'Schedule',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.verified_outlined),
              activeIcon: Icon(Icons.verified_rounded),
              label: 'Attendance',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline_rounded),
              activeIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }
}
