export type ProgramCategory = "Dance" | "Music" | "Visual arts" | "Fitness" | "Other";

export interface BatchInfo {
  id: string;
  name: string;
  days: string;
  time: string;
  level: string;
  ageGroup: string;
  status: "Open" | "Filling Fast" | "Few Seats Left" | "Weekend";
}

export interface Program {
  name: string;
  category: ProgramCategory;
  emoji: string;
  description: string;
  image: string;
  levels: string[];
  batches: BatchInfo[];
}

export const categoryTabs = [
  "All Programs",
  "Dance",
  "Music",
  "Visual arts",
  "Fitness & Martial Arts",
] as const;

export const categoryLabel: Record<ProgramCategory, string> = {
  Dance: "Dance",
  Music: "Music",
  "Visual arts": "Visual arts",
  Fitness: "Fitness & Martial Arts",
  Other: "Other",
};

export const programs: Program[] = [
  {
    name: "Bharathanatyam",
    category: "Dance",
    emoji: "💃",
    description: "Classical Indian dance form originating from Tamil Nadu.",
    image: "/images/courses/laasya_bharatanatyam.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "bh-1",
        name: "Aarambha - Morning Foundation",
        days: "Sat & Sun",
        time: "08:00 AM - 09:30 AM",
        level: "Beginner",
        ageGroup: "5 to 10 yrs",
        status: "Open",
      },
      {
        id: "bh-2",
        name: "Natya Taranga - Intermediate",
        days: "Tue & Thu",
        time: "05:00 PM - 06:30 PM",
        level: "Intermediate",
        ageGroup: "10 to 16 yrs",
        status: "Filling Fast",
      },
      {
        id: "bh-3",
        name: "Margam Mastery - Arangetram Prep",
        days: "Fri & Sun",
        time: "06:30 PM - 08:00 PM",
        level: "Advanced",
        ageGroup: "Teens & Adults",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Kuchipudi",
    category: "Dance",
    emoji: "💃",
    description: "Classical dance drama from Andhra Pradesh.",
    image: "/images/courses/kuchipudi.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "ku-1",
        name: "Tarangam Juniors",
        days: "Sat & Sun",
        time: "10:00 AM - 11:30 AM",
        level: "Beginner",
        ageGroup: "6+ yrs",
        status: "Open",
      },
      {
        id: "ku-2",
        name: "Bhamakalapam Advanced",
        days: "Wed & Fri",
        time: "05:30 PM - 07:00 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Mohiniyattam",
    category: "Dance",
    emoji: "💃",
    description: "Classical dance from Kerala with graceful movements.",
    image: "/images/courses/mohiniyattam.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "mo-1",
        name: "Lasyam Beginner Batch",
        days: "Sat & Sun",
        time: "11:30 AM - 01:00 PM",
        level: "Beginner",
        ageGroup: "All Ages",
        status: "Open",
      },
      {
        id: "mo-2",
        name: "Sopanam Grace Batch",
        days: "Tue & Thu",
        time: "06:30 PM - 07:30 PM",
        level: "Intermediate",
        ageGroup: "Teens & Adults",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Semi Classical",
    category: "Dance",
    emoji: "🎭",
    description: "Blend of classical and folk dance forms.",
    image: "/images/courses/semi_classical.jpg",
    levels: ["Beginner", "Intermediate"],
    batches: [
      {
        id: "sc-1",
        name: "Rhythm & Expression",
        days: "Sat & Sun",
        time: "04:00 PM - 05:00 PM",
        level: "Beginner",
        ageGroup: "7 to 15 yrs",
        status: "Open",
      },
      {
        id: "sc-2",
        name: "Fusion Beats Evening",
        days: "Mon & Wed",
        time: "06:00 PM - 07:00 PM",
        level: "Intermediate",
        ageGroup: "Teens & Adults",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Western Dance",
    category: "Dance",
    emoji: "🕺",
    description: "Contemporary western dance styles including Hip-Hop, Jazz and more.",
    image: "/images/courses/western_dance.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "wd-1",
        name: "Hip-Hop & Urban Grooves",
        days: "Sat & Sun",
        time: "03:00 PM - 04:30 PM",
        level: "All Levels",
        ageGroup: "6 to 14 yrs",
        status: "Open",
      },
      {
        id: "wd-2",
        name: "Contemporary Fusion",
        days: "Tue & Thu",
        time: "06:00 PM - 07:30 PM",
        level: "Intermediate",
        ageGroup: "Teens & Adults",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Zumba",
    category: "Dance",
    emoji: "🏃",
    description: "Latin-inspired dance fitness program.",
    image: "/images/courses/zumba.jpg",
    levels: ["Beginner", "Intermediate"],
    batches: [
      {
        id: "zu-1",
        name: "Morning Cardio Zumba",
        days: "Mon, Wed, Fri",
        time: "07:00 AM - 08:00 AM",
        level: "All Levels",
        ageGroup: "Adults",
        status: "Open",
      },
      {
        id: "zu-2",
        name: "Evening Zumba Blast",
        days: "Tue, Thu, Sat",
        time: "06:30 PM - 07:30 PM",
        level: "All Levels",
        ageGroup: "Adults",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Gymnastics",
    category: "Fitness",
    emoji: "🤸",
    description: "Artistic gymnastics for flexibility and strength.",
    image: "/images/courses/gymnastics.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "gy-1",
        name: "Flexi-Kids Level 1",
        days: "Sat & Sun",
        time: "09:00 AM - 10:30 AM",
        level: "Beginner",
        ageGroup: "4 to 9 yrs",
        status: "Filling Fast",
      },
      {
        id: "gy-2",
        name: "Acrobatics & Balance Level 2",
        days: "Sat & Sun",
        time: "10:30 AM - 12:00 PM",
        level: "Intermediate",
        ageGroup: "8 to 15 yrs",
        status: "Open",
      },
    ],
  },
  {
    name: "Kalari",
    category: "Fitness",
    emoji: "🥋",
    description: "Ancient Kerala martial art form Kalaripayattu.",
    image: "/images/courses/kalari.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "ka-1",
        name: "Meythari Body Conditioning",
        days: "Sat & Sun",
        time: "07:00 AM - 08:30 AM",
        level: "Beginner",
        ageGroup: "7+ yrs",
        status: "Open",
      },
      {
        id: "ka-2",
        name: "Kolthari Wooden Weapons",
        days: "Sat & Sun",
        time: "08:30 AM - 10:00 AM",
        level: "Intermediate",
        ageGroup: "10+ yrs",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Karate",
    category: "Fitness",
    emoji: "🥋",
    description: "Japanese martial art with belt-level progression.",
    image: "/images/courses/karate.jpg",
    levels: ["White", "Yellow", "Green", "Blue", "Brown", "Black"],
    batches: [
      {
        id: "kr-1",
        name: "White & Yellow Belts Batch",
        days: "Mon, Wed, Fri",
        time: "05:00 PM - 06:00 PM",
        level: "Beginner",
        ageGroup: "5 to 12 yrs",
        status: "Open",
      },
      {
        id: "kr-2",
        name: "Green & Blue Belts Batch",
        days: "Mon, Wed, Fri",
        time: "06:00 PM - 07:00 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
      {
        id: "kr-3",
        name: "Brown & Black Belt Kumite",
        days: "Sat & Sun",
        time: "04:00 PM - 05:30 PM",
        level: "Advanced",
        ageGroup: "Teens & Adults",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Yoga",
    category: "Fitness",
    emoji: "🧘",
    description: "Traditional yoga practice for body and mind wellness.",
    image: "/images/courses/yoga.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "yo-1",
        name: "Surya Kriya Morning Flow",
        days: "Mon to Fri",
        time: "06:30 AM - 07:30 AM",
        level: "All Levels",
        ageGroup: "Adults",
        status: "Open",
      },
      {
        id: "yo-2",
        name: "Kids Yoga & Mindfulness",
        days: "Sat & Sun",
        time: "08:00 AM - 09:00 AM",
        level: "Beginner",
        ageGroup: "5 to 14 yrs",
        status: "Open",
      },
    ],
  },
  {
    name: "Carnatic Music",
    category: "Music",
    emoji: "🎵",
    description: "South Indian classical music tradition.",
    image: "/images/courses/carnatic_music.jpg",
    levels: ["Beginner", "Intermediate", "Advanced", "Expert"],
    batches: [
      {
        id: "cm-1",
        name: "Sarali Swaras Foundation Batch",
        days: "Sat & Sun",
        time: "09:30 AM - 10:30 AM",
        level: "Beginner",
        ageGroup: "5+ yrs",
        status: "Open",
      },
      {
        id: "cm-2",
        name: "Varnam Intermediate Batch",
        days: "Tue & Thu",
        time: "05:30 PM - 06:30 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
      {
        id: "cm-3",
        name: "Keerthanai Senior Batch",
        days: "Sat & Sun",
        time: "11:00 AM - 12:30 PM",
        level: "Advanced",
        ageGroup: "All Ages",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Guitar",
    category: "Music",
    emoji: "🎸",
    description: "Acoustic and electric guitar lessons.",
    image: "/images/courses/guitar.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "gt-1",
        name: "Acoustic Chords Primer",
        days: "Sat & Sun",
        time: "10:00 AM - 11:00 AM",
        level: "Beginner",
        ageGroup: "8+ yrs",
        status: "Open",
      },
      {
        id: "gt-2",
        name: "Fingerstyle & Lead Guitar",
        days: "Sat & Sun",
        time: "11:30 AM - 12:30 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Keyboard",
    category: "Music",
    emoji: "🎹",
    description: "Keyboard/Piano lessons for all skill levels.",
    image: "/images/courses/laasya_music.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "kb-1",
        name: "Little Maestros Piano Basics",
        days: "Sat & Sun",
        time: "10:00 AM - 11:00 AM",
        level: "Beginner",
        ageGroup: "5 to 10 yrs",
        status: "Open",
      },
      {
        id: "kb-2",
        name: "Trinity Grade Exam Prep",
        days: "Wed & Fri",
        time: "05:00 PM - 06:00 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Ukulele",
    category: "Music",
    emoji: "🎸",
    description: "Ukulele lessons for beginners and intermediate players.",
    image: "/images/courses/ukulele.jpg",
    levels: ["Beginner", "Intermediate"],
    batches: [
      {
        id: "uk-1",
        name: "Strum & Sing Ukulele",
        days: "Sat & Sun",
        time: "02:00 PM - 03:00 PM",
        level: "Beginner",
        ageGroup: "6+ yrs",
        status: "Open",
      },
    ],
  },
  {
    name: "Violin",
    category: "Music",
    emoji: "🎻",
    description: "Classical violin lessons with Carnatic and Western styles.",
    image: "/images/courses/violin.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "vn-1",
        name: "Carnatic Bowing Primer",
        days: "Sat & Sun",
        time: "03:00 PM - 04:30 PM",
        level: "Beginner",
        ageGroup: "7+ yrs",
        status: "Open",
      },
      {
        id: "vn-2",
        name: "Raga Gamakas Intermediate",
        days: "Tue & Thu",
        time: "06:30 PM - 07:30 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Chess",
    category: "Other",
    emoji: "♟️",
    description: "Strategic chess training from basics to tournament level.",
    image: "/images/courses/chess.jpg",
    levels: ["Beginner", "Intermediate", "Advanced", "Tournament"],
    batches: [
      {
        id: "ch-1",
        name: "Pawn Pioneers (Basics & Rules)",
        days: "Sat & Sun",
        time: "02:00 PM - 03:30 PM",
        level: "Beginner",
        ageGroup: "5 to 12 yrs",
        status: "Open",
      },
      {
        id: "ch-2",
        name: "Knight Tactics & Openings",
        days: "Sat & Sun",
        time: "03:30 PM - 05:00 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
      {
        id: "ch-3",
        name: "Grandmaster Tournament Prep",
        days: "Sunday",
        time: "05:00 PM - 07:00 PM",
        level: "Tournament",
        ageGroup: "Tournament Players",
        status: "Few Seats Left",
      },
    ],
  },
  {
    name: "Art and Craft",
    category: "Visual arts",
    emoji: "🎨",
    description: "Creative arts and craft activities for all ages.",
    image: "/images/courses/laasya_art.jpg",
    levels: ["Beginner", "Intermediate"],
    batches: [
      {
        id: "ac-1",
        name: "Creative Hands Workshop",
        days: "Sat & Sun",
        time: "11:00 AM - 12:30 PM",
        level: "Beginner",
        ageGroup: "4 to 10 yrs",
        status: "Open",
      },
      {
        id: "ac-2",
        name: "Mixed Media & Craft Masters",
        days: "Saturday",
        time: "03:00 PM - 05:00 PM",
        level: "Intermediate",
        ageGroup: "8 to 15 yrs",
        status: "Filling Fast",
      },
    ],
  },
  {
    name: "Drawing",
    category: "Visual arts",
    emoji: "✏️",
    description: "Pencil, charcoal and ink drawing techniques.",
    image: "/images/courses/drawing.jpg",
    levels: ["Beginner", "Intermediate", "Advanced"],
    batches: [
      {
        id: "dr-1",
        name: "Pencil Sketching & Shading",
        days: "Sat & Sun",
        time: "09:30 AM - 11:00 AM",
        level: "Beginner",
        ageGroup: "5+ yrs",
        status: "Open",
      },
      {
        id: "dr-2",
        name: "Charcoal, Ink & Watercolors",
        days: "Sat & Sun",
        time: "11:00 AM - 12:30 PM",
        level: "Intermediate",
        ageGroup: "All Ages",
        status: "Filling Fast",
      },
      {
        id: "dr-3",
        name: "Fine Arts Canvas Masterclass",
        days: "Sunday",
        time: "02:00 PM - 04:30 PM",
        level: "Advanced",
        ageGroup: "Teens & Adults",
        status: "Few Seats Left",
      },
    ],
  },
];

export interface FacultyMember {
  name: string;
  role: string;
  emoji: string;
  image: string;
  teaser: string;
  bio: string;
  experience?: string;
  specialization?: string[];
}

export const faculty: FacultyMember[] = [
  {
    name: "Anusha Sumesh",
    role: "Bharatanatyam · Founder",
    emoji: "💃",
    image: "/images/unr05149.jpg",
    experience: "10+ Years",
    specialization: ["Bharatanatyam", "Choreography", "Arangetram Guidance"],
    teaser:
      "A gifted Bharatanatyam performer, choreographer, and teacher, hails from Calicut, Kerala. Deeply rooted in a family that celebrates Indian classical dance forms.",
    bio: "A gifted Bharatanatyam performer, choreographer, and teacher, hails from Calicut, Kerala. Deeply rooted in a family that celebrates Indian classical dance forms like Bharatanatyam, Kuchipudi, and Mohiniyattam, specialized in Bharatanatyam. Graduated in Bharatanatyam from the University of Art & Culture in 2015 and completed her Arangetram at Guruvayoor Shri Krishna Temple in 2005. Since 2017, a dedicated Bharatanatyam teacher and freelancer. Founder of Laasya Cultural Academy in Kannamangala, Bangalore. Instagram: @anu_sumesh_ or @laasya.cultural.academy.",
  },
  {
    name: "Shri. H. Manikandan",
    role: "Carnatic Vocal Guru",
    emoji: "🎵",
    image: "/images/gurus/manikandan.jpg",
    experience: "15+ Years",
    specialization: ["Classical Vocal", "Keerthanams", "Sangeetha Acharya"],
    teaser:
      "15 years of experience imparting Carnatic music to people of all ages, conferred the title “Sangeetha Acharya.” Began pursuing music at age 11.",
    bio: "15 years of experience imparting Carnatic music to people of all ages, conferred the title “Sangeetha Acharya.” Began pursuing music at age 11 under Palakkad Sisters Smt. Nandini Shankar and Smt. Seethalakshmi Krishnan. Unique teaching style attracts students from KG kids to working professionals.\n\nMusic road map:\n· Basic Batch (Foundation) — Sarali Swaras, Jantai Swaras, Madhya sthayi Swaram, Thaara sthayi Swaram, Alankaram.\n· Junior Level — ragas: Malahari, Mohanam, Kalyani, Saveri, Kamboji, Arabi, Ananda Bhairavi, Sudha Saveri.\n· Intermediate Level (Varnam Batch) — Varnams, Sankarabharanam, Mohanam, Abhogi, Kalyani, Vasantha.\n· Senior Level (Keerthanai Batch) — Keerthanams of composers like Thyagaraja Swamigal, Muttuswamy Dikshithar, Syama Sastrigal, Swathi Thirunal, Pattinam Subramanyam Iyer.",
  },
  {
    name: "Dipayan Sarkar",
    role: "Drawing & Fine Arts",
    emoji: "🎨",
    image: "/images/gurus/dipayan_sarkar.jpg",
    experience: "6+ Years",
    specialization: ["Printmaking", "Sketching", "Visual Art Mentoring"],
    teaser:
      "An accomplished visual artist and art educator with expertise in graphic art printmaking. Holds a BFA (2019) and MFA (2021) from Kala Bhavana, Visva-Bharati, Santiniketan.",
    bio: "An accomplished visual artist and art educator with expertise in graphic art printmaking. Holds a BFA (2019) and MFA (2021) from Kala Bhavana, Visva-Bharati, Santiniketan.\n\nProfessional experience: Judging children's art competitions (Charukala Kendra, Kolkata, 2020). Graphic Designer at Red Molecule Event Management, Kolkata (2021). Art Teacher at The Art Hub, Delhi (2022). Visual Art Teacher at Akal Academy, Himachal Pradesh (CBSE, 1.5 years).",
  },
  {
    name: "Sai Krishna",
    role: "Chess Instructor",
    emoji: "♟️",
    image: "/images/gurus/sai_krishna.jpg",
    experience: "5+ Years",
    specialization: ["Tournament Strategy", "Game Analysis", "Tactical Openings"],
    teaser:
      "Tournament-seasoned chess mentor with 2 Gold Medals at district level, 3 Silver Medals at state level and an Inter-College Championship title.",
    bio: "Achievements: 2 Gold Medals – District Level. 3 Silver Medals – State Level. Inter-College Champion. 2x Sports Day Winner.\n\nEducation: Master's in Communication Systems, NIT Warangal (2022–2024).\n\nExperience & Leadership: Chess Team Captain. Strong tournament experience. Expert in strategy & game analysis.\n\nDiscipline · Strategic Thinking · Confidence.",
  },
  {
    name: "Nandhana",
    role: "Bharatanatyam Guru",
    emoji: "🌸",
    image: "/images/unr05837.jpg",
    experience: "8+ Years",
    specialization: ["Abhinaya", "Stage Performance", "Technical Rhythm"],
    teaser:
      "A Bharatanatyam dancer and performer who began her dance journey at the age of six, with a Bachelor's and Master's degree in Bharatanatyam.",
    bio: "Nandana Krishna is a Bharatanatyam dancer and performer who began her dance journey at the age of six. She holds a Bachelor's degree in Bharatanatyam from Sree Shankaracharya University of Sanskrit and a Master's degree in Bharatanatyam from St. Teresa's College, Ernakulam.\n\nWith experience in training students for stage programs and special events, she has guided learners in developing strong technical skills, expression, and stage confidence. She has choreographed numerous group and individual performances and has successfully prepared students for various cultural and institutional programs.\n\nAs a performer, Nandana has presented Bharatanatyam in solo performances at temples, cultural associations, festivals and community events. Through her teaching and performances she is committed to preserving the rich traditions of Bharatanatyam while inspiring the next generation of dancers.",
  },
  {
    name: "Sruthy Ramesh",
    role: "Mohiniyattam · Kuchipudi",
    emoji: "💮",
    image: "/images/unr05834.jpg",
    experience: "20+ Years",
    specialization: ["Mohiniyattam", "Kuchipudi", "Arangetram Mentorship"],
    teaser:
      "A passionate and dedicated classical dancer with 20+ years of experience in various dance styles, skilled in live stage performance and disciplined teaching.",
    bio: "A passionate and dedicated classical dancer with 20+ years of experience in various dance styles. Skilled in live stage performance and disciplined teaching, with a strong ability to train students for Arangetram, cultural programs and various dance performances.",
  },
  {
    name: "Sathish Kale",
    role: "Yoga & Wellness Master",
    emoji: "🧘",
    image: "/images/gurus/sathish_kale.jpg",
    experience: "7+ Years",
    specialization: ["Asana Practice", "Pranayama", "Mindfulness"],
    teaser: "Certified yoga specialist dedicated to building strength, posture, flexibility, and meditative inner balance.",
    bio: "Designation: Yoga & Wellness Specialist. Dedicated to guiding learners of all age groups in authentic Hatha and Vinyasa practices, breathing exercises (Pranayama), postural correction, and daily mindfulness routines.",
  },
];

export const stats = [
  { emoji: "👥", value: "500+", label: "Active Students" },
  { emoji: "🎨", value: "18", label: "Art Forms" },
  { emoji: "🏆", value: "4+", label: "Years of Excellence" },
  { emoji: "👨‍🏫", value: "7+", label: "Expert Faculty" },
];

export const galleryItems = [
  {
    image: "/images/unr05952.jpg",
    emoji: "🎭",
    title: "Annual Showcase",
    caption: "Students performing classical dance live on stage",
  },
  {
    image: "/images/unr05149.jpg",
    emoji: "💃",
    title: "Bharatanatyam",
    caption: "Traditional dance mudra practice session",
  },
  {
    image: "/images/unr05482.jpg",
    emoji: "🎹",
    title: "Melodious Keys",
    caption: "Keyboard and violin training setup",
  },
  {
    image: "/images/unr05716.jpg",
    emoji: "🎨",
    title: "Visual Arts Studio",
    caption: "Creative sketching, coloring, and crafting",
  },
];

export const whyUsItems = [
  {
    emoji: "🎓",
    title: "Expert Faculty",
    text: "Learn from highly trained, experienced teachers dedicated to personalized mentoring.",
  },
  {
    emoji: "✨",
    title: "Holistic Development",
    text: "We foster life skills like discipline, posture, focus, stage confidence, and poise.",
  },
  {
    emoji: "📍",
    title: "State-of-the-Art Studio",
    text: "Spacious, mirror-fitted, safe, and hygienic classrooms at an easily accessible campus.",
  },
  {
    emoji: "🎭",
    title: "Performance Platforms",
    text: "Annual academy functions, regional fests, and stage events to showcase student growth.",
  },
  {
    emoji: "💻",
    title: "Digital Student Portal",
    text: "Track progress, view attendance, access video files, and check grades from any device.",
  },
  {
    emoji: "📜",
    title: "Certified Courses",
    text: "Standard curriculum design with level assessments and recognized certificates.",
  },
];

export const contact = {
  address:
    "VV Maple Hub, 2nd Floor above Mayura Bakery, Doddabanahalli Kannamangala, Bangalore 560115",
  phones: ["+91 8151 998 899", "+91 8155 889 988"],
  email: "info@laasyaacademy.com",
};

export interface Testimonial {
  name: string;
  context: string;
  quote: string;
}

export const testimonials: Testimonial[] = [
  {
    name: "Dr. Ananya Rao",
    context: "Parent of Tanvi (Bharatanatyam & Vocal)",
    quote:
      "Laasya Academy has been transformative for my daughter. The gurus maintain authentic guru-shishya discipline while being immensely caring and supportive. Her posture, grace, and stage confidence have blossomed.",
  },
  {
    name: "Karthik Venkatraman",
    context: "Parent of Aadhav (Carnatic Music & Keyboard)",
    quote:
      "Guru Manikandan Sir's teaching methodology is exemplary. The regular stage performances and structured swara exercises keep my son thoroughly motivated and passionate about Indian classical music.",
  },
  {
    name: "Meera Nair",
    context: "Parent of Ishaan (Fine Arts & Karate)",
    quote:
      "The campus environment is vibrant and hygienic. Having top mentors for martial arts and creative sketching under one roof makes Laasya our family's favorite academy in Bangalore.",
  },
  {
    name: "Rajeshwar Iyer",
    context: "Parent of Diya (Semi Classical & Chess)",
    quote:
      "From trial classes to stage showcases, the academy management and faculty are thoroughly professional. My child looks forward to her weekend classes every single week.",
  },
];
