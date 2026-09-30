import React from 'react';
import { getAttendanceRecords, getCourses } from '@/lib/academy';
import CourseAttendanceDetailClient from '@/components/attendance/CourseAttendanceDetailClient';
import { notFound } from 'next/navigation';

export const revalidate = 0;

interface PageProps {
  params: Promise<{
    courseId: string;
  }>;
}

const FALLBACK_COURSES = [
  { id: 'c-1', title: 'Bharathanatyam', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Batch A (Evening)', timings: 'Mon, Wed, Fri • 17:00 - 18:30', room: 'Natya Mandapam (Room 101)', fee: '₹2,500 / month', duration: '12 Months', enrolled: 42, sessions: 24, rate: 94, code: 'LCA-BN01', description: 'Traditional Indian classical dance form originating in Tamil Nadu, emphasizing footwork, expressions (Abhinaya), and mudras.' },
  { id: 'c-2', title: 'Kuchupudi', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Weekend Masterclass', timings: 'Sat, Sun • 09:00 - 11:00', room: 'Natya Mandapam (Room 102)', fee: '₹2,000 / month', duration: '12 Months', enrolled: 28, sessions: 20, rate: 91, code: 'LCA-KP01', description: 'Renowned classical dance tradition of Andhra Pradesh, blending rhythmic footwork, storytelling, and fluid movements.' },
  { id: 'c-3', title: 'Carnatic Music', category: 'Vocal & Music', trainer: 'Vidwan Sri K. Venkatesh', batch: 'Morning Ragas', timings: 'Tue, Thu, Sat • 07:30 - 08:45', room: 'Sangeetha Shala (Room 202)', fee: '₹2,000 / month', duration: '12 Months', enrolled: 35, sessions: 26, rate: 89, code: 'LCA-CM01', description: 'Traditional South Indian classical vocal training, covering Swaras, Ragas, Talas, Geethams, and Varnams.' },
  { id: 'c-4', title: 'Karatte', category: 'Martial Arts', trainer: 'Sensei Rajesh Varma', batch: 'Dojo Belt Batch', timings: 'Mon, Wed, Fri • 06:30 - 07:30', room: 'Main Gymnasium', fee: '₹1,800 / month', duration: '12 Months', enrolled: 48, sessions: 30, rate: 95, code: 'LCA-KT01', description: 'Traditional martial arts focusing on self-defense, discipline, punches, kicks, belt gradings, and Katas.' },
  { id: 'c-5', title: 'Violin', category: 'Musical Instruments', trainer: 'Vidwan Sri K. Venkatesh', batch: 'Strings Foundation', timings: 'Tue, Thu • 16:30 - 17:30', room: 'Acoustic Studio 3', fee: '₹2,500 / month', duration: '12 Months', enrolled: 22, sessions: 18, rate: 88, code: 'LCA-VN01', description: 'Disciplined bowed string instrument training in Carnatic or Western styles, bowing techniques, and intonation.' },
  { id: 'c-6', title: 'Keyboard', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Western Notation', timings: 'Mon, Wed • 18:00 - 19:00', room: 'Keys Lab 2', fee: '₹2,200 / month', duration: '12 Months', enrolled: 38, sessions: 22, rate: 92, code: 'LCA-KB01', description: 'Western electronic keyboard training covering finger drills, staff notation, chords, scales, and popular melodies.' },
  { id: 'c-7', title: 'Guitar', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Acoustic Fingerstyle', timings: 'Tue, Thu • 17:30 - 18:30', room: 'Strings Room 1', fee: '₹2,200 / month', duration: '12 Months', enrolled: 30, sessions: 20, rate: 90, code: 'LCA-GT01', description: 'Acoustic and classical guitar fundamentals, rhythm strums, chord transitions, fingerpicking, and song accompaniment.' },
  { id: 'c-8', title: 'Yoga', category: 'Modern Dance & Fitness', trainer: 'Acharya Ramanathan', batch: 'Sunrise Asanas', timings: 'Daily • 06:00 - 07:00', room: 'Pranayama Hall', fee: '₹1,500 / month', duration: '6 Months', enrolled: 40, sessions: 28, rate: 96, code: 'LCA-YG01', description: 'Holistic mind and body wellness practice encompassing Asanas, Pranayama breathing, flexibility, and meditation.' },
  { id: 'c-9', title: 'Drawing', category: 'Fine Arts', trainer: 'Smt. Lakshmi Devi', batch: 'Pencil & Acrylics', timings: 'Sat, Sun • 16:00 - 17:30', room: 'Art Studio 4', fee: '₹1,200 / month', duration: '6 Months', enrolled: 32, sessions: 16, rate: 93, code: 'LCA-DR01', description: 'Foundation sketching, pencil shading, color theory, perspective drawing, and creative visualization.' },
  { id: 'c-10', title: 'Chess', category: 'Mind Sports', trainer: 'Coach Anand V.', batch: 'Grandmaster Tactics', timings: 'Sat, Sun • 11:00 - 12:30', room: 'Library Room 1', fee: '₹1,500 / month', duration: '6 Months', enrolled: 25, sessions: 22, rate: 92, code: 'LCA-CH01', description: 'Strategic mind sport training covering openings, tactics, middle-game positioning, endgame mastery, and tournament preparation.' },
  { id: 'c-11', title: 'Western Dance', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Hip-Hop Juniors', timings: 'Tue, Thu • 18:30 - 19:30', room: 'Dance Studio 2', fee: '₹1,800 / month', duration: '6 Months', enrolled: 36, sessions: 24, rate: 94, code: 'LCA-WD01', description: 'Dynamic choreography covering Hip-Hop, Contemporary, Freestyle, and Jazz dance routines.' },
  { id: 'c-12', title: 'Zumba', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Cardio Rhythm', timings: 'Mon, Wed, Fri • 07:00 - 08:00', room: 'Fitness Hall', fee: '₹1,500 / month', duration: '3 Months', enrolled: 34, sessions: 20, rate: 91, code: 'LCA-ZB01', description: 'High-energy aerobic fitness dance program incorporating Latin and international rhythms for cardio and toning.' },
  { id: 'c-13', title: 'Mohiniyatam', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Lasya Grace', timings: 'Mon, Wed • 16:00 - 17:00', room: 'Natya Mandapam (Room 101)', fee: '₹2,000 / month', duration: '12 Months', enrolled: 18, sessions: 16, rate: 89, code: 'LCA-MY01', description: 'Classical dance of Kerala characterized by graceful, swaying body movements and delicate expressions.' },
  { id: 'c-14', title: 'Semi Classical', category: 'Classical Dance', trainer: 'Guru Smt. Radhika Sharma', batch: 'Fusion Choreography', timings: 'Sat, Sun • 17:00 - 18:30', room: 'Natya Mandapam (Room 102)', fee: '₹1,800 / month', duration: '6 Months', enrolled: 26, sessions: 18, rate: 92, code: 'LCA-SC01', description: 'A blend of pure classical techniques with contemporary rhythms and modern expressive dance choreography.' },
  { id: 'c-15', title: 'Kalari', category: 'Martial Arts', trainer: 'Sensei Rajesh Varma', batch: 'Meipayattu Flow', timings: 'Tue, Thu, Sat • 06:00 - 07:00', room: 'Main Gymnasium', fee: '₹2,000 / month', duration: '12 Months', enrolled: 20, sessions: 18, rate: 95, code: 'LCA-KL01', description: 'Kalaripayattu, the ancient martial art of Kerala, known for its flexibility routines (Meipayattu), strikes, and defense.' },
  { id: 'c-16', title: 'Gymnastic', category: 'Modern Dance & Fitness', trainer: 'Master Kevin', batch: 'Acrobatics Floor', timings: 'Sat, Sun • 08:00 - 09:30', room: 'Main Gymnasium', fee: '₹2,200 / month', duration: '12 Months', enrolled: 24, sessions: 20, rate: 90, code: 'LCA-GM01', description: 'Fundamental acrobatic training, balance, agility, flexibility, and core strength conditioning for young learners.' },
  { id: 'c-17', title: 'Art and Craft', category: 'Fine Arts', trainer: 'Smt. Lakshmi Devi', batch: 'Creative Clay & DIY', timings: 'Sat, Sun • 14:00 - 15:30', room: 'Art Studio 4', fee: '₹1,200 / month', duration: '6 Months', enrolled: 28, sessions: 16, rate: 94, code: 'LCA-AC01', description: 'Hands-on creative crafts including origami, clay modelling, mixed media painting, DIY decor, and paper art.' },
  { id: 'c-18', title: 'Ukulele', category: 'Musical Instruments', trainer: 'Master Anthony David', batch: 'Hawaiian Strumming', timings: 'Sat • 10:00 - 11:30', room: 'Strings Room 1', fee: '₹1,800 / month', duration: '6 Months', enrolled: 16, sessions: 14, rate: 87, code: 'LCA-UK01', description: 'Fun and accessible 4-string Hawaiian instrument training, focusing on quick chords, rhythmic strumming, and singing along.' }
];

export default async function CourseAttendancePage({ params }: PageProps) {
  const { courseId } = await params;
  const decodedParam = decodeURIComponent(courseId).trim().toLowerCase();

  const [dbRecords, dbCourses] = await Promise.all([
    getAttendanceRecords(),
    getCourses(),
  ]);

  // Find course matching ID or title
  let matchedCourse = FALLBACK_COURSES.find(
    (c) => c.id.toLowerCase() === decodedParam || c.title.toLowerCase() === decodedParam
  );

  if (!matchedCourse && dbCourses && dbCourses.length > 0) {
    const foundDb = dbCourses.find(
      (c) => c.id.toLowerCase() === decodedParam || c.title.toLowerCase() === decodedParam
    );
    if (foundDb) {
      matchedCourse = {
        id: foundDb.id,
        title: foundDb.title,
        category: foundDb.category,
        code: foundDb.code || 'LCA-001',
        trainer: 'Senior Guru / Faculty',
        batch: 'Regular Batch',
        timings: 'Mon, Wed, Fri • 17:00 - 18:30',
        room: 'Main Studio',
        fee: '₹2,000 / month',
        duration: '12 Months',
        enrolled: 30,
        sessions: 20,
        rate: 92,
        description: foundDb.description || '',
      };
    }
  }

  // If still not matched, default to the first course rather than 404
  if (!matchedCourse) {
    matchedCourse = FALLBACK_COURSES[0];
  }

  // Filter records for this course title
  const courseRecords = dbRecords.filter(
    (r) => r.course_title.toLowerCase() === matchedCourse!.title.toLowerCase()
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <CourseAttendanceDetailClient
        course={matchedCourse}
        initialRecords={courseRecords}
      />
    </div>
  );
}
