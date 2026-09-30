'use client';

import React, { useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  ShieldCheck, 
  X, 
  MessageSquare, 
  ExternalLink, 
  Menu, 
  User, 
  BookOpen, 
  Trophy, 
  Compass, 
  Heart, 
  Award,
  Music,
  Palette,
  Activity,
  Check,
  Send,
  Lock
} from 'lucide-react';

// =============================================================================
// DATA: 18 ACADEMY PROGRAMS IN 5 CATEGORIES
// =============================================================================
const PROGRAMS = [
  {
    id: 'p-1',
    title: 'Bharathanatyam',
    category: 'Dance',
    badge: 'Classical Dance',
    duration: 'Multi-Level Syllabus',
    age: '5+ Years to Adults',
    summary: 'Rhythmic footwork (Adavus), expressive gestures (Mudras), and emotive facial expressions (Abhinaya) rooted in centuries of South Indian temple traditions.',
    highlights: ['Arangetram preparation', 'University-accredited exams', 'Annual stage performance']
  },
  {
    id: 'p-2',
    title: 'Kuchipudi',
    category: 'Dance',
    badge: 'Classical Dance',
    duration: 'Structured Grades',
    age: '5+ Years',
    summary: 'Graceful, lyrical classical dance of Andhra Pradesh combining dramatic storytelling, fast-paced rhythmic footwork, and brass plate Tarangam choreography.',
    highlights: ['Tarangam dance on brass plate', 'Shlokas & Vachika abhinaya', 'Stage production opportunities']
  },
  {
    id: 'p-3',
    title: 'Mohiniyattam',
    category: 'Dance',
    badge: 'Classical Dance',
    duration: 'Grace & Lasya',
    age: '6+ Years',
    summary: 'The dance of the enchantress from Kerala, characterized by delicate swaying movements, circular body kinetics, and soothing Sopana Sangeetham melodies.',
    highlights: ['Sopana sangeetham rhythms', 'Chari & Mandala postures', 'Pure Lasya grace training']
  },
  {
    id: 'p-4',
    title: 'Semi Classical',
    category: 'Dance',
    badge: 'Fusion & Expressive',
    duration: '6-Month Batches',
    age: '6+ Years to Adults',
    summary: 'A versatile blend of pure classical discipline with cinematic and modern expressive music, ideal for stage performance and cultural festivals.',
    highlights: ['Cinematic & devotional choreography', 'Expressions & stage presence', 'Quick mastery for events']
  },
  {
    id: 'p-5',
    title: 'Western Dance',
    category: 'Dance',
    badge: 'Hip-Hop & Freestyle',
    duration: 'Ongoing Sessions',
    age: '4+ Years to Teens',
    summary: 'High-energy choreography focusing on Hip-Hop, contemporary flow, street funk, and rhythmic sync for youth competitions and fitness.',
    highlights: ['Reality show choreographers', 'Freestyle & locking/popping', 'Endurance & rhythm drills']
  },
  {
    id: 'p-6',
    title: 'Folk Dance',
    category: 'Dance',
    badge: 'Traditional Heritage',
    duration: 'Festival Workshops',
    age: 'All Age Groups',
    summary: 'Vibrant, celebratory folk traditions celebrating Indian regional heritage, harvest festivals, and community bonding through rhythm and props.',
    highlights: ['Garba, Dandiya, Kolatam & Lavani', 'Costume & rhythm synchronization', 'Community cultural festivals']
  },
  {
    id: 'p-7',
    title: 'Carnatic Vocal',
    category: 'Music',
    badge: 'Classical Vocal',
    duration: 'Foundational to Senior',
    age: '5+ Years to Adults',
    summary: 'Structured South Indian classical vocal pedagogy under title "Sangeetha Acharya", progressing from Sarali Swaras to complex Ragas, Varnams, and Keerthanams.',
    highlights: ['Sarali, Jantai & Alankaram', 'Trinity of Carnatic music compositions', 'Stage Kutcheri training']
  },
  {
    id: 'p-8',
    title: 'Violin',
    category: 'Music',
    badge: 'Bowed Strings',
    duration: 'Carnatic & Western',
    age: '7+ Years to Adults',
    summary: 'Disciplined string bow mechanics, Gamaka microtonal nuances, accurate pitch ear training, and solo/accompaniment mastery.',
    highlights: ['Bowing balance & posture', 'Fingering & Gamaka techniques', 'Carnatic & Western notation']
  },
  {
    id: 'p-9',
    title: 'Keyboard',
    category: 'Music',
    badge: 'Western & Classical',
    duration: 'Trinity & RSL Exams',
    age: '5+ Years to Adults',
    summary: 'Comprehensive electronic keyboard and piano syllabus covering staff notation, scales, chord progressions, and international certification preparation.',
    highlights: ['Trinity London & Rockschool syllabus', 'Produced South India toppers', 'Contemporary & classical melodies']
  },
  {
    id: 'p-10',
    title: 'Guitar',
    category: 'Music',
    badge: 'Acoustic & Electric',
    duration: 'Graded Levels',
    age: '6+ Years to Adults',
    summary: 'Acoustic fingerstyle, chords, strumming dynamics, scales, and song accompaniment taught by internationally certified mentors.',
    highlights: ['Fingerpicking & plectrum drills', 'Chord transitions & lead scales', 'Rock & contemporary repertoire']
  },
  {
    id: 'p-11',
    title: 'Ukulele',
    category: 'Music',
    badge: '4-String Hawaiian',
    duration: 'Quick-Start & Intermediate',
    age: '4+ Years to Adults',
    summary: 'Delightful and accessible string instrument for children and adults to learn quick melodies, rhythm strumming, and vocal accompaniment.',
    highlights: ['Easy finger positioning', 'Rhythmic strums & fingerstyle', 'Fun songbook repertoire']
  },
  {
    id: 'p-12',
    title: 'Drawing',
    category: 'Visual Arts',
    badge: 'Fine Arts',
    duration: 'Graded Levels',
    age: '4+ Years to Teens',
    summary: 'Taught by Santiniketan MFA art educators, guiding students through pencil shading, perspective, charcoal, watercolours, and acrylics.',
    highlights: ['Visva-Bharati Santiniketan pedagogy', 'Pencil sketching & colour theory', 'Competition & exhibition training']
  },
  {
    id: 'p-13',
    title: 'Art and Craft',
    category: 'Visual Arts',
    badge: 'Creative Hands-on',
    duration: 'Workshops & Term',
    age: '4+ to 12 Years',
    summary: 'Stimulating creative motor skills through origami, clay modelling, mixed-media collage, pottery decoration, and recycled material design.',
    highlights: ['Clay modelling & pottery work', 'Origami & paper engineering', 'Boosts fine motor coordination']
  },
  {
    id: 'p-14',
    title: 'Kalari (Kalaripayattu)',
    category: 'Fitness & Martial Arts',
    badge: 'Ancient Martial Art',
    duration: 'Traditional Levels',
    age: '6+ Years to Adults',
    summary: 'Ancient 3,000-year-old Kerala martial discipline encompassing Meypayattu body conditioning, animal postures (Vadivu), unarmed combat, and weapons (Ankathari).',
    highlights: ['Meypayattu conditioning', 'Animal postures & strikes', 'Flexibility, agility & mental focus']
  },
  {
    id: 'p-15',
    title: 'Karate',
    category: 'Fitness & Martial Arts',
    badge: 'Black Belt Syllabus',
    duration: 'Belt Gradings',
    age: '5+ Years',
    summary: 'Shotokan Karate taught by 2nd Dan black belt sensei with focus on Kata forms, Kumite sparring, self-defense awareness, and strict dojo discipline.',
    highlights: ['Official belt examinations', 'Self-defense & situational reflex', 'Focus, respect & endurance']
  },
  {
    id: 'p-16',
    title: 'Gymnastics',
    category: 'Fitness & Martial Arts',
    badge: 'Floor Acrobatics',
    duration: 'Core Conditioning',
    age: '4+ to 14 Years',
    summary: 'Fundamental athletic training building agility, balance, tumbling, backflips, core strength, and natural physical poise for young children.',
    highlights: ['Floor flips & tumble rolls', 'Flexibility & spinal mobility', 'Safety mats & expert spotters']
  },
  {
    id: 'p-17',
    title: 'Zumba',
    category: 'Fitness & Martial Arts',
    badge: 'Dance Fitness',
    duration: 'Weekly Batches',
    age: 'Teens to Adults',
    summary: 'High-energy cardiovascular fitness routine blending Latin rhythms, pop beats, and aerobic routines that make working out joyful and effective.',
    highlights: ['Cardio stamina & calorie burn', 'Fun, rhythmic group atmosphere', 'Morning & evening batches']
  },
  {
    id: 'p-18',
    title: 'Yoga',
    category: 'Fitness & Martial Arts',
    badge: 'Holistic Wellness',
    duration: 'Daily & Weekend',
    age: 'All Age Groups',
    summary: 'Traditional Hatha & Vinyasa asanas, Pranayama breath control, and mindful meditation to improve postural alignment, immunity, and inner peace.',
    highlights: ['Pranayama & breath mastery', 'Postural correction & flexibility', 'Stress relief & mindfulness']
  },
  {
    id: 'p-19',
    title: 'Chess',
    category: 'Mind Games',
    badge: 'Strategic Mastery',
    duration: 'Beginner to Tournament',
    age: '5+ Years to Teens',
    summary: 'Mentored by state medalist and university champion covering opening theory, tactical motifs, middle-game positioning, endgame mastery, and tournament clocks.',
    highlights: ['Opening repertoires & tactics', 'State medalist mentorship', 'Tournament simulation & blitz drills']
  }
];

// =============================================================================
// DATA: 14 PROFILED GURUS & INSTRUCTORS
// =============================================================================
const GURUS = [
  {
    id: 'g-1',
    name: 'Amos P Ovung',
    role: 'Director, Multi-Instrumentalist',
    category: 'Music',
    photoInitials: 'AO',
    experience: '8+ Years Teaching • 1000+ Students',
    location: 'Kannamangala & Seegehalli',
    phone: '+91 8151 998 899',
    summary: 'Learned at Hillspraise Music Academy, Nagaland, and holds prestigious Rockschool and Trinity (London) qualifications in guitar, keyboard, piano, ukulele, vocals, violin, and drums.',
    fullBio: 'Amos P Ovung is one of the youngest RSL East India toppers in guitar and piano. With over 8 years of dedicated mentoring and more than 1,000 students guided, he serves as the Managing Director of Glory Music Academy (Seegehalli) and Glory and Tuning Folks Music Academy (Kannamangala). He leads faculty training, curriculum development, and stage performance mastery across Western instrumentation at Laasya Cultural Academy.',
    credentials: ['Trinity London Certified', 'Rockschool (RSL) East India Topper', '8+ Years Mentorship', 'Multi-Instrument Specialist']
  },
  {
    id: 'g-2',
    name: 'Shahil Patro',
    role: 'Keyboard and Guitar Mentor',
    category: 'Music',
    photoInitials: 'SP',
    experience: 'Senior Instrument Mentor',
    location: 'Seegehalli & Kannamangala',
    summary: 'Senior instructor for keyboard, piano, guitar, and ukulele following international Trinity College London and RSL International exam curricula.',
    fullBio: 'Shahil Patro specializes in mentoring students for formal grade exams and performance excellence. Under his guidance, 4 students have achieved RSL South India regional topper accolades, alongside more than 10 distinction holders. He focuses on technical precision, hand independence, ear training, and music theory.',
    credentials: ['Produced 4 RSL South India Toppers', '10+ Distinction Holders', 'Trinity Exam Coach', 'Acoustic & Electric Guitar']
  },
  {
    id: 'g-3',
    name: 'Shri H. Manikandan',
    role: 'Carnatic Vocal Guru',
    category: 'Music',
    photoInitials: 'HM',
    experience: '15+ Years • Title "Sangeetha Acharya"',
    location: 'Kannamangala Campus',
    summary: 'Trained under the revered Palakkad Sisters (Nandini Shankar and Seethalakshmi Krishnan), imparting rigorous traditional Carnatic vocal pedagogy.',
    fullBio: 'With 15 years of dedicated teaching and the revered title "Sangeetha Acharya", Shri H. Manikandan welcomes young children from kindergarten to working adults. His systematic curriculum guides students step-by-step: Basic (Sarali and Jantai Swaras, Alankarams), Junior (fundamental ragas like Malahari, Mohanam, Kalyani, Saveri), Intermediate (Varnam mastery), and Senior (Keerthanams composed by Thyagaraja, Muthuswami Dikshitar, Syama Sastri, Swathi Thirunal, and Pattinam Subramanyam Iyer).',
    credentials: ['Title "Sangeetha Acharya"', 'Palakkad Sisters Disciple', '15 Years Experience', 'Kutcheri Concert Mentor']
  },
  {
    id: 'g-4',
    name: 'Anusha Sumesh',
    role: 'Bharatanatyam Master & Founder',
    category: 'Dance',
    photoInitials: 'AS',
    experience: 'Arangetram 2005 • Founder',
    location: 'Calicut & Bangalore',
    instagram: '@anu_sumesh_',
    summary: 'From Calicut, Kerala, born into an illustrious family steeped in classical arts. Graduated in Bharatanatyam from the University of Art & Culture (2015).',
    fullBio: 'Anusha completed her prestigious Arangetram at the historic Guruvayoor Shri Krishna Temple in 2005. She holds a formal Degree in Bharatanatyam from the University of Art & Culture (2015) and has been teaching and choreographing professionally since 2017. As the founder of Laasya Cultural Academy in Kannamangala, Bangalore, she infuses authentic tradition, spiritual depth, and technical discipline into every student.',
    credentials: ['Guruvayoor Temple Arangetram', 'Univ. of Art & Culture Degree', 'Teaching Since 2017', 'Academy Founder']
  },
  {
    id: 'g-5',
    name: 'Pramod T. Peethambaran',
    role: 'Bharatanatyam, Kuchipudi & Choreographer',
    category: 'Dance',
    photoInitials: 'PP',
    experience: 'Paartha Puraskar Award (2021)',
    location: 'Thrissur & Bangalore',
    summary: 'Renowned choreographer and founder of Natyamandra Dance Studio, celebrated for original dance dramas and televised performances across South India.',
    fullBio: 'Hailing from Thrissur, Kerala, Pramod is the recipient of the prestigious Paartha Puraskar Award (2021). His dance productions have been featured prominently on Flowers TV and Mazhavil Manorama. His students consistently secure first prizes in Kerala state youth festivals. He is the creator of critically acclaimed dance productions including Nagavaly, Thulasi, Nagam, Soundharyam, Bhadrakali, Punyalan, and Ganga.',
    credentials: ['Paartha Puraskar Award 2021', 'Flowers TV & Manorama Choreographer', 'Youth Festival Champion Mentor', '7 Original Dance Dramas']
  },
  {
    id: 'g-6',
    name: 'Nandhana (Nandana Krishna)',
    role: 'Bharatanatyam Faculty',
    category: 'Dance',
    photoInitials: 'NK',
    experience: 'Master\'s Degree • Performing Soloist',
    location: 'Kannamangala',
    summary: 'Started dancing at age six. Holds a Bachelor\'s from Sanskrit University and a Master\'s in Fine Arts from St Teresa\'s College, Ernakulam.',
    fullBio: 'Nandhana has trained rigorously from childhood. She prepares academy students for stage programs, competitive events, and temple festivals, while continuing to perform solo recitals at prominent cultural associations across India.',
    credentials: ['Master\'s Degree (St Teresa\'s)', 'Sanskrit University Graduate', 'Temple Recitalist', 'Solo Stage Performer']
  },
  {
    id: 'g-7',
    name: 'Sruthy Ramesh',
    role: 'Mohiniyattam & Kuchipudi Exponent',
    category: 'Dance',
    photoInitials: 'SR',
    experience: '20+ Years Classical Dance Experience',
    location: 'Kannamangala',
    summary: 'Senior classical dancer with over two decades of immersion in the graceful Lasya traditions of Mohiniyattam and lively Kuchipudi.',
    fullBio: 'Sruthy has guided numerous students through their formal Arangetrams, state-level competitions, and prestigious stage productions, emphasizing authenticity, footwork rhythm, and facial expression (Abhinaya).',
    credentials: ['20+ Years Performing Arts', 'Arangetram Specialist', 'Lasya & Mudra Specialist', 'Festival Production Lead']
  },
  {
    id: 'g-8',
    name: 'Ranjith Kumar S J',
    role: 'Dance Trainer & TV Choreographer',
    category: 'Dance',
    photoInitials: 'RK',
    experience: '7+ Years • ETV & Zee Choreographer',
    location: 'Kannamangala',
    summary: 'Dynamic trainer with 7+ years of experience teaching multiple styles, school annual days, and reality television productions.',
    fullBio: 'Ranjith has contributed choreography for renowned television shows including ETV Telugu and Dance Karnataka Dance (DKD). His teaching core strengths are anatomical mechanics, accurate demonstration, rhythm theory, and captivating stage choreography.',
    credentials: ['ETV Telugu Choreographer', 'Dance Karnataka Dance Contributor', '7+ Years Teaching', 'Stage Craft Master']
  },
  {
    id: 'g-9',
    name: 'Karthik R',
    role: 'Western Dance Mentor',
    category: 'Dance',
    photoInitials: 'KR',
    experience: 'ETV Dhee Participant • Season 1 Winner',
    location: 'Kannamangala',
    summary: 'High-energy choreographer and stage performer seen on Telugu ETV Dhee and Dance Karnataka Dance, winner of Season 1 dance championship.',
    fullBio: 'Karthik focuses on building musicality, body isolation, street groove, and confident stage presence. His philosophy: genuine creativity blossoms when rooted in strong physical discipline and technical fundamentals.',
    credentials: ['ETV Dhee Reality Participant', 'DKD Karnataka Performer', 'Season 1 Winner', 'Hip-Hop & Contemporary']
  },
  {
    id: 'g-10',
    name: 'Dipayan Sarkar',
    role: 'Visual Artist & Fine Arts Educator',
    category: 'Visual Arts',
    photoInitials: 'DS',
    experience: 'BFA & MFA, Visva-Bharati, Santiniketan',
    location: 'Kannamangala',
    summary: 'Distinguished visual artist with BFA (2019) and MFA (2021) from Kala Bhavana, Visva-Bharati, Santiniketan, specializing in graphic arts, printmaking, and sketching.',
    fullBio: 'Dipayan brings the celebrated artistic tradition of Rabindranath Tagore\'s Santiniketan to Bangalore. He has judged prestigious children\'s art competitions in Kolkata (2020), worked as graphic designer at Red Molecule (2021), taught at The Art Hub Delhi (2022), and served as visual art educator at Akal Academy, Himachal Pradesh. He mentors students in pencil shading, colour theory, watercolours, and portfolio creation.',
    credentials: ['Santiniketan Kala Bhavana MFA', 'State Art Competition Judge', 'Printmaking & Graphic Specialist', 'Child Art Mentor']
  },
  {
    id: 'g-11',
    name: 'Vrushabh Prakash Owhal',
    role: 'Kalaripayattu Master',
    category: 'Martial Arts & Fitness',
    photoInitials: 'VO',
    experience: 'Traditional Gurukula Discipline',
    location: 'Kannamangala',
    summary: 'Exponent of 3,000-year-old traditional Kalaripayattu from Kerala, covering flexibility conditioning, strikes, and weapon defense.',
    fullBio: 'Vrushabh guides students through the complete traditional stages of Kalari: Meypayattu (body conditioning & flexibility), Vadivu (animal postures), Kaikuththippayattu (unarmed combat), Ankathari (wooden & metal weapons), and Verumkai (bare-hand defense).',
    credentials: ['Complete Kalari Pedagogy', 'Meypayattu Specialist', 'Ancient Weapon Forms', 'Flexibility & Reflex Conditioning']
  },
  {
    id: 'g-12',
    name: 'Vijay Kumar Olekar',
    role: 'Karate & Taekwondo Sensei',
    category: 'Martial Arts & Fitness',
    photoInitials: 'VO',
    experience: 'Karate 2nd Dan • Taekwondo 1st Dan',
    location: 'Kannamangala',
    summary: 'Karate 2nd Dan black belt with 8+ years of martial arts coaching experience and Taekwondo 1st Dan black belt.',
    fullBio: 'Vijay Sensei combines traditional Shotokan Kata rigor with modern agility training. He has trained hundreds of school children in self-defense, belt gradings, mental resilience, and physical respect.',
    credentials: ['Karate 2nd Dan Black Belt', 'Taekwondo 1st Dan Black Belt', '8+ Years Coaching', 'Official Belt Examiner']
  },
  {
    id: 'g-13',
    name: 'Sai Krishna',
    role: 'Chess Grandmaster Mentor',
    category: 'Mind Games',
    photoInitials: 'SK',
    experience: '2 District Gold • 3 State Silver',
    location: 'Kannamangala',
    summary: 'Distinguished chess medalist, university team captain, and Master\'s graduate in Communication Systems from NIT Warangal (2022-2024).',
    fullBio: 'Sai Krishna is a two-time sports day champion and inter-college tournament winner. He mentors young minds in opening principles, middle-game tactics, endgame calculation, and mental resilience under tournament pressure.',
    credentials: ['2 District Gold Medals', '3 State Silver Medals', 'NIT Warangal M.Tech', 'Inter-College Champion']
  },
  {
    id: 'g-14',
    name: 'Acharya Sathish Kale',
    role: 'Yoga & Mind-Body Wellness Guru',
    category: 'Martial Arts & Fitness',
    photoInitials: 'SK',
    experience: 'Certified Yoga Acharya',
    location: 'Kannamangala',
    summary: 'Dedicated wellness educator guiding learners in traditional Hatha postures, Pranayama, and mindful stress-relief routines.',
    fullBio: 'Acharya Sathish brings holistic mindfulness, breath alignment, and spinal health conditioning to students of all ages, promoting physical agility and emotional balance.',
    credentials: ['Certified Yoga Acharya', 'Hatha & Vinyasa Specialist', 'Pranayama & Meditation', 'Holistic Wellness Coach']
  }
];

export default function LandingPageClient() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedGuru, setExpandedGuru] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // ENROLLMENT / OWNER CONTACT MODAL STATE
  // ---------------------------------------------------------------------------
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedProgramForEnroll, setSelectedProgramForEnroll] = useState<string>('Bharathanatyam');
  
  // Callback Form inside modal
  const [modalFormSubmitted, setModalFormSubmitted] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalPhone, setModalPhone] = useState('');
  const [modalAge, setModalAge] = useState('');

  // Contact section message form
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Course Admission Inquiry',
    message: ''
  });

  const openEnrollModal = (programTitle?: string) => {
    if (programTitle) {
      setSelectedProgramForEnroll(programTitle);
    }
    setModalFormSubmitted(false);
    setIsEnrollModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalName.trim() || !modalPhone.trim()) return;
    setModalFormSubmitted(true);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactLoading(true);
    setTimeout(() => {
      setContactLoading(false);
      setContactSuccess(true);
      setContactForm({
        name: '',
        email: '',
        phone: '',
        subject: 'Course Admission Inquiry',
        message: ''
      });
    }, 800);
  };

  const filteredPrograms = PROGRAMS.filter((p) => {
    if (selectedCategory === 'All') return true;
    return p.category === selectedCategory;
  });

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#220314] font-sans selection:bg-[#8A064D] selection:text-white">

      {/* =================================================================== */}
      {/* 1. STICKY HEADER & NAVIGATION */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-[#3F0123]/95 backdrop-blur-md border-b border-[#F9E33A]/20 text-white transition-all shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo & Tagline */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-44 sm:w-52 h-12 flex items-center">
              <Image 
                src="/header_logo.png" 
                alt="Laasya Cultural Academy Logo" 
                width={220} 
                height={56} 
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-bold uppercase tracking-wider text-rose-100">
            <a href="#about" className="hover:text-[#F9E33A] transition">About Us</a>
            <a href="#journey" className="hover:text-[#F9E33A] transition">Our Journey</a>
            <a href="#programs" className="hover:text-[#F9E33A] transition">Programs (18)</a>
            <a href="#gurus" className="hover:text-[#F9E33A] transition">Our Gurus</a>
            <a href="#contact" className="hover:text-[#F9E33A] transition">Contact</a>
          </nav>

          {/* Action Buttons: Director Login & Enroll Now */}
          <div className="hidden sm:flex items-center gap-3">
            
            {/* Director Login Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-100 hover:text-white bg-[#590231] hover:bg-[#780442] border border-[#8A064D] transition shadow-xs"
              title="Academy Director Management Portal"
            >
              <Lock className="w-3.5 h-3.5 text-[#F9E33A]" />
              <span>Director Portal</span>
            </Link>

            {/* Enroll Now Button (Triggers Owner Contact Modal) */}
            <button
              onClick={() => openEnrollModal()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#F9E33A] to-[#EBB128] hover:from-[#FFF176] hover:to-[#F9E33A] text-[#250216] shadow-md hover:shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#590231]" />
              <span>Enroll Now</span>
            </button>

          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => openEnrollModal()}
              className="sm:hidden text-[11px] font-black uppercase px-3 py-1.5 rounded-lg bg-[#F9E33A] text-[#250216]"
            >
              Enroll
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-rose-200 hover:text-white hover:bg-white/10"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#2D041A] border-b border-[#F9E33A]/20 px-6 py-6 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-3 text-sm font-semibold text-rose-100">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#F9E33A]"
              >
                About Us
              </a>
              <a 
                href="#journey" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#F9E33A]"
              >
                Our Journey
              </a>
              <a 
                href="#programs" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#F9E33A]"
              >
                Programs (18)
              </a>
              <a 
                href="#gurus" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#F9E33A]"
              >
                Our Gurus (14)
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#F9E33A]"
              >
                Contact & Studio Hours
              </a>
            </div>

            <div className="pt-4 border-t border-[#8A064D] flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openEnrollModal();
                }}
                className="w-full py-3 rounded-xl text-center text-xs font-extrabold uppercase tracking-wider bg-[#F9E33A] text-[#250216] shadow-md"
              >
                Enroll Now • Contact Owner
              </button>
              
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl text-center text-xs font-bold text-rose-100 bg-[#590231] border border-[#8A064D] flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-[#F9E33A]" />
                <span>Director Portal Login</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =================================================================== */}
      {/* 2. HERO SECTION */}
      {/* =================================================================== */}
      <section className="relative bg-gradient-to-b from-[#3F0123] via-[#590231] to-[#750441] text-white pt-16 pb-20 overflow-hidden border-b border-[#F9E33A]/20">
        
        {/* Glow Spheres */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#8A064D]/50 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-[400px] h-[400px] bg-[#F9E33A]/15 rounded-full blur-[160px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              {/* Kannada & Heritage Pill */}
              <div className="inline-flex items-center gap-2 bg-[#2D041A]/80 border border-[#F9E33A]/40 px-4 py-1.5 rounded-full shadow-inner">
                <span className="w-2 h-2 rounded-full bg-[#F9E33A] animate-ping" />
                <span className="text-xs font-bold tracking-widest text-[#F9E33A] uppercase">
                  ಲಾಸ್ಯ ಸಾಂಸ್ಕೃತಿಕ ಅಕಾಡೆಮಿ
                </span>
                <span className="text-xs text-rose-200">| Estd. 2022</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] text-white">
                  Unleash Your <br />
                  <span className="bg-gradient-to-r from-[#F9E33A] via-[#FFF176] to-[#EBB128] bg-clip-text text-transparent drop-shadow-sm">
                    Creative Talent.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-rose-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Arts, music, dance and fitness education for children and young learners in Bangalore. Nurturing artistic excellence, creativity and discipline under renowned Gurus since 2022.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  onClick={() => openEnrollModal()}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-wider bg-gradient-to-r from-[#F9E33A] to-[#EBB128] hover:from-[#FFF176] hover:to-[#F9E33A] text-[#250216] shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#590231]" />
                  <span>Enroll Now • Contact Owner</span>
                </button>

                <a
                  href="#contact"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl text-sm font-bold text-white hover:text-[#F9E33A] bg-[#2D041A]/70 hover:bg-[#2D041A] border border-[#F0D5E4]/30 backdrop-blur-sm transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-[#F9E33A]" />
                  <span>Contact & Studio Tour</span>
                </a>
              </div>

              {/* Quick Trust Badges */}
              <div className="pt-4 border-t border-rose-500/20 grid grid-cols-3 gap-3 text-left">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0" />
                  <span className="text-xs text-rose-100 font-semibold">18 Structured Programs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0" />
                  <span className="text-xs text-rose-100 font-semibold">20 Expert Gurus</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#F9E33A] shrink-0" />
                  <span className="text-xs text-rose-100 font-semibold">500+ Proud Students</span>
                </div>
              </div>

            </div>

            {/* Right Banner Art Column */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <div className="relative w-full max-w-lg aspect-4/3 rounded-3xl p-3 bg-gradient-to-tr from-[#F9E33A]/30 via-white/10 to-transparent backdrop-blur-xs border border-[#F9E33A]/30 shadow-2xl overflow-hidden group">
                <Image
                  src="/cultural_banner.png"
                  alt="Laasya Cultural Academy Students in Classical Dance, Music, Martial Arts, and Chess"
                  width={600}
                  height={450}
                  className="object-contain w-full h-full drop-shadow-2xl group-hover:scale-102 transition-transform duration-500"
                  priority
                />
                
                {/* Floating Admission Badge */}
                <div className="absolute bottom-4 left-4 right-4 bg-[#2D041A]/90 backdrop-blur-md p-3.5 rounded-2xl border border-[#F9E33A]/40 flex items-center justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#8A064D] border border-[#F9E33A] text-[#F9E33A] flex items-center justify-center font-bold text-xs shrink-0">
                      2026
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Admissions Open 2026-27</h4>
                      <p className="text-[11px] text-rose-200">Weekend & Evening Batches Available</p>
                    </div>
                  </div>
                  <button
                    onClick={() => openEnrollModal()}
                    className="text-xs font-bold bg-[#F9E33A] text-[#250216] px-3 py-1.5 rounded-lg hover:bg-white transition cursor-pointer"
                  >
                    Inquire
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* =================================================================== */}
      {/* 3. KEY NUMBERS STRIP */}
      {/* =================================================================== */}
      <section className="bg-white border-b border-[#F0D5E4] py-10 shadow-xs relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-rose-100">
            
            <div className="pt-3 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#590231] tracking-tight">2022</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Founded at Vindhyagiri</p>
            </div>

            <div className="pt-3 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#8A064D] tracking-tight">500+</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Students Nurtured</p>
            </div>

            <div className="pt-3 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#590231] tracking-tight">18</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Cultural Programs</p>
            </div>

            <div className="pt-3 md:pt-0">
              <span className="text-3xl sm:text-4xl font-black text-[#8A064D] tracking-tight">20</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Expert Faculty</p>
            </div>

            <div className="pt-3 md:pt-0 col-span-2 md:col-span-1">
              <span className="text-3xl sm:text-4xl font-black text-[#590231] tracking-tight">14</span>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Renowned Gurus</p>
            </div>

          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 4. ABOUT US, MISSION, VISION & VALUES */}
      {/* =================================================================== */}
      <section id="about" className="py-20 bg-[#FFF9FB] border-b border-[#F0D5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-3xl mx-auto text-center space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
              About Laasya Cultural Academy
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D041A] tracking-tight">
              Nurturing Artistic Excellence & Life Skills
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Laasya Cultural Academy began in 2022 at Vindhyagiri with 30 students and a vision to nurture talent through arts and cultural education. Today, it has grown to over 500 students, providing quality training in cultural and extracurricular activities that build confidence, discipline, creativity, and life skills in every young learner.
            </p>
          </div>

          {/* Three Feature Cards: Mission, Vision, Values */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Mission */}
            <div className="bg-white p-8 rounded-3xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all hover:border-[#8A064D] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center font-bold">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2D041A]">Our Mission</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Make arts and cultural education accessible, systematic and engaging, so every student can explore their heritage and express their creative potential to the fullest.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white p-8 rounded-3xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all hover:border-[#8A064D] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF9E6] text-[#D4AF37] flex items-center justify-center font-bold">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2D041A]">Our Vision</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Be a leading cultural academy that enriches society by building a lifelong love for fine arts, classical traditions, and mindful fitness in the next generation.
              </p>
            </div>

            {/* Values */}
            <div className="bg-white p-8 rounded-3xl border border-[#F0D5E4] shadow-xs hover:shadow-md transition-all hover:border-[#8A064D] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-emerald-600 flex items-center justify-center font-bold">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-[#2D041A]">Our Core Values</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                Discipline, dedication, deep respect for cultural heritage, continuous self-improvement, and providing equal, encouraging platforms for all students to shine.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 5. OUR JOURNEY (TIMELINE) */}
      {/* =================================================================== */}
      <section id="journey" className="py-20 bg-white border-b border-[#F0D5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
              Milestones & Growth
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D041A] tracking-tight">
              Our Journey Over the Years
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              From our humble foundation at Vindhyagiri to Bangalore’s premier cultural institution.
            </p>
          </div>

          {/* Timeline Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            
            {/* 2022 */}
            <div className="relative bg-[#FFF9FB] p-6 rounded-3xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#590231] text-[#F9E33A] inline-block mb-3">
                  2022
                </span>
                <h3 className="font-bold text-base text-[#2D041A]">Foundation & Launch</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Established at Vindhyagiri with 30 passionate students. Bharathanatyam and Drawing launched with a structured arts syllabus.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100 text-[11px] font-semibold text-[#8A064D]">
                • 30 Students • 2 Programs
              </div>
            </div>

            {/* 2023 */}
            <div className="relative bg-[#FFF9FB] p-6 rounded-3xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#590231] text-[#F9E33A] inline-block mb-3">
                  2023
                </span>
                <h3 className="font-bold text-base text-[#2D041A]">100+ Students & New Programs</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Added Carnatic Vocal, Keyboard, Chess, and Karate. Crossed 100 students and held the first grand community cultural showcase.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100 text-[11px] font-semibold text-[#8A064D]">
                • 100+ Students • First Stage Showcase
              </div>
            </div>

            {/* 2024 */}
            <div className="relative bg-[#FFF9FB] p-6 rounded-3xl border border-rose-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#590231] text-[#F9E33A] inline-block mb-3">
                  2024
                </span>
                <h3 className="font-bold text-base text-[#2D041A]">300+ Students & VV Campus</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Relocated to the spacious 2nd floor of VV Maple Hub, Doddabanahalli Kannamangala. Faculty grew to 12 accredited masters.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-100 text-[11px] font-semibold text-[#8A064D]">
                • VV Maple Hub Campus • 12 Faculty
              </div>
            </div>

            {/* 2025-2026 */}
            <div className="relative bg-gradient-to-br from-[#FFF5F9] via-white to-[#FFF0F4] p-6 rounded-3xl border-2 border-[#EBB128] shadow-md flex flex-col justify-between">
              <div>
                <span className="text-xs font-black px-3 py-1 rounded-lg bg-[#EBB128] text-[#250216] inline-block mb-3">
                  2025 - 2026
                </span>
                <h3 className="font-bold text-base text-[#590231]">500+ Students & Vision</h3>
                <p className="text-xs text-gray-700 mt-2 leading-relaxed">
                  Surpassed 500+ active students across 18 art, music, and fitness programs, 20 faculty members, and intelligent student portals.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200 text-[11px] font-bold text-[#590231]">
                • 500+ Students • 18 Programs • 20 Faculty
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 6. PROGRAMS (ALL 18 DISCIPLINES) */}
      {/* =================================================================== */}
      <section id="programs" className="py-20 bg-[#FFF9FB] border-b border-[#F0D5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
                Academy Disciplines
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D041A] tracking-tight mt-2">
                Our 18 Premier Programs
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                Explore structured curricula designed for toddlers, school students, and adults.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {['All', 'Dance', 'Music', 'Visual Arts', 'Fitness & Martial Arts', 'Mind Games'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#590231] text-[#F9E33A] shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Programs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrograms.map((prog) => (
              <div
                key={prog.id}
                className="bg-white p-6 rounded-3xl border border-[#F0D5E4] hover:border-[#8A064D] hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] border border-rose-100">
                      {prog.badge}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {prog.age}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#2D041A] group-hover:text-[#8A064D] transition-colors">
                    {prog.title}
                  </h3>

                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                    {prog.summary}
                  </p>

                  {/* Highlights Bullet List */}
                  <ul className="mt-4 space-y-1.5 text-[11px] text-gray-600 border-t border-gray-100 pt-3">
                    {prog.highlights.map((h, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>

                </div>

                {/* Card Action */}
                <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">
                    {prog.duration}
                  </span>
                  
                  <button
                    onClick={() => openEnrollModal(prog.title)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#8A064D] group-hover:text-[#590231] hover:underline cursor-pointer"
                  >
                    <span>Enroll Now</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 7. OUR GURUS (ALL 14 INSTRUCTORS WITH EXPANDABLE IN-PLACE BIOS) */}
      {/* =================================================================== */}
      <section id="gurus" className="py-20 bg-white border-b border-[#F0D5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
              Masters & Mentors
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D041A] tracking-tight">
              Meet Our Renowned Gurus
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Dedicated professionals passionate about teaching, preserving cultural heritage, and nurturing young talent.
            </p>
          </div>

          {/* Gurus Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GURUS.map((guru) => {
              const isExpanded = expandedGuru === guru.id;

              return (
                <div
                  key={guru.id}
                  className={`bg-[#FFF9FB] p-6 rounded-3xl border transition-all flex flex-col justify-between ${
                    isExpanded 
                      ? 'border-[#8A064D] ring-2 ring-[#8A064D]/20 shadow-md bg-white' 
                      : 'border-[#F0D5E4] hover:border-[#8A064D]/60 hover:shadow-xs'
                  }`}
                >
                  <div>
                    
                    {/* Guru Header with Avatar */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#590231] to-[#8A064D] text-[#F9E33A] font-bold text-lg flex items-center justify-center shrink-0 shadow-md">
                        {guru.photoInitials}
                      </div>

                      <div className="overflow-hidden">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A064D] block truncate">
                          {guru.category}
                        </span>
                        <h3 className="font-bold text-base text-[#2D041A] truncate">
                          {guru.name}
                        </h3>
                        <p className="text-xs text-gray-600 font-medium truncate">
                          {guru.role}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats Pill */}
                    <div className="inline-block bg-[#FFF2F8] border border-rose-100 text-[#8A064D] text-[10px] font-bold px-2.5 py-1 rounded-md mb-3">
                      {guru.experience}
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {guru.summary}
                    </p>

                    {/* Expandable Bio Section */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-rose-100 space-y-3 animate-in fade-in duration-200">
                        <p className="text-xs text-gray-700 leading-relaxed font-normal">
                          {guru.fullBio}
                        </p>

                        {/* Credentials Pills */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {guru.credentials.map((c, i) => (
                            <span key={i} className="text-[10px] bg-white border border-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded">
                              ✓ {c}
                            </span>
                          ))}
                        </div>

                        {guru.phone && (
                          <div className="pt-2 text-xs font-semibold text-[#8A064D]">
                            Contact: <a href={`tel:${guru.phone.replace(/[^0-9+]/g, '')}`} className="underline">{guru.phone}</a>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  {/* Toggle Button */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() => setExpandedGuru(isExpanded ? null : guru.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#8A064D] hover:text-[#590231] cursor-pointer"
                    >
                      <span>{isExpanded ? 'Collapse Bio' : 'Read Full Bio'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => openEnrollModal(`Course under ${guru.name}`)}
                      className="text-[11px] font-bold px-3 py-1 rounded-lg bg-[#590231] text-[#F9E33A] hover:bg-[#780442] transition cursor-pointer"
                    >
                      Enroll with Guru
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 8. CALL TO ACTION BAND */}
      {/* =================================================================== */}
      <section className="bg-gradient-to-r from-[#3F0123] via-[#590231] to-[#750441] text-white py-16 border-y border-[#F9E33A]/30 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
          
          <span className="text-xs font-extrabold uppercase tracking-widest px-3.5 py-1 rounded-full bg-[#2D041A] text-[#F9E33A] border border-[#F9E33A]/40 inline-block">
            Start Your Journey Today
          </span>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-2xl mx-auto">
            Enrol your child in an art program, ask about course schedules, or book a tour of our studio.
          </h2>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => openEnrollModal()}
              className="px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#F9E33A] to-[#EBB128] text-[#250216] shadow-xl hover:scale-105 transition cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#590231]" />
              <span>Enroll Now • Contact Owner</span>
            </button>

            <a
              href="tel:+918151998899"
              className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-[#2D041A] hover:bg-black/60 border border-white/20 text-white transition flex items-center gap-2"
            >
              <Phone className="w-4 h-4 text-[#F9E33A]" />
              <span>Call 8151 998 899</span>
            </a>

            <a
              href="https://wa.me/918151998899?text=Hello%20Laasya%20Cultural%20Academy,%20I%20would%20like%20to%20know%20more%20about%20enrolling%20in%20courses."
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-md transition flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Us</span>
            </a>
          </div>

          <div className="pt-2 text-xs text-rose-200">
            Academy Director or Faculty?{' '}
            <Link href="/login" className="text-[#F9E33A] font-bold underline hover:text-white">
              Access the Director Portal Login &rarr;
            </Link>
          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 9. CONTACT, HOURS, MESSAGE FORM & MAP */}
      {/* =================================================================== */}
      <section id="contact" className="py-20 bg-white border-b border-[#F0D5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200">
              Get in Touch
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#2D041A] tracking-tight">
              We&apos;re Here to Help
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Parents are welcome to enrol a child, ask about batch schedules, or arrange a studio tour by message or call.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Column: Direct Info & Map */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-[#FFF9FB] p-6 rounded-3xl border border-[#F0D5E4] space-y-5">
                
                {/* Address */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Studio Address</h4>
                    <p className="text-sm font-semibold text-[#2D041A] mt-0.5">
                      VV Maple Hub, 2nd Floor, above Mayura Bakery, Doddabanahalli Kannamangala, Bangalore 560115
                    </p>
                  </div>
                </div>

                {/* Phone Numbers */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Call / WhatsApp</h4>
                    <p className="text-sm font-semibold text-[#2D041A] mt-0.5">
                      <a href="tel:+918151998899" className="hover:text-[#8A064D] underline mr-3">+91 8151 998 899</a>
                      <a href="tel:+918155889988" className="hover:text-[#8A064D] underline">+91 8155 889 988</a>
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Email Address</h4>
                    <p className="text-sm font-semibold text-[#2D041A] mt-0.5">
                      <a href="mailto:info@laasyaacademy.com" className="hover:text-[#8A064D] underline">
                        info@laasyaacademy.com
                      </a>
                    </p>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#590231] text-[#F9E33A] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-gray-500">Studio Hours</h4>
                    <p className="text-xs font-semibold text-[#2D041A] mt-0.5">
                      Monday to Saturday: 9:30 AM – 7:30 PM <br />
                      Sunday: 10:00 AM – 1:00 PM
                    </p>
                  </div>
                </div>

              </div>

              {/* Map View Card */}
              <div className="bg-[#FFF9FB] p-5 rounded-3xl border border-[#F0D5E4] text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#8A064D]">
                  <MapPin className="w-4 h-4" />
                  <span>Google Map Location: VV Maple Hub (12.97868° N, 77.75618° E)</span>
                </div>
                <p className="text-xs text-gray-500">
                  Located conveniently on the 2nd Floor of VV Maple Hub, Kannamangala main road with ample parking.
                </p>
                <a
                  href="https://maps.google.com/?q=VV+Maple+Hub+Kannamangala+Bangalore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#590231] hover:underline pt-1"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

            </div>

            {/* Right Column: Send Us a Message Form */}
            <div className="lg:col-span-7 bg-[#FFF9FB] p-8 rounded-3xl border border-[#F0D5E4] shadow-xs">
              <h3 className="text-xl font-bold text-[#2D041A] mb-1">Send Us a Message</h3>
              <p className="text-xs text-gray-500 mb-6">
                Fill out the form below and our academy admission team will contact you within 2 business hours.
              </p>

              {contactSuccess ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-6 rounded-2xl text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-base">Message Sent Successfully!</h4>
                  <p className="text-xs text-emerald-700">
                    Thank you for reaching out to Laasya Cultural Academy. Our coordinator will call you back shortly.
                  </p>
                  <button
                    onClick={() => setContactSuccess(false)}
                    className="text-xs font-bold underline mt-2 text-emerald-900 cursor-pointer"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ramesh Sharma"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#8A064D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. ramesh@gmail.com"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#8A064D] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={contactForm.phone}
                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#8A064D] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                        Subject *
                      </label>
                      <select
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:ring-2 focus:ring-[#8A064D] focus:outline-none"
                      >
                        <option value="Course Admission Inquiry">Course Admission Inquiry</option>
                        <option value="Batch Timings & Schedules">Batch Timings & Schedules</option>
                        <option value="Book Studio Tour">Book Studio Tour</option>
                        <option value="Fee Structure & Exams">Fee Structure & Exams</option>
                        <option value="Other Query">Other Query</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Message *
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Tell us about the courses you are interested in, your child's age, and your preferred timings..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-[#8A064D] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={contactLoading}
                    className="w-full py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#590231] hover:bg-[#780442] text-[#F9E33A] border border-[#EBB128] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{contactLoading ? 'Sending Message...' : 'Send Message'}</span>
                  </button>
                </form>
              )}

            </div>

          </div>

        </div>
      </section>

      {/* =================================================================== */}
      {/* 10. FOOTER */}
      {/* =================================================================== */}
      <footer className="bg-[#2D041A] text-white pt-16 pb-12 border-t border-[#F9E33A]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
            
            {/* Col 1 & 2: Brand & Address */}
            <div className="lg:col-span-2 space-y-4">
              <Image 
                src="/header_logo.png" 
                alt="Laasya Cultural Academy Logo" 
                width={200} 
                height={52} 
                className="object-contain"
              />
              <p className="text-xs text-[#F9E33A] font-bold tracking-widest uppercase">
                ಲಾಸ್ಯ ಸಾಂಸ್ಕೃತಿಕ ಅಕಾಡೆಮಿ • Unleash Your Talent
              </p>
              <p className="text-xs text-rose-200 leading-relaxed max-w-sm">
                Nurturing artistic excellence, creativity and discipline through premier cultural education since 2022.
              </p>
              <p className="text-xs text-rose-300">
                VV Maple Hub, 2nd Floor, above Mayura Bakery, Doddabanahalli Kannamangala, Bangalore 560115
              </p>
              
              {/* Social Media Links */}
              <div className="flex items-center gap-3 pt-2 text-xs">
                <a 
                  href="https://www.facebook.com/share/1Dvap6Up7t/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#590231] hover:bg-[#8A064D] border border-rose-500/30 flex items-center justify-center text-white transition"
                  title="Facebook"
                >
                  f
                </a>
                <a 
                  href="https://www.instagram.com/laasyaculturalacademy/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#590231] hover:bg-[#8A064D] border border-rose-500/30 flex items-center justify-center text-white transition"
                  title="Instagram"
                >
                  IG
                </a>
                <a 
                  href="https://www.youtube.com/@laasyaculturalacademy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#590231] hover:bg-[#8A064D] border border-rose-500/30 flex items-center justify-center text-white transition"
                  title="YouTube"
                >
                  YT
                </a>
                <a 
                  href="https://wa.me/918151998899" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-600 flex items-center justify-center text-white transition"
                  title="WhatsApp"
                >
                  WA
                </a>
              </div>
            </div>

            {/* Col 3: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F9E33A]">Quick Links</h4>
              <ul className="space-y-2 text-xs text-rose-200">
                <li><a href="#" className="hover:text-white transition">Home</a></li>
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#programs" className="hover:text-white transition">Our Courses (18)</a></li>
                <li><a href="#gurus" className="hover:text-white transition">Our Gurus</a></li>
                <li><a href="#journey" className="hover:text-white transition">Our Journey</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact Us</a></li>
                <li className="pt-2">
                  <Link href="/login" className="text-[#F9E33A] font-bold hover:underline flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Director Portal Login</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Programs Groups */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F9E33A]">Program Tracks</h4>
              <ul className="space-y-2 text-xs text-rose-200">
                <li>Bharathanatyam & Kuchipudi</li>
                <li>Western & Semi Classical</li>
                <li>Carnatic Vocal & Violin</li>
                <li>Keyboard, Guitar & Ukulele</li>
                <li>Drawing, Art & Craft</li>
                <li>Kalari, Karate & Yoga</li>
                <li>Gymnastics & Zumba</li>
                <li>Chess Grandmaster Tactics</li>
              </ul>
            </div>

            {/* Col 5: Contact Hours & Direct Call */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#F9E33A]">Direct Contact</h4>
              <div className="space-y-2 text-xs text-rose-200">
                <p>Phone: <br /><a href="tel:+918151998899" className="text-white font-bold hover:underline">+91 8151 998 899</a></p>
                <p>Alternate: <br /><a href="tel:+918155889988" className="text-white font-bold hover:underline">+91 8155 889 988</a></p>
                <p>Email: <br /><a href="mailto:info@laasyaacademy.com" className="text-white hover:underline">info@laasyaacademy.com</a></p>
                <p className="pt-1 text-[11px] text-rose-300">
                  Mon-Sat: 9:30 AM – 7:30 PM <br />
                  Sun: 10:00 AM – 1:00 PM
                </p>
              </div>
            </div>

          </div>

          {/* Copyright Bottom Bar */}
          <div className="pt-8 border-t border-rose-500/20 flex flex-col sm:flex-row items-center justify-between text-xs text-rose-300 gap-4">
            <p>© 2026 Laasya Cultural Academy. All rights reserved.</p>
            <p className="text-[11px] text-rose-400">
              Bangalore, Karnataka, India • Designed for Cultural Excellence
            </p>
          </div>

        </div>
      </footer>

      {/* =================================================================== */}
      {/* 11. ENROLL NOW / OWNER CONTACT MODAL (USER EXPLICIT REQUIREMENT) */}
      {/* =================================================================== */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#F0D5E4] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close Button */}
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center cursor-pointer transition"
              aria-label="Close Modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5 pb-4 border-b border-gray-100">
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-[#FFF2F8] text-[#8A064D] border border-rose-200 inline-block">
                Direct Admission & Counseling
              </span>
              <h3 className="text-2xl font-black text-[#2D041A]">
                Contact Academy Director to Enroll
              </h3>
              <p className="text-xs text-gray-500">
                Speak directly with the academy owner / director to confirm batch availability, fee structures, and trial sessions.
              </p>
            </div>

            {/* Owner Contact Spotlight Banner */}
            <div className="my-5 p-4 rounded-2xl bg-gradient-to-br from-[#590231] to-[#8A064D] text-white space-y-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F9E33A] text-[#250216] flex items-center justify-center font-bold text-sm shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-[#F9E33A] font-bold">Director Direct Line</h4>
                  <p className="text-base font-extrabold tracking-wide">
                    +91 8151 998 899 &nbsp;•&nbsp; +91 8155 889 988
                  </p>
                </div>
              </div>

              {/* Direct Action Buttons: Call & WhatsApp */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href="tel:+918151998899"
                  className="py-2.5 px-3 rounded-xl bg-[#F9E33A] text-[#250216] text-xs font-black text-center hover:bg-white transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Director</span>
                </a>

                <a
                  href={`https://wa.me/918151998899?text=Hello%20Laasya%20Cultural%20Academy,%20I%20would%20like%20to%20enroll%20in%20${encodeURIComponent(selectedProgramForEnroll)}.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Chat</span>
                </a>
              </div>
            </div>

            {/* Location & Studio Hours Summary */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs text-gray-700 space-y-1.5 mb-5">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#8A064D] shrink-0 mt-0.5" />
                <span><strong>Studio Location:</strong> 2nd Floor, VV Maple Hub, above Mayura Bakery, Kannamangala, Bangalore.</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#8A064D] shrink-0" />
                <span><strong>Counseling Hours:</strong> Mon-Sat 9:30 AM – 7:30 PM | Sun 10:00 AM – 1:00 PM</span>
              </div>
            </div>

            {/* Instant Admission Request Callback Form */}
            {modalFormSubmitted ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-sm text-emerald-800">Admission Request Received!</h4>
                <p className="text-xs text-emerald-700">
                  Thank you, <strong>{modalName}</strong>! The Academy Director will call you at <strong>{modalPhone}</strong> to confirm your slot for <strong>{selectedProgramForEnroll}</strong>.
                </p>
                <button
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="text-xs font-bold underline text-emerald-900 mt-2 cursor-pointer"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <form onSubmit={handleModalSubmit} className="space-y-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 pb-1 border-b border-gray-100">
                  Or Request an Instant Director Callback
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Selected Course
                  </label>
                  <select
                    value={selectedProgramForEnroll}
                    onChange={(e) => setSelectedProgramForEnroll(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                  >
                    {PROGRAMS.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title} ({p.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Parent / Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smt. Priya Sharma"
                      value={modalName}
                      onChange={(e) => setModalName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={modalPhone}
                      onChange={(e) => setModalPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-[#590231] hover:bg-[#780442] text-[#F9E33A] border border-[#EBB128] transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Request Admission Callback</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
