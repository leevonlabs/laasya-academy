import { query, queryOne, getDbPool } from '../lib/db';

// Define the 8 Courses
const COURSES = [
  {
    title: 'Bharatanatyam',
    code: 'BHAR',
    category: 'Classical Dance',
    description: 'Traditional South Indian classical dance focusing on abhinaya, nritta, rhythmic footwork, and sacred storytelling.',
    duration_months: 12,
    monthly_fee: 3000
  },
  {
    title: 'Instrument Classes',
    code: 'INST',
    category: 'Instruments',
    description: 'Mastery of classical & contemporary instruments including Keyboard, Veena, Violin, and Flute.',
    duration_months: 12,
    monthly_fee: 2800
  },
  {
    title: 'Carnatic Music',
    code: 'CARN',
    category: 'Classical Music',
    description: 'Vocal classical Carnatic training emphasizing swaras, varnams, kritis, and raga improvisation.',
    duration_months: 12,
    monthly_fee: 2500
  },
  {
    title: 'Drawing',
    code: 'DRAW',
    category: 'Visual Arts',
    description: 'Fine arts, traditional sketching, acrylic painting, watercolours, and cultural visual arts.',
    duration_months: 6,
    monthly_fee: 2000
  },
  {
    title: 'Western Dance',
    code: 'WEST',
    category: 'Contemporary Dance',
    description: 'High-energy Western, hip-hop, freestyle, and contemporary movement routines.',
    duration_months: 6,
    monthly_fee: 2500
  },
  {
    title: 'Kalaripayattu',
    code: 'KALA',
    category: 'Martial Arts',
    description: 'Ancient Kerala martial art form combining agility, flexibility, animal postures, and physical discipline.',
    duration_months: 12,
    monthly_fee: 2500
  },
  {
    title: 'Karate',
    code: 'KARA',
    category: 'Martial Arts',
    description: 'Discipline-driven Shotokan karate training focusing on katas, self-defence, endurance, and focus.',
    duration_months: 12,
    monthly_fee: 2200
  },
  {
    title: 'Yoga',
    code: 'YOGA',
    category: 'Wellness & Fitness',
    description: 'Traditional Hatha and Ashtanga yoga, pranayama breathing, and holistic morning wellness.',
    duration_months: 12,
    monthly_fee: 2000
  }
];

// Define the 14 Gurus
const TRAINERS = [
  {
    name: 'Nandana',
    title: 'Bharatanatyam Acharya',
    phone: '+91 98765 00001',
    email: 'nandana@laasyaacademy.com',
    specializations: ['Bharatanatyam', 'Semi-Classical'],
    salary: 32000
  },
  {
    name: 'Amrutha',
    title: 'Bharatanatyam Vidushi',
    phone: '+91 98765 00002',
    email: 'amrutha@laasyaacademy.com',
    specializations: ['Bharatanatyam'],
    salary: 30000
  },
  {
    name: 'Vismaya',
    title: 'Bharatanatyam Vidushi',
    phone: '+91 98765 00003',
    email: 'vismaya@laasyaacademy.com',
    specializations: ['Bharatanatyam'],
    salary: 30000
  },
  {
    name: 'Kavya',
    title: 'Bharatanatyam Vidushi',
    phone: '+91 98765 00004',
    email: 'kavya@laasyaacademy.com',
    specializations: ['Bharatanatyam'],
    salary: 30000
  },
  {
    name: 'Amos',
    title: 'Instrument Maestro',
    phone: '+91 98765 00005',
    email: 'amos@laasyaacademy.com',
    specializations: ['Instrument Classes', 'Keyboard'],
    salary: 28000
  },
  {
    name: 'Sahil',
    title: 'Instrument Faculty',
    phone: '+91 98765 00006',
    email: 'sahil@laasyaacademy.com',
    specializations: ['Instrument Classes', 'Strings'],
    salary: 26000
  },
  {
    name: 'H Manikandan',
    title: 'Carnatic Vocal Master',
    phone: '+91 98765 00007',
    email: 'manikandan@laasyaacademy.com',
    specializations: ['Carnatic Music', 'Vocal'],
    salary: 35000
  },
  {
    name: 'Dipanyan Sarkar',
    title: 'Fine Arts & Drawing Guru',
    phone: '+91 98765 00008',
    email: 'dipanyan@laasyaacademy.com',
    specializations: ['Drawing', 'Painting'],
    salary: 26000
  },
  {
    name: 'Karthik',
    title: 'Western Dance Choreographer',
    phone: '+91 98765 00009',
    email: 'karthik@laasyaacademy.com',
    specializations: ['Western Dance'],
    salary: 28000
  },
  {
    name: 'Uday',
    title: 'Western Dance Master',
    phone: '+91 98765 00010',
    email: 'uday@laasyaacademy.com',
    specializations: ['Western Dance', 'Hip-Hop'],
    salary: 28000
  },
  {
    name: 'Manjunath',
    title: 'Senior Dance Instructor',
    phone: '+91 98765 00011',
    email: 'manjunath@laasyaacademy.com',
    specializations: ['Western Dance'],
    salary: 27000
  },
  {
    name: 'Vrushhabh Prakash',
    title: 'Kalaripayattu Asan',
    phone: '+91 98765 00012',
    email: 'vrushhabh@laasyaacademy.com',
    specializations: ['Kalaripayattu'],
    salary: 30000
  },
  {
    name: 'Balraj',
    title: 'Karate Sensei',
    phone: '+91 98765 00013',
    email: 'balraj@laasyaacademy.com',
    specializations: ['Karate'],
    salary: 28000
  },
  {
    name: 'Satish Kale',
    title: 'Yogacharya',
    phone: '+91 98765 00014',
    email: 'satish@laasyaacademy.com',
    specializations: ['Yoga', 'Pranayama'],
    salary: 32000
  }
];

// Define the 4 Rooms
const ROOMS = [
  { name: 'Natya Mandapam (Room 101)', capacity: 25 },
  { name: 'Sangeetha Shala (Room 102)', capacity: 25 },
  { name: 'Chitrakala Hall (Room 103)', capacity: 25 },
  { name: 'Veera Kalari Koodam (Room 104)', capacity: 25 }
];

// Define the 33 Batches
interface BatchSeedDef {
  courseTitle: string;
  name: string;
  trainerName: string;
  days: string[];
  startTime: string;
  endTime: string;
  primaryRoom: string;
  schedules: Array<{ day: string; startTime: string; endTime: string; room: string }>;
}

const BATCHES: BatchSeedDef[] = [
  // 1-17: Bharatanatyam (16 + 1 Semi-Classical)
  {
    courseTitle: 'Bharatanatyam',
    name: 'Brahmaram',
    trainerName: 'Nandana',
    days: ['Saturday', 'Sunday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '17:30', endTime: '18:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '17:30', endTime: '18:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Thalam',
    trainerName: 'Amrutha',
    days: ['Saturday', 'Sunday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '18:30', endTime: '19:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '16:30', endTime: '17:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Padam',
    trainerName: 'Vismaya',
    days: ['Monday', 'Friday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '18:30', endTime: '19:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '18:30', endTime: '19:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Pataka',
    trainerName: 'Vismaya',
    days: ['Tuesday', 'Friday'],
    startTime: '17:00',
    endTime: '18:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Tuesday', startTime: '17:00', endTime: '18:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '17:30', endTime: '18:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Pataka Varnam',
    trainerName: 'Amrutha',
    days: ['Tuesday', 'Friday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Tuesday', startTime: '17:30', endTime: '18:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Friday', startTime: '17:30', endTime: '18:30', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Alapadma',
    trainerName: 'Vismaya',
    days: ['Saturday', 'Sunday'],
    startTime: '16:30',
    endTime: '17:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '16:30', endTime: '17:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '18:30', endTime: '19:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Ladies Bharatanatyam',
    trainerName: 'Kavya',
    days: ['Saturday', 'Sunday'],
    startTime: '14:00',
    endTime: '15:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '14:00', endTime: '15:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '14:00', endTime: '15:00', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Kartari Mukham',
    trainerName: 'Nandana',
    days: ['Saturday', 'Sunday'],
    startTime: '10:30',
    endTime: '11:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '10:30', endTime: '11:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '10:30', endTime: '11:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Nrityam',
    trainerName: 'Nandana',
    days: ['Saturday', 'Sunday'],
    startTime: '09:30',
    endTime: '10:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '09:30', endTime: '10:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '09:30', endTime: '10:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Shikharam',
    trainerName: 'Kavya',
    days: ['Saturday', 'Sunday'],
    startTime: '11:30',
    endTime: '12:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Saturday', startTime: '11:30', endTime: '12:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Sunday', startTime: '11:30', endTime: '12:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Ragam',
    trainerName: 'Nandana',
    days: ['Tuesday', 'Thursday'],
    startTime: '16:00',
    endTime: '17:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Tuesday', startTime: '16:00', endTime: '17:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '16:00', endTime: '17:00', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Anjali',
    trainerName: 'Kavya',
    days: ['Monday', 'Friday'],
    startTime: '16:30',
    endTime: '17:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '16:30', endTime: '17:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '16:30', endTime: '17:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Mudra',
    trainerName: 'Amrutha',
    days: ['Monday', 'Wednesday'],
    startTime: '17:00',
    endTime: '18:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '17:00', endTime: '18:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Wednesday', startTime: '17:00', endTime: '18:00', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Spanda',
    trainerName: 'Vismaya',
    days: ['Saturday', 'Sunday'],
    startTime: '10:30',
    endTime: '11:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Saturday', startTime: '10:30', endTime: '11:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Sunday', startTime: '10:30', endTime: '11:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Chandrachooda',
    trainerName: 'Kavya',
    days: ['Saturday', 'Sunday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Saturday', startTime: '17:30', endTime: '18:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Sunday', startTime: '17:30', endTime: '18:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Blossom',
    trainerName: 'Amrutha',
    days: ['Saturday', 'Sunday'],
    startTime: '11:30',
    endTime: '12:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Saturday', startTime: '11:30', endTime: '12:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Sunday', startTime: '11:30', endTime: '12:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },
  {
    courseTitle: 'Bharatanatyam',
    name: 'Semi-Classical',
    trainerName: 'Nandana',
    days: ['Tuesday', 'Thursday', 'Friday'],
    startTime: '08:30',
    endTime: '09:30',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Tuesday', startTime: '08:30', endTime: '09:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '08:30', endTime: '09:30', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '08:30', endTime: '09:30', room: 'Natya Mandapam (Room 101)' }
    ]
  },

  // 18-19: Instrument Classes
  {
    courseTitle: 'Instrument Classes',
    name: 'Weekday Batch',
    trainerName: 'Amos',
    days: ['Wednesday', 'Friday'],
    startTime: '16:00',
    endTime: '18:00',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Wednesday', startTime: '16:00', endTime: '17:00', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Wednesday', startTime: '17:00', endTime: '18:00', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Friday', startTime: '16:00', endTime: '17:00', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Friday', startTime: '17:00', endTime: '18:00', room: 'Sangeetha Shala (Room 102)' }
    ]
  },
  {
    courseTitle: 'Instrument Classes',
    name: 'Weekend Batch',
    trainerName: 'Sahil',
    days: ['Saturday'],
    startTime: '19:30',
    endTime: '20:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Saturday', startTime: '19:30', endTime: '20:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },

  // 20-22: Carnatic Music
  {
    courseTitle: 'Carnatic Music',
    name: 'Kids/Senior Batch',
    trainerName: 'H Manikandan',
    days: ['Tuesday', 'Saturday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Tuesday', startTime: '18:30', endTime: '19:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Saturday', startTime: '17:30', endTime: '18:30', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Carnatic Music',
    name: 'Kids Junior Batch',
    trainerName: 'H Manikandan',
    days: ['Thursday', 'Saturday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Thursday', startTime: '18:30', endTime: '19:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Saturday', startTime: '18:30', endTime: '19:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },
  {
    courseTitle: 'Carnatic Music',
    name: 'Adult Batch',
    trainerName: 'H Manikandan',
    days: ['Monday', 'Wednesday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Sangeetha Shala (Room 102)',
    schedules: [
      { day: 'Monday', startTime: '18:30', endTime: '19:30', room: 'Sangeetha Shala (Room 102)' },
      { day: 'Wednesday', startTime: '18:30', endTime: '19:30', room: 'Sangeetha Shala (Room 102)' }
    ]
  },

  // 23-24: Drawing
  {
    courseTitle: 'Drawing',
    name: 'Senior Batch',
    trainerName: 'Dipanyan Sarkar',
    days: ['Wednesday', 'Friday'],
    startTime: '18:45',
    endTime: '19:45',
    primaryRoom: 'Chitrakala Hall (Room 103)',
    schedules: [
      { day: 'Wednesday', startTime: '18:45', endTime: '19:45', room: 'Chitrakala Hall (Room 103)' },
      { day: 'Friday', startTime: '18:45', endTime: '19:45', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Drawing',
    name: 'Junior Batch',
    trainerName: 'Dipanyan Sarkar',
    days: ['Monday', 'Thursday'],
    startTime: '18:30',
    endTime: '19:30',
    primaryRoom: 'Chitrakala Hall (Room 103)',
    schedules: [
      { day: 'Monday', startTime: '18:30', endTime: '19:30', room: 'Chitrakala Hall (Room 103)' },
      { day: 'Thursday', startTime: '18:45', endTime: '19:45', room: 'Chitrakala Hall (Room 103)' }
    ]
  },

  // 25-28: Western Dance
  {
    courseTitle: 'Western Dance',
    name: 'Kids Batch',
    trainerName: 'Karthik',
    days: ['Monday', 'Wednesday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Chitrakala Hall (Room 103)',
    schedules: [
      { day: 'Monday', startTime: '17:30', endTime: '18:30', room: 'Chitrakala Hall (Room 103)' },
      { day: 'Wednesday', startTime: '17:30', endTime: '18:30', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Western Dance',
    name: 'Senior Kids Batch',
    trainerName: 'Manjunath',
    days: ['Monday', 'Tuesday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Veera Kalari Koodam (Room 104)',
    schedules: [
      { day: 'Monday', startTime: '17:30', endTime: '18:30', room: 'Veera Kalari Koodam (Room 104)' },
      { day: 'Tuesday', startTime: '18:30', endTime: '19:30', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Western Dance',
    name: 'Weekend Batch',
    trainerName: 'Manjunath',
    days: ['Saturday', 'Sunday'],
    startTime: '15:30',
    endTime: '16:30',
    primaryRoom: 'Chitrakala Hall (Room 103)',
    schedules: [
      { day: 'Saturday', startTime: '15:30', endTime: '16:30', room: 'Chitrakala Hall (Room 103)' },
      { day: 'Sunday', startTime: '15:30', endTime: '16:30', room: 'Chitrakala Hall (Room 103)' }
    ]
  },
  {
    courseTitle: 'Western Dance',
    name: 'Adult Batch',
    trainerName: 'Uday',
    days: ['Monday', 'Tuesday', 'Thursday'],
    startTime: '19:45',
    endTime: '20:45',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '19:45', endTime: '20:45', room: 'Natya Mandapam (Room 101)' },
      { day: 'Tuesday', startTime: '19:45', endTime: '20:45', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '19:45', endTime: '20:45', room: 'Natya Mandapam (Room 101)' }
    ]
  },

  // 29: Kalaripayattu
  {
    courseTitle: 'Kalaripayattu',
    name: 'Kalari',
    trainerName: 'Vrushhabh Prakash',
    days: ['Tuesday', 'Thursday'],
    startTime: '17:30',
    endTime: '18:30',
    primaryRoom: 'Veera Kalari Koodam (Room 104)',
    schedules: [
      { day: 'Tuesday', startTime: '17:30', endTime: '18:30', room: 'Veera Kalari Koodam (Room 104)' },
      { day: 'Thursday', startTime: '17:30', endTime: '18:30', room: 'Veera Kalari Koodam (Room 104)' }
    ]
  },

  // 30: Karate
  {
    courseTitle: 'Karate',
    name: 'Karate',
    trainerName: 'Balraj',
    days: ['Tuesday', 'Thursday'],
    startTime: '16:30',
    endTime: '17:30',
    primaryRoom: 'Veera Kalari Koodam (Room 104)',
    schedules: [
      { day: 'Tuesday', startTime: '16:30', endTime: '17:30', room: 'Veera Kalari Koodam (Room 104)' },
      { day: 'Thursday', startTime: '16:30', endTime: '17:30', room: 'Veera Kalari Koodam (Room 104)' }
    ]
  },

  // 31-33: Yoga
  {
    courseTitle: 'Yoga',
    name: 'Batch 1',
    trainerName: 'Satish Kale',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '05:00',
    endTime: '06:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '05:00', endTime: '06:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Tuesday', startTime: '05:00', endTime: '06:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Wednesday', startTime: '05:00', endTime: '06:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '05:00', endTime: '06:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '05:00', endTime: '06:00', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Yoga',
    name: 'Batch 2',
    trainerName: 'Satish Kale',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '06:00',
    endTime: '07:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '06:00', endTime: '07:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Tuesday', startTime: '06:00', endTime: '07:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Wednesday', startTime: '06:00', endTime: '07:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '06:00', endTime: '07:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '06:00', endTime: '07:00', room: 'Natya Mandapam (Room 101)' }
    ]
  },
  {
    courseTitle: 'Yoga',
    name: 'Batch 3',
    trainerName: 'Satish Kale',
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '07:00',
    endTime: '08:00',
    primaryRoom: 'Natya Mandapam (Room 101)',
    schedules: [
      { day: 'Monday', startTime: '07:00', endTime: '08:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Tuesday', startTime: '07:00', endTime: '08:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Wednesday', startTime: '07:00', endTime: '08:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Thursday', startTime: '07:00', endTime: '08:00', room: 'Natya Mandapam (Room 101)' },
      { day: 'Friday', startTime: '07:00', endTime: '08:00', room: 'Natya Mandapam (Room 101)' }
    ]
  }
];

// 72 Indian names to expand student pool to 300
const EXTRA_STUDENT_NAMES = [
  'Aadhya Sharma', 'Aarav Patel', 'Aditi Rao', 'Advait Nair', 'Ananya Iyer', 'Anirudh Menon',
  'Aparna Nambiar', 'Arjun Verma', 'Arya Pillai', 'Avani Bhat', 'Bhavana Hegde', 'Chetan Kulkarni',
  'Deepa Deshmukh', 'Dhruv Shenoy', 'Divya Kamath', 'Eashan Joshi', 'Gayatri Prabhu', 'Gautam Rao',
  'Harini Subramanian', 'Harshavardhan Shetty', 'Isha Murthy', 'Ishaan Venkat', 'Janani Krishnan', 'Kalyan Sundaram',
  'Kavitha Rangan', 'Keerthana Natarajan', 'Madhavan Swamy', 'Manasa Somayaji', 'Meenakshi Chandran', 'Naveen Bhattacharya',
  'Neha Ganguly', 'Nikhil Mukherjee', 'Nitya Shastri', 'Pranav Acharya', 'Pooja Srinivas', 'Praveen Varma',
  'Radhika Iyengar', 'Rahul Gokhale', 'Rajeshwari Sridhar', 'Ramesh Pattabhiraman', 'Rhea Chawla', 'Rohan Mahajan',
  'Sahana Venkatesh', 'Sameer Dani', 'Sanjana Upadhyaya', 'Saranya Alwar', 'Shashank Koundinya', 'Shreya Shastry',
  'Siddharth Bharadwaj', 'Sneha Parameswaran', 'Sowmya Raman', 'Sreekanth Mohan', 'Srinidhi Gurumurthy', 'Subhashree Raghu',
  'Suchitra Padmanabhan', 'Sudhir Kalyan', 'Sujata Venkatesan', 'Suraj Kashyap', 'Sushma Ayyar', 'Tanvi Somani',
  'Tarun Mudaliar', 'Usha Jayaraman', 'Vaishnavi Srinivasan', 'Varun Raghavan', 'Veda Seshadri', 'Vignesh Balakrishnan',
  'Vijayalakshmi Muthukrishnan', 'Vinay Ananth', 'Vishal Nagesh', 'Yashaswini Gopal', 'Yamini Sundar', 'Yuvan Shankar'
];

async function main() {
  console.log('🚀 Starting Data Reset & Timetable Seeding...');
  const pool = getDbPool();

  try {
    // 2. Clear old batches, enrollments, sessions, attendance
    console.log('🧹 Clearing old batches, enrollments, class sessions, attendance...');
    await query(`ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_check_in_method_check`);
    await query(`DELETE FROM public.attendance`);
    await query(`DELETE FROM public.class_sessions`);
    await query(`DELETE FROM public.batch_enrollments`);
    await query(`DELETE FROM public.batches`);

    // 3. Clear old courses & drop restrictive check constraint
    console.log('🧹 Clearing old courses...');
    await query(`ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_category_check`);
    await query(`DELETE FROM public.courses`);

    // 4. Clear old trainers (keep owner/admin safe!)
    console.log('🧹 Clearing old gurus & guru salary records...');
    await query(`DELETE FROM public.guru_salary_advances`);
    await query(`DELETE FROM public.guru_salary_records`);
    await query(`DELETE FROM public.trainers`);
    // Delete trainer profiles and auth users
    await query(`DELETE FROM public.profiles WHERE role = 'trainer'`);
    await query(`DELETE FROM auth.users WHERE raw_user_meta_data->>'role' = 'trainer'`);

    // 5. Ensure 4 Rooms exist with correct names
    console.log('🏢 Setting up 4 standard Rooms...');
    await query(`DELETE FROM public.rooms`);
    for (const rm of ROOMS) {
      await query(`
        INSERT INTO public.rooms (id, name, capacity, created_at)
        VALUES (gen_random_uuid(), $1, $2, now())
      `, [rm.name, rm.capacity]);
    }

    // 6. Insert the 8 Courses
    console.log('📚 Inserting 8 Courses...');
    const courseMap = new Map<string, string>();
    try {
      await query(`CREATE TABLE IF NOT EXISTS public.course_categories (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text UNIQUE, created_at timestamptz DEFAULT now())`);
      for (const c of COURSES) {
        if (c.category) {
          await query(`INSERT INTO public.course_categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`, [c.category]);
        }
      }
    } catch (e) {
      // Ignore if course_categories not present
    }

    for (const c of COURSES) {
      const inserted = await queryOne<{ id: string }>(`
        INSERT INTO public.courses (title, code, category, description, duration_months, monthly_fee, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, true)
        RETURNING id
      `, [c.title, c.code, c.category, c.description, c.duration_months, c.monthly_fee]);
      if (inserted) {
        courseMap.set(c.title, inserted.id);
      }
    }
    console.log(`✅ Inserted ${courseMap.size} courses.`);

    // 7. Insert the 14 Gurus
    console.log('🧘 Inserting 14 Gurus...');
    const trainerMap = new Map<string, string>();
    for (const t of TRAINERS) {
      const [authUser] = await query<{ id: string }>(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt('123456', gen_salt('bf')), now(),
          jsonb_build_object('full_name', $2::text, 'role', 'trainer', 'phone', $3::text),
          now(), now()
        ) RETURNING id;
      `, [t.email, t.name, t.phone]);

      const uid = authUser.id;

      await query(`
        INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, age, gender)
        VALUES ($1, $2, $3, $4, 'trainer', NULL, 35, 'female')
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = 'trainer',
          avatar_url = NULL
      `, [uid, t.name, t.email, t.phone]);

      const insertedTrainer = await queryOne<{ id: string }>(`
        INSERT INTO public.trainers (profile_id, specializations, display_title, bio, is_active, monthly_salary, avatar_url)
        VALUES ($1, $2, $3, $4, true, $5, NULL)
        ON CONFLICT (profile_id) DO UPDATE SET
          specializations = EXCLUDED.specializations,
          display_title = EXCLUDED.display_title,
          bio = EXCLUDED.bio,
          is_active = true,
          monthly_salary = EXCLUDED.monthly_salary,
          avatar_url = NULL
        RETURNING id
      `, [uid, t.specializations, t.title, `${t.title} at Laasya Cultural Academy.`, t.salary]);

      if (insertedTrainer) {
        trainerMap.set(t.name, insertedTrainer.id);
      }
    }
    console.log(`✅ Inserted ${trainerMap.size} gurus.`);

    // 8. Insert the 33 Batches
    console.log('🗓️ Inserting 33 Batches (Limit 20 students each)...');
    const batchMap = new Map<string, string>();
    for (const b of BATCHES) {
      const courseId = courseMap.get(b.courseTitle);
      const trainerId = trainerMap.get(b.trainerName);
      if (!courseId || !trainerId) {
        console.error(`⚠️ Missing course (${b.courseTitle}) or trainer (${b.trainerName})`);
        continue;
      }

      const insertedBatch = await queryOne<{ id: string }>(`
        INSERT INTO public.batches (
          course_id, trainer_id, name, days_of_week,
          start_time, end_time, room_or_hall, max_capacity,
          is_active, schedules
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 20, true, $8)
        RETURNING id
      `, [
        courseId, trainerId, b.name, b.days,
        b.startTime, b.endTime, b.primaryRoom,
        JSON.stringify(b.schedules)
      ]);

      if (insertedBatch) {
        batchMap.set(`${b.courseTitle}_${b.name}`, insertedBatch.id);
      }
    }
    console.log(`✅ Inserted ${batchMap.size} batches.`);

    // 9. Process Students: Clear avatars, expand to 300 students
    console.log('👥 Standardizing Students to 300 and removing avatars...');
    // Remove avatar images from all existing students
    await query(`UPDATE public.students SET avatar_url = NULL`);
    await query(`UPDATE public.profiles SET avatar_url = NULL WHERE role = 'student'`);

    // Check current student count
    const existingStudents = await query<{ id: string; profile_id: string; roll_number: string }>(`
      SELECT id, profile_id, roll_number FROM public.students ORDER BY created_at ASC
    `);

    console.log(`Current existing students count: ${existingStudents.length}`);

    // Standardize existing students to LCA-001, LCA-002, ...
    if (existingStudents.length < 300) {
      for (let i = 0; i < existingStudents.length; i++) {
        const roll = `LCA-${String(i + 1).padStart(3, '0')}`;
        await query(`UPDATE public.students SET roll_number = $1 WHERE id = $2`, [roll, existingStudents[i].id]);
        await query(`UPDATE auth.users SET encrypted_password = crypt('123456', gen_salt('bf')) WHERE id = $1`, [existingStudents[i].profile_id]);
      }
    }

    // Add extra students to reach 300
    const needed = 300 - existingStudents.length;
    console.log(`Adding ${needed} new students to reach exactly 300...`);

    let currentRollIdx = existingStudents.length + 1;
    for (let i = 0; i < needed; i++) {
      const name = EXTRA_STUDENT_NAMES[i % EXTRA_STUDENT_NAMES.length] + (i >= EXTRA_STUDENT_NAMES.length ? ` ${Math.floor(i / EXTRA_STUDENT_NAMES.length) + 1}` : '');
      const roll = `LCA-${String(currentRollIdx).padStart(3, '0')}`;
      const phone = `+91 98765 ${String(10000 + currentRollIdx).slice(1)}`;
      const email = `student${currentRollIdx}@laasyaacademy.com`;

      const [authSt] = await query<{ id: string }>(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt('123456', gen_salt('bf')), now(),
          jsonb_build_object('full_name', $2::text, 'role', 'student', 'phone', $3::text),
          now(), now()
        ) RETURNING id;
      `, [email, name, phone]);

      const uid = authSt.id;

      await query(`
        INSERT INTO public.profiles (id, full_name, email, phone, role, avatar_url, age, gender)
        VALUES ($1, $2, $3, $4, 'student', NULL, 15, 'female')
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone = EXCLUDED.phone,
          role = 'student',
          avatar_url = NULL
      `, [uid, name, email, phone]);

      await query(`
        INSERT INTO public.students (
          profile_id, roll_number, parent_name, parent_relation,
          parent_contact, address, emergency_contact, status,
          enrollment_date, advance_paid, avatar_url, age, gender, date_of_birth
        )
        VALUES (
          $1, $2, $3, 'Parent',
          $4, 'Whitefield, Bangalore', $4, 'active',
          '2026-06-01', 500, NULL, 15, 'female', '2011-05-15'
        )
        ON CONFLICT (profile_id) DO UPDATE SET
          roll_number = EXCLUDED.roll_number,
          parent_name = EXCLUDED.parent_name,
          parent_contact = EXCLUDED.parent_contact,
          avatar_url = NULL,
          status = 'active'
      `, [uid, roll, `Parent of ${name}`, phone]);

      currentRollIdx++;
    }

    const allStudents = await query<{ id: string }>(`SELECT id FROM public.students ORDER BY roll_number ASC`);
    console.log(`✅ Total students count in database: ${allStudents.length}`);

    // 10. Randomly assign students to batches (Limit = 20 students per batch)
    console.log('🎲 Randomly assigning students to batches with strict cap <= 20...');
    const allBatchIds = Array.from(batchMap.values());
    const batchCounts = new Map<string, number>();
    for (const bId of allBatchIds) {
      batchCounts.set(bId, 0);
    }

    // Helper to shuffle
    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // First round: give every student at least 1 batch
    const shuffledStudents = shuffle(allStudents);
    for (const st of shuffledStudents) {
      // Find batches that have < 20 students
      const eligibleBatches = allBatchIds.filter(bId => (batchCounts.get(bId) || 0) < 20);
      if (eligibleBatches.length > 0) {
        // Pick one randomly among the least filled batches to ensure even spread
        eligibleBatches.sort((a, b) => (batchCounts.get(a) || 0) - (batchCounts.get(b) || 0));
        const chosen = eligibleBatches[Math.floor(Math.random() * Math.min(5, eligibleBatches.length))];
        await query(`
          INSERT INTO public.batch_enrollments (batch_id, student_id, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (batch_id, student_id) DO NOTHING
        `, [chosen, st.id]);
        batchCounts.set(chosen, (batchCounts.get(chosen) || 0) + 1);
      }
    }

    // Second round: give ~100-150 students a second batch if room permits (< 18 cap)
    for (const st of shuffle(allStudents)) {
      const eligibleBatches = allBatchIds.filter(bId => (batchCounts.get(bId) || 0) < 18);
      if (eligibleBatches.length > 0 && Math.random() < 0.5) {
        eligibleBatches.sort((a, b) => (batchCounts.get(a) || 0) - (batchCounts.get(b) || 0));
        const chosen = eligibleBatches[0];
        await query(`
          INSERT INTO public.batch_enrollments (batch_id, student_id, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (batch_id, student_id) DO NOTHING
        `, [chosen, st.id]);
        batchCounts.set(chosen, (batchCounts.get(chosen) || 0) + 1);
      }
    }

    console.log('Batch Enrollment Counts Summary:');
    for (const [bId, count] of batchCounts.entries()) {
      console.log(`  Batch ${bId.slice(0, 8)}...: ${count} students`);
    }

    // 11. Generate Class Sessions for October 2026 (matching the batch schedule days!)
    console.log('📅 Generating October 2026 Class Sessions...');
    const dayMap: Record<string, number> = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };

    const batchesInDb = await query<{
      id: string;
      trainer_id: string;
      days_of_week: string[];
      start_time: string;
      end_time: string;
      room_or_hall: string;
      schedules: any;
    }>(`SELECT id, trainer_id, days_of_week, start_time, end_time, room_or_hall, schedules FROM public.batches`);

    for (let day = 1; day <= 31; day++) {
      const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
      const d = new Date(dateStr);
      const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.

      for (const b of batchesInDb) {
        const schedulesArr = Array.isArray(b.schedules) ? b.schedules : [];
        let matches = false;
        let sTime = b.start_time;
        let eTime = b.end_time;
        let room = b.room_or_hall;

        if (schedulesArr.length > 0) {
          const matchSlot = schedulesArr.find((s: any) => dayMap[s.day.toLowerCase()] === dayOfWeek);
          if (matchSlot) {
            matches = true;
            sTime = matchSlot.startTime;
            eTime = matchSlot.endTime;
            room = matchSlot.room || b.room_or_hall;
          }
        } else if (b.days_of_week) {
          matches = b.days_of_week.some((dStr: string) => dayMap[dStr.toLowerCase()] === dayOfWeek);
        }

        if (matches) {
          const session = await queryOne<{ id: string }>(`
            INSERT INTO public.class_sessions (
              batch_id, trainer_id, session_date, start_time, end_time,
              status, check_in_code, session_topic_notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
          `, [
            b.id, b.trainer_id, dateStr, sTime, eTime,
            dateStr <= '2026-10-09' ? 'completed' : 'scheduled',
            Math.floor(1000 + Math.random() * 9000).toString(),
            'Curriculum Practice & Technique Review'
          ]);

          // If session is completed (<= 2026-10-09), generate attendance for enrolled students
          if (session && dateStr <= '2026-10-09') {
            const enrolled = await query<{ student_id: string }>(`
              SELECT student_id FROM public.batch_enrollments WHERE batch_id = $1 AND status = 'active'
            `, [b.id]);

            if (enrolled.length > 0) {
              const values: any[] = [];
              const valClauses: string[] = [];
              let pIdx = 1;
              for (const enr of enrolled) {
                const isPresent = Math.random() < 0.88;
                values.push(session.id, enr.student_id, isPresent ? 'present' : 'absent', isPresent ? `${dateStr} ${sTime}:00` : null, isPresent ? 'Attended on time' : 'Absent');
                valClauses.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, 'manual', $${pIdx + 4})`);
                pIdx += 5;
              }
              await query(`
                INSERT INTO public.attendance (
                  session_id, student_id, status, check_in_time, check_in_method, remarks
                )
                VALUES ${valClauses.join(', ')}
              `, values);
            }
          }
        }
      }
    }
    console.log('✅ Generated class sessions & realistic attendance for October 2026.');

    console.log('🎉 Reset & Seeding completed successfully!');
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    throw err;
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
