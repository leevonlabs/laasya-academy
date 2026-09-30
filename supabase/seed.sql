-- Supabase standard seed file: loads the 18 academy courses
-- Run automatically by `supabase db reset` or `supabase db seed`

INSERT INTO public.courses (title, code, category, description, duration_months, monthly_fee, is_active)
VALUES
  ('Bharathanatyam', 'LCA-BN01', 'Classical Dance', 'Traditional Indian classical dance form originating in Tamil Nadu, emphasizing footwork, expressions (Abhinaya), and mudras.', 12, 2000.00, true),
  ('Kuchupudi', 'LCA-KP01', 'Classical Dance', 'Renowned classical dance tradition of Andhra Pradesh, blending rhythmic footwork, storytelling, and fluid movements.', 12, 2000.00, true),
  ('Mohiniyatam', 'LCA-MY01', 'Classical Dance', 'Classical dance of Kerala characterized by graceful, swaying body movements and delicate expressions.', 12, 2000.00, true),
  ('Semi Classical', 'LCA-SC01', 'Classical Dance', 'A blend of pure classical techniques with contemporary rhythms and modern expressive dance choreography.', 6, 1800.00, true),
  ('Western Dance', 'LCA-WD01', 'Modern Dance & Fitness', 'Dynamic choreography covering Hip-Hop, Contemporary, Freestyle, and Jazz dance routines.', 6, 1800.00, true),
  ('Zumba', 'LCA-ZB01', 'Modern Dance & Fitness', 'High-energy aerobic fitness dance program incorporating Latin and international rhythms for cardio and toning.', 3, 1500.00, true),
  ('Yoga', 'LCA-YG01', 'Modern Dance & Fitness', 'Holistic mind and body wellness practice encompassing Asanas, Pranayama breathing, flexibility, and meditation.', 6, 1500.00, true),
  ('Gymnastic', 'LCA-GM01', 'Modern Dance & Fitness', 'Fundamental acrobatic training, balance, agility, flexibility, and core strength conditioning for young learners.', 12, 2200.00, true),
  ('Carnatic Music', 'LCA-CM01', 'Vocal & Music', 'Traditional South Indian classical vocal training, covering Swaras, Ragas, Talas, Geethams, and Varnams.', 12, 2000.00, true),
  ('Keyboard', 'LCA-KB01', 'Musical Instruments', 'Western electronic keyboard training covering finger drills, staff notation, chords, scales, and popular melodies.', 12, 2200.00, true),
  ('Guitar', 'LCA-GT01', 'Musical Instruments', 'Acoustic and classical guitar fundamentals, rhythm strums, chord transitions, fingerpicking, and song accompaniment.', 12, 2200.00, true),
  ('Ukulele', 'LCA-UK01', 'Musical Instruments', 'Fun and accessible 4-string Hawaiian instrument training, focusing on quick chords, rhythmic strumming, and singing along.', 6, 1800.00, true),
  ('Violin', 'LCA-VN01', 'Musical Instruments', 'Disciplined bowed string instrument training in Carnatic or Western styles, bowing techniques, and intonation.', 12, 2500.00, true),
  ('Kalari', 'LCA-KL01', 'Martial Arts', 'Kalaripayattu, the ancient martial art of Kerala, known for its flexibility routines (Meipayattu), strikes, and defense.', 12, 2000.00, true),
  ('Karatte', 'LCA-KT01', 'Martial Arts', 'Traditional martial arts focusing on self-defense, discipline, punches, kicks, belt gradings, and Katas.', 12, 1800.00, true),
  ('Drawing', 'LCA-DR01', 'Fine Arts', 'Foundation sketching, pencil shading, color theory, perspective drawing, and creative visualization.', 6, 1200.00, true),
  ('Art and Craft', 'LCA-AC01', 'Fine Arts', 'Hands-on creative crafts including origami, clay modelling, mixed media painting, DIY decor, and paper art.', 6, 1200.00, true),
  ('Chess', 'LCA-CH01', 'Mind Sports', 'Strategic mind sport training covering openings, tactics, middle-game positioning, endgame mastery, and tournament preparation.', 6, 1500.00, true)
ON CONFLICT (title) DO UPDATE
SET category = EXCLUDED.category,
    description = EXCLUDED.description,
    duration_months = EXCLUDED.duration_months,
    monthly_fee = EXCLUDED.monthly_fee,
    is_active = EXCLUDED.is_active;
