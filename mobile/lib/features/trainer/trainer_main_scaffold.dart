import 'package:flutter/material.dart';
import '../../core/constants/colors.dart';
import 'trainer_dashboard_tab.dart';
import 'trainer_classes_tab.dart';
import 'trainer_students_tab.dart';
import 'trainer_attendance_tab.dart';
import 'trainer_profile_tab.dart';
import 'trainer_notifications_screen.dart';

class TrainerMainScaffold extends StatefulWidget {
  const TrainerMainScaffold({super.key});

  @override
  State<TrainerMainScaffold> createState() => _TrainerMainScaffoldState();
}

class _TrainerMainScaffoldState extends State<TrainerMainScaffold> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      TrainerDashboardTab(
        onNavigateToClasses: () => setState(() => _currentIndex = 1),
        onNavigateToStudents: () => setState(() => _currentIndex = 2),
        onNavigateToAttendance: () => setState(() => _currentIndex = 3),
      ),
      const TrainerClassesTab(),
      const TrainerStudentsTab(),
      const TrainerAttendanceTab(),
      const TrainerProfileTab(),
    ];

    final titles = [
      'Guru Dashboard',
      'My Classes & Schedule',
      'Student Management',
      'Attendance Management',
      'Guru Profile & Settings',
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
            icon: const Icon(Icons.notifications_outlined, color: Colors.white, size: 24),
            tooltip: 'Guru Notices',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const TrainerNotificationsScreen()),
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
              icon: Icon(Icons.calendar_month_outlined),
              activeIcon: Icon(Icons.calendar_month_rounded),
              label: 'Classes',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.groups_outlined),
              activeIcon: Icon(Icons.groups_rounded),
              label: 'Students',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.fact_check_outlined),
              activeIcon: Icon(Icons.fact_check_rounded),
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
