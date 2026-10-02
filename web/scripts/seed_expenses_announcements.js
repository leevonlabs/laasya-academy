const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seedData() {
  const client = await pool.connect();
  try {
    // Check if expenses already have rows
    const expCount = await client.query('SELECT COUNT(*) FROM public.expenses');
    if (parseInt(expCount.rows[0].count) === 0) {
      console.log('Seeding initial realistic expenses...');
      const sampleExpenses = [
        {
          expense_date: '2026-09-01',
          category: 'Rent',
          description: 'Main Academy Studio Space Monthly Rent - Vindhyagiri Campus',
          amount: 45000.00,
          payment_method: 'Bank transfer',
          vendor: 'Sri Vindhya Realties Pvt Ltd',
          reference_number: 'NEFT-AXIS-992140',
          attachment_name: 'rent_agreement_sep2026.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-05',
          category: 'Electricity',
          description: 'BESCOM Studio Lighting and Air Conditioning Bill for August/September',
          amount: 7850.00,
          payment_method: 'UPI',
          vendor: 'BESCOM Karnataka',
          reference_number: 'UPI-260905102341',
          attachment_name: 'bescom_bill_sep26.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-10',
          category: 'Instruments',
          description: 'New Tanjore Rosewood Mridangam & Ghungroo bells for advanced students',
          amount: 18500.00,
          payment_method: 'Bank transfer',
          vendor: 'Sapthaswara Musicals Bangalore',
          reference_number: 'IMPS-HDFC-882194',
          attachment_name: 'mridangam_invoice.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-14',
          category: 'Costumes',
          description: 'Silk Bharatanatyam recital costumes & temple jewellery sets (Set of 6)',
          amount: 24000.00,
          payment_method: 'UPI',
          vendor: 'Kala Kendra Dance Costumes',
          reference_number: 'UPI-260914872109',
          attachment_name: 'costume_invoice.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-18',
          category: 'Maintenance',
          description: 'Dance wooden flooring polishing, acoustic panel repair, and sound check',
          amount: 6200.00,
          payment_method: 'Cash',
          vendor: 'Sri Murugan Wood Works',
          reference_number: 'CASH-REC-042',
          attachment_name: null,
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-22',
          category: 'Supplies',
          description: 'Yoga mats, stage makeup sets, first aid supplies, and sanitization kits',
          amount: 4350.00,
          payment_method: 'UPI',
          vendor: 'Metro Cash & Carry',
          reference_number: 'UPI-260922441920',
          attachment_name: 'metro_receipt.jpg',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-09-28',
          category: 'Event costs',
          description: 'Auditorium booking advance for Navaratri Sangeetha Nrithyotsava 2026',
          amount: 35000.00,
          payment_method: 'Bank transfer',
          vendor: 'Chowdiah Memorial Hall Trust',
          reference_number: 'NEFT-KOTAK-710924',
          attachment_name: 'chowdiah_booking_receipt.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-10-01',
          category: 'Rent',
          description: 'Studio Rent for October 2026 - Vindhyagiri Campus',
          amount: 45000.00,
          payment_method: 'Bank transfer',
          vendor: 'Sri Vindhya Realties Pvt Ltd',
          reference_number: 'NEFT-AXIS-100291',
          attachment_name: 'rent_oct2026.pdf',
          created_by: 'Academy Director'
        },
        {
          expense_date: '2026-10-02',
          category: 'Supplies',
          description: 'Navaratri Pooja floral decorations, prasadam materials, and camphor',
          amount: 3200.00,
          payment_method: 'Cash',
          vendor: 'Sri Raghavendra Stores',
          reference_number: 'CASH-REC-049',
          attachment_name: null,
          created_by: 'Academy Director'
        }
      ];

      for (const exp of sampleExpenses) {
        await client.query(`
          INSERT INTO public.expenses (
            expense_date, category, description, amount, payment_method,
            vendor, reference_number, attachment_name, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `, [
          exp.expense_date, exp.category, exp.description, exp.amount,
          exp.payment_method, exp.vendor, exp.reference_number,
          exp.attachment_name, exp.created_by
        ]);
      }
      console.log('Seeded expenses successfully.');
    }

    // Check announcements
    const annCount = await client.query('SELECT COUNT(*) FROM public.announcements');
    if (parseInt(annCount.rows[0].count) === 0) {
      console.log('Seeding initial realistic announcements...');
      const sampleAnnouncements = [
        {
          title: 'Navaratri & Vijayadashami Special Holiday Schedule',
          message: 'The Academy will observe festival holidays from 11th to 14th October 2026. Special Vijayadashami Vidyarambham Pooja will be conducted on 14th Oct at 8:30 AM in the Main Hall. All students and gurus are cordially invited.',
          audience: 'All students',
          type_tag: 'Holiday',
          publish_date: '2026-09-28',
          expiry_date: '2026-10-15',
          status: 'Published',
          delivery_status: 'System verified (Delivered)'
        },
        {
          title: 'Quarterly Guru Review & Curriculum Alignment Meeting',
          message: 'All dance and music Gurus are requested to attend the quarterly academic review session this Saturday at 4:30 PM in Studio Hall A. Discussion topics include student progress assessments and upcoming Arangetram dates.',
          audience: 'Trainers',
          type_tag: 'General',
          publish_date: '2026-09-30',
          expiry_date: '2026-10-06',
          status: 'Published',
          delivery_status: 'System verified (Delivered)'
        },
        {
          title: 'Batch Timing Adjustment - Kuchipudi Senior Weekend Batch',
          message: 'Due to rehearsal scheduling for the annual cultural festival, Saturday Kuchipudi Advanced Batch 2 will commence at 10:30 AM instead of 9:00 AM, starting 3rd October 2026.',
          audience: 'Selected course or batch',
          type_tag: 'Schedule change',
          publish_date: '2026-10-01',
          expiry_date: '2026-10-20',
          status: 'Published',
          delivery_status: 'System verified (Delivered)'
        },
        {
          title: 'Tuition Fee Due Reminder for Term 4 (Oct - Dec)',
          message: 'Dear Parents & Students, quarterly tuition fees for October to December are due on or before 10th October. Please clear payments via UPI or net banking directly through the portal to avoid late adjustment fees.',
          audience: 'All students',
          type_tag: 'Fee reminder',
          publish_date: '2026-10-01',
          expiry_date: '2026-10-12',
          status: 'Published',
          delivery_status: 'System verified (Delivered)'
        },
        {
          title: 'Winter Classical Music Workshop with Vidwan Guest Masters',
          message: 'Draft proposal for a 3-day Carnatic Vocal and Violin Intensive masterclass series scheduled for November 2026 with visiting masters from Chennai.',
          audience: 'All students',
          type_tag: 'General',
          publish_date: '2026-10-15',
          expiry_date: '2026-11-20',
          status: 'Draft',
          delivery_status: 'Queued'
        }
      ];

      for (const ann of sampleAnnouncements) {
        await client.query(`
          INSERT INTO public.announcements (
            title, message, audience, type_tag, publish_date, expiry_date,
            status, delivery_status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Academy Director');
        `, [
          ann.title, ann.message, ann.audience, ann.type_tag,
          ann.publish_date, ann.expiry_date, ann.status, ann.delivery_status
        ]);
      }
      console.log('Seeded announcements successfully.');
    }
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedData();
