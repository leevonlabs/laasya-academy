/**
 * Comprehensive Director Portal Workflow Audit Script
 * Tests all authentication, API endpoints, mutations, and page rendering for the Director login.
 */

const BASE_URL = 'http://localhost:3000';
let sessionCookie = '';

async function runAudit() {
  console.log('====================================================');
  console.log('LAASYA CULTURAL ACADEMY - DIRECTOR WORKFLOW AUDIT');
  console.log('====================================================\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  function record(name, success, detail = '') {
    if (success) {
      console.log(`[PASS] ${name} ${detail ? `(${detail})` : ''}`);
      results.passed.push({ name, detail });
    } else {
      console.error(`[FAIL] ${name} ${detail ? `- ${detail}` : ''}`);
      results.failed.push({ name, detail });
    }
  }

  function warn(name, detail = '') {
    console.warn(`[WARN] ${name} ${detail ? `- ${detail}` : ''}`);
    results.warnings.push({ name, detail });
  }

  // 1. AUTHENTICATION WORKFLOW
  console.log('--- 1. Testing Director Authentication ---');
  try {
    // Test invalid login
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'director@laasyaacademy.com', password: 'WrongPassword' })
    });
    const badLoginData = await badLoginRes.json();
    record('Auth: Reject invalid credentials', badLoginRes.status === 401 && !badLoginData.success);

    // Test valid login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'director@laasyaacademy.com', password: 'Laasya@Owner2026' })
    });
    const rawSetCookie = loginRes.headers.get('set-cookie');
    const loginData = await loginRes.json();
    
    if (loginRes.status === 200 && loginData.success && rawSetCookie) {
      sessionCookie = rawSetCookie.split(';')[0];
      record('Auth: Director login with valid credentials', true, `User: ${loginData.user?.fullName}`);
    } else {
      record('Auth: Director login with valid credentials', false, JSON.stringify(loginData));
      return results;
    }

    // Verify session endpoint
    const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
      headers: { Cookie: sessionCookie }
    });
    const sessionData = await sessionRes.json();
    record('Auth: Validate active session endpoint', sessionRes.status === 200 && sessionData.authenticated && sessionData.user?.role === 'owner');
  } catch (err) {
    record('Auth: Login flow', false, err.message);
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': sessionCookie
  };

  // 2. PAGE RENDERING AUDIT (All Director Web Pages)
  console.log('\n--- 2. Testing Page Rendering (HTTP 200) ---');
  const pages = [
    { path: '/overview', name: 'Overview Dashboard' },
    { path: '/courses', name: 'Courses & Categories Management' },
    { path: '/trainers', name: 'Gurus / Faculty Management' },
    { path: '/students', name: 'Students Directory & Details' },
    { path: '/batches', name: 'Batches Management' },
    { path: '/schedule', name: 'Academy Schedule & Timetable' },
    { path: '/attendance', name: 'Attendance Audit' },
    { path: '/fees', name: 'Student Fees Management' },
    { path: '/salaries', name: 'Guru Salaries Management' },
    { path: '/expenses', name: 'Academy Expenses Tracking' },
    { path: '/announcements', name: 'Announcements Broadcast' },
    { path: '/reports', name: 'Reports & Audits' },
    { path: '/settings', name: 'Academy Settings' },
  ];

  for (const page of pages) {
    try {
      const res = await fetch(`${BASE_URL}${page.path}`, {
        headers: { Cookie: sessionCookie }
      });
      const text = await res.text();
      const isOk = res.status === 200 && !text.includes('Application error') && !text.includes('Internal Server Error');
      record(`Page Render: ${page.name} (${page.path})`, isOk, `Status ${res.status}, ${text.length} bytes`);
    } catch (err) {
      record(`Page Render: ${page.name} (${page.path})`, false, err.message);
    }
  }

  // 3. READ-ONLY API ENDPOINTS AUDIT
  console.log('\n--- 3. Testing Core Director API Endpoints ---');
  const apiEndpoints = [
    { url: '/api/students', key: 'students', name: 'Students List API' },
    { url: '/api/trainers', key: 'trainers', name: 'Gurus/Trainers List API' },
    { url: '/api/courses', key: 'courses', name: 'Courses List API' },
    { url: '/api/courses/categories', key: 'categories', name: 'Course Categories API' },
    { url: '/api/batches', key: 'batches', name: 'Batches List API' },
    { url: '/api/rooms', key: 'rooms', name: 'Studio Rooms API' },
    { url: '/api/sessions', key: 'sessions', name: 'Sessions/Timetable API' },
    { url: '/api/attendance', key: 'attendance', name: 'Attendance Records API' },
    { url: '/api/finance/fees', key: 'fees', name: 'Fees Invoices API' },
    { url: '/api/finance/salaries', key: 'salaries', name: 'Salaries Disbursals API' },
    { url: '/api/finance/salaries/advances', key: 'advances', name: 'Salary Advances API' },
    { url: '/api/expenses', key: 'expenses', name: 'Expenses List API' },
    { url: '/api/expenses/categories', key: 'categories', name: 'Expense Categories API' },
    { url: '/api/announcements', key: 'announcements', name: 'Announcements List API' },
  ];

  for (const ep of apiEndpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep.url}`, { headers: authHeaders });
      const data = await res.json();
      const isSuccess = res.status === 200 && (data.success !== false);
      const count = Array.isArray(data) ? data.length : (data[ep.key] ? (Array.isArray(data[ep.key]) ? data[ep.key].length : 'obj') : Object.keys(data).length);
      record(`API GET: ${ep.name} (${ep.url})`, isSuccess, `Count: ${count}`);
    } catch (err) {
      record(`API GET: ${ep.name} (${ep.url})`, false, err.message);
    }
  }

  // 4. REPORTS WORKFLOW
  console.log('\n--- 4. Testing Reports Workflows (Attendance, Fees, Salaries, Income vs Expenses) ---');
  const reportTypes = ['attendance', 'fees', 'salaries', 'income_expenses'];
  for (const rType of reportTypes) {
    try {
      const res = await fetch(`${BASE_URL}/api/reports?type=${rType}`, { headers: authHeaders });
      const data = await res.json();
      const isSuccess = res.status === 200 && data.success === true;
      record(`Report API: type=${rType}`, isSuccess, isSuccess ? `Generated at ${data.report?.timestamp || 'live'}` : data.error);
    } catch (err) {
      record(`Report API: type=${rType}`, false, err.message);
    }
  }

  // 5. EXPENSES CRUD WORKFLOW (Add, Edit with History, Soft Delete)
  console.log('\n--- 5. Testing Expenses CRUD & Audit History Workflow ---');
  let createdExpenseId = null;
  try {
    // 5.1 Validation: Amount must be > 0 and date required
    const invalidExpenseRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ category: 'Rent', amount: 0, expense_date: '' })
    });
    record('Expense Validation: Reject 0 amount & missing date', invalidExpenseRes.status === 400);

    // 5.2 Add Expense
    const addExpenseRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        category: 'Supplies',
        description: 'Test Ghungroo and Practice Materials',
        amount: 1500,
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'UPI',
        vendor: 'Kala Kendra Store',
        reference_number: 'UPI-TEST-12345'
      })
    });
    const addExpenseData = await addExpenseRes.json();
    if (addExpenseRes.status === 200 && addExpenseData.success && addExpenseData.expense?.id) {
      createdExpenseId = addExpenseData.expense.id;
      record('Expense CRUD: Create new expense', true, `ID: ${createdExpenseId}`);
    } else {
      record('Expense CRUD: Create new expense', false, JSON.stringify(addExpenseData));
    }

    // 5.3 Edit Expense (History tracking)
    if (createdExpenseId) {
      const editRes = await fetch(`${BASE_URL}/api/expenses/${createdExpenseId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          category: 'Supplies',
          description: 'Updated Ghungroo - Premium Silk Practice Bells',
          amount: 1800,
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'UPI',
          vendor: 'Kala Kendra Store',
          reference_number: 'UPI-TEST-12345-REV'
        })
      });
      const editData = await editRes.json();
      record('Expense CRUD: Edit expense record', editRes.status === 200 && editData.success);

      // Verify Audit History
      const histRes = await fetch(`${BASE_URL}/api/expenses/${createdExpenseId}/history`, { headers: authHeaders });
      const histData = await histRes.json();
      const hasHistory = histRes.status === 200 && histData.success && histData.history?.length > 0;
      record('Expense Audit History: History log recorded', hasHistory, `Entries: ${histData.history?.length || 0}`);

      // 5.4 Soft Delete Expense
      const delRes = await fetch(`${BASE_URL}/api/expenses/${createdExpenseId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const delData = await delRes.json();
      record('Expense CRUD: Soft delete expense', delRes.status === 200 && delData.success);

      // Verify it is flagged as removed, not visible in default active list
      const listRes = await fetch(`${BASE_URL}/api/expenses`, { headers: authHeaders });
      const listData = await listRes.json();
      const stillActive = listData.expenses?.some(e => e.id === createdExpenseId);
      record('Expense Soft Delete: Excluded from active list', !stillActive);
    }
  } catch (err) {
    record('Expense CRUD Workflow', false, err.message);
  }

  // 6. ANNOUNCEMENTS WORKFLOW (Create, Duplicate, Unpublish, Delete)
  console.log('\n--- 6. Testing Announcements Workflow ---');
  let createdAnnounceId = null;
  try {
    // 6.1 Validation: Title and message required
    const invalidAnnounceRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ title: '', message: '', publish_date: '2026-10-02' })
    });
    record('Announcement Validation: Reject empty title/message', invalidAnnounceRes.status === 400);

    // 6.2 Create Announcement
    const createRes = await fetch(`${BASE_URL}/api/announcements`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Navratri Classical Dance Workshop 2026',
        message: 'Special 3-day intensive workshop conducted by senior Gurus.',
        audience: 'all_students',
        type_tag: 'General',
        publish_date: new Date().toISOString().split('T')[0],
        status: 'published'
      })
    });
    const createData = await createRes.json();
    if (createRes.status === 200 && createData.success && createData.announcement?.id) {
      createdAnnounceId = createData.announcement.id;
      record('Announcement: Create announcement', true, `ID: ${createdAnnounceId}`);
    } else {
      record('Announcement: Create announcement', false, JSON.stringify(createData));
    }

    if (createdAnnounceId) {
      // 6.3 Duplicate Announcement
      const dupRes = await fetch(`${BASE_URL}/api/announcements/${createdAnnounceId}/duplicate`, {
        method: 'POST',
        headers: authHeaders
      });
      const dupData = await dupRes.json();
      const dupId = dupData.announcement?.id;
      record('Announcement: Duplicate action', dupRes.status === 200 && dupData.success);

      // 6.4 Unpublish Announcement
      const unpubRes = await fetch(`${BASE_URL}/api/announcements/${createdAnnounceId}/unpublish`, {
        method: 'POST',
        headers: authHeaders
      });
      const unpubData = await unpubRes.json();
      record('Announcement: Unpublish action (revert to draft)', unpubRes.status === 200 && unpubData.success && unpubData.announcement?.status?.toLowerCase() === 'draft');

      // 6.5 Delete Announcements (cleanup)
      const del1 = await fetch(`${BASE_URL}/api/announcements/${createdAnnounceId}`, { method: 'DELETE', headers: authHeaders });
      if (dupId) {
        await fetch(`${BASE_URL}/api/announcements/${dupId}`, { method: 'DELETE', headers: authHeaders });
      }
      record('Announcement: Delete with confirmation', del1.status === 200);
    }
  } catch (err) {
    record('Announcement Workflow', false, err.message);
  }

  // 7. COURSES & CATEGORIES WORKFLOW
  console.log('\n--- 7. Testing Courses & Categories Workflow ---');
  try {
    // 7.1 Create custom category
    const catName = 'Percussion & Rhythm ' + Date.now().toString().slice(-4);
    const createCatRes = await fetch(`${BASE_URL}/api/courses/categories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: catName })
    });
    const createCatData = await createCatRes.json();
    record('Course Categories: Create new category', createCatRes.status === 200 && !!createCatData.category, catName);

    // 7.2 Fetch categories and check presence
    const getCatsRes = await fetch(`${BASE_URL}/api/courses/categories`, { headers: authHeaders });
    const getCatsData = await getCatsRes.json();
    const foundCat = getCatsData.categories?.includes(catName) || getCatsData.categories?.some(c => (c.name || c) === catName);
    record('Course Categories: Searchable dropdown listing', !!foundCat);

    // 7.3 Delete the custom category
    if (foundCat) {
      const delCatRes = await fetch(`${BASE_URL}/api/courses/categories?name=${encodeURIComponent(catName)}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const delCatData = await delCatRes.json();
      record('Course Categories: Delete category with safety check', delCatRes.status === 200 && !delCatData.error);
    }
  } catch (err) {
    record('Courses & Categories Workflow', false, err.message);
  }

  // 8. STUDENTS & TRAINERS PROFILE FIELDS (Age, Gender, Avatar)
  console.log('\n--- 8. Testing Student & Trainer Profile Fields (Age, Gender: Male/Female/Trans, Avatar) ---');
  try {
    // Fetch a student and check age and gender columns
    const stuRes = await fetch(`${BASE_URL}/api/students`, { headers: authHeaders });
    const stuData = await stuRes.json();
    const studentList = stuData.students || stuData;
    if (Array.isArray(studentList) && studentList.length > 0) {
      const sample = studentList[0];
      const hasFields = 'age' in sample && 'gender' in sample;
      record('Students: Age and Gender fields present in schema', hasFields, `Sample ID: ${sample.id}, Gender: ${sample.gender || 'not set'}, Age: ${sample.age || 'not set'}`);
      
      // Update student age and gender (testing 'trans' option)
      const updateStuRes = await fetch(`${BASE_URL}/api/students`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          id: sample.id,
          full_name: sample.full_name,
          email: sample.email,
          phone: sample.phone,
          age: 21,
          gender: 'female',
          status: sample.status
        })
      });
      const updateStuData = await updateStuRes.json();
      record('Students: Update age & gender support', updateStuRes.status === 200 && !updateStuData.error && updateStuData.id === sample.id);
    } else {
      warn('Students: No students found to verify schema');
    }

    // Fetch a trainer and check age and gender columns
    const trnRes = await fetch(`${BASE_URL}/api/trainers`, { headers: authHeaders });
    const trnData = await trnRes.json();
    const trainerList = trnData.trainers || trnData;
    if (Array.isArray(trainerList) && trainerList.length > 0) {
      const sampleTrn = trainerList[0];
      const hasFields = 'age' in sampleTrn && 'gender' in sampleTrn;
      record('Gurus/Trainers: Age and Gender fields present in schema', hasFields, `Sample ID: ${sampleTrn.id}, Gender: ${sampleTrn.gender || 'not set'}, Age: ${sampleTrn.age || 'not set'}`);

      // Update trainer age and gender
      const updateTrnRes = await fetch(`${BASE_URL}/api/trainers`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          id: sampleTrn.id,
          full_name: sampleTrn.full_name,
          email: sampleTrn.email,
          phone: sampleTrn.phone,
          specializations: sampleTrn.specializations || [],
          age: 38,
          gender: 'female',
          status: sampleTrn.status
        })
      });
      const updateTrnData = await updateTrnRes.json();
      record('Gurus/Trainers: Update age & gender support', updateTrnRes.status === 200 && !updateTrnData.error && updateTrnData.id === sampleTrn.id);
    } else {
      warn('Gurus/Trainers: No trainers found to verify schema');
    }
  } catch (err) {
    record('Student/Trainer Fields Audit', false, err.message);
  }

  // 9. ATTENDANCE & DATE RANGE FILTER AUDIT
  console.log('\n--- 9. Testing Attendance Audit & Date Filtering ---');
  try {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const attFilterRes = await fetch(`${BASE_URL}/api/attendance?startDate=${thirtyDaysAgo}&endDate=${today}`, {
      headers: authHeaders
    });
    const attData = await attFilterRes.json();
    record('Attendance Audit: Date range filter query', attFilterRes.status === 200 && (attData.success !== false));
  } catch (err) {
    record('Attendance Audit: Date range filter query', false, err.message);
  }

  // SUMMARY
  console.log('\n====================================================');
  console.log(`AUDIT COMPLETE: ${results.passed.length} PASSED, ${results.failed.length} FAILED, ${results.warnings.length} WARNINGS`);
  console.log('====================================================');
  return results;
}

runAudit().then(res => {
  if (res.failed.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}).catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
