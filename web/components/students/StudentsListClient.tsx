'use client';

import React, { useState, useMemo } from 'react';
import { Student, Batch, Course, StudentEnrolledBatch } from '@/lib/academy';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  X,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Edit3,
  Eye,
  Trash2,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  User,
  ShieldCheck,
  Check,
  AlertCircle,
  IndianRupee,
  AlertTriangle
} from 'lucide-react';

interface Props {
  initialStudents: Student[];
  batches: Batch[];
  courses: Course[];
}

export default function StudentsListClient({ initialStudents, batches, courses }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Status Filter: 'active' by default as required
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  // View mode: 'grid' as first preference
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

  // Modals state
  // 1. Details Modal
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // 2. Edit Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentRelation, setEditParentRelation] = useState('Mother');
  const [editParentContact, setEditParentContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editJoiningDate, setEditJoiningDate] = useState('');
  const [editAdvancePaid, setEditAdvancePaid] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [editSelectedCourseIds, setEditSelectedCourseIds] = useState<string[]>([]);
  const [editSelectedBatchIds, setEditSelectedBatchIds] = useState<string[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // 3. Register New Student Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState('Mother');
  const [parentContact, setParentContact] = useState('');
  const [address, setAddress] = useState('');
  const [joiningDate, setJoiningDate] = useState('2026-09-30');
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [savingNew, setSavingNew] = useState(false);

  // 4. Delete Confirmation Modal
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to calculate next sequential Student ID
  const getNextStudentId = (studentsList: Student[]) => {
    let maxId = 0;
    for (const s of studentsList) {
      const m = (s.roll_number || '').match(/^LCA-(\d+)$/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxId) maxId = n;
      }
    }
    return `LCA-${maxId + 1}`;
  };

  const nextAutoId = useMemo(() => getNextStudentId(students), [students]);

  // Current month due date formatted as "dd and month name" (e.g. "30 Sep", "30 aug")
  const currentMonthDueDate = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const day = lastDay.getDate();
    const month = lastDay.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`; // e.g. "30 Sep"
  }, []);

  // Format any raw date into "dd and month name" (e.g. "30 Sep" or "30 Sep 2026")
  const formatDdMonthName = (dateStr?: string | null, includeYear = true) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      return includeYear ? `${day} ${month} ${d.getFullYear()}` : `${day} ${month}`;
    } catch {
      return dateStr;
    }
  };

  const formatDueDateDisplay = (rawDueDate?: string | null) => {
    if (!rawDueDate) return currentMonthDueDate;
    const trimmed = rawDueDate.trim();
    if (/^\d{1,2}\s+[a-zA-Z]+$/i.test(trimmed)) {
      return trimmed;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      try {
        const d = new Date(trimmed);
        const day = d.getDate();
        const month = d.toLocaleString('en-US', { month: 'short' });
        return `${day} ${month}`;
      } catch {
        return trimmed;
      }
    }
    return currentMonthDueDate;
  };

  // Filter students based on status and search query
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Status Filter
      if (statusFilter === 'active' && s.status !== 'active') return false;
      if (statusFilter === 'inactive' && s.status !== 'inactive' && s.status !== 'suspended') return false;

      // 2. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.full_name.toLowerCase().includes(q);
        const matchesRoll = s.roll_number.toLowerCase().includes(q);
        const matchesPhone = (s.phone || '').includes(q);
        const matchesParent = (s.parent_name || '').toLowerCase().includes(q);
        const matchesCourse = (s.enrolled_batches || []).some(b => b.course_title.toLowerCase().includes(q));
        if (!matchesName && !matchesRoll && !matchesPhone && !matchesParent && !matchesCourse) {
          return false;
        }
      }

      return true;
    });
  }, [students, statusFilter, searchQuery]);

  // Counts for tabs
  const activeCount = useMemo(() => students.filter(s => s.status === 'active').length, [students]);
  const inactiveCount = useMemo(() => students.filter(s => s.status === 'inactive' || s.status === 'suspended').length, [students]);

  // Open Edit Modal with pre-filled details
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setEditFullName(s.full_name);
    setEditEmail(s.email);
    setEditPhone(s.phone);
    setEditParentName(s.parent_name || '');
    setEditParentRelation(s.parent_relation || 'Mother');
    setEditParentContact(s.parent_contact || s.phone);
    setEditAddress(s.address || '');
    setEditJoiningDate(s.enrollment_date ? s.enrollment_date.substring(0, 10) : '2026-09-30');
    setEditAdvancePaid(Number(s.advance_paid || 0));
    setEditStatus(s.status || 'active');

    // Pre-fill courses and batches
    const enrolledCourseIds = Array.from(new Set((s.enrolled_batches || []).map(b => b.course_id)));
    const enrolledBatchIds = (s.enrolled_batches || []).map(b => b.batch_id);
    setEditSelectedCourseIds(enrolledCourseIds);
    setEditSelectedBatchIds(enrolledBatchIds);
  };

  // Open Register Modal
  const handleOpenRegister = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setParentName('');
    setParentRelation('Mother');
    setParentContact('');
    setAddress('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setAdvancePaid(0);
    setSelectedCourseIds(courses.slice(0, 1).map(c => c.id));
    setSelectedBatchIds([]);
    setIsAddOpen(true);
  };

  // Course selection toggles in Register
  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const exists = prev.includes(courseId);
      const updated = exists ? prev.filter(id => id !== courseId) : [...prev, courseId];
      const validBatches = batches.filter(b => updated.includes(b.course_id)).map(b => b.id);
      setSelectedBatchIds(bPrev => bPrev.filter(bId => validBatches.includes(bId)));
      return updated;
    });
  };

  const handleToggleBatch = (batchId: string) => {
    setSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // Course selection toggles in Edit
  const handleEditToggleCourse = (courseId: string) => {
    setEditSelectedCourseIds(prev => {
      const exists = prev.includes(courseId);
      const updated = exists ? prev.filter(id => id !== courseId) : [...prev, courseId];
      const validBatches = batches.filter(b => updated.includes(b.course_id)).map(b => b.id);
      setEditSelectedBatchIds(bPrev => bPrev.filter(bId => validBatches.includes(bId)));
      return updated;
    });
  };

  const handleEditToggleBatch = (batchId: string) => {
    setEditSelectedBatchIds(prev =>
      prev.includes(batchId) ? prev.filter(id => id !== batchId) : [...prev, batchId]
    );
  };

  // Register New Student
  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNew(true);

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          parent_name: parentName.trim(),
          parent_relation: parentRelation,
          parent_contact: parentContact || phone.trim(),
          address: address.trim(),
          joining_date: joiningDate,
          advance_paid: Number(advancePaid || 0),
          batch_ids: selectedBatchIds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register student');
      }

      const created = await res.json();

      // Build enrolled_batches objects
      const enrolledBatchObjects: StudentEnrolledBatch[] = selectedBatchIds.map(bId => {
        const b = batches.find(x => x.id === bId);
        return {
          batch_id: bId,
          batch_name: b?.name || 'Class Batch',
          course_id: b?.course_id || '',
          course_title: b?.course_title || 'Course',
          course_category: b?.course_category || 'Academy Arts',
          monthly_fee: Number(b?.course_title ? (courses.find(c => c.id === b.course_id)?.monthly_fee || 2000) : 2000),
          trainer_id: b?.trainer_id || '',
          trainer_name: b?.trainer_name || 'Academy Guru',
          days_of_week: b?.days_of_week || [],
          start_time: b?.start_time || '09:00:00',
          end_time: b?.end_time || '10:30:00',
          room_or_hall: b?.room_or_hall || 'Hall',
          enrollment_status: 'active'
        };
      });

      const totalMonthly = enrolledBatchObjects.reduce((acc, b) => acc + (b.monthly_fee || 0), 0);
      const adv = Number(advancePaid || 0);
      // Formula: total monthly fee to be paid (for current month) - advance that paid
      const due = totalMonthly - adv;

      const fullStudent: Student = {
        ...created,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        parent_name: parentName.trim(),
        parent_relation: parentRelation,
        parent_contact: parentContact || phone.trim(),
        address: address.trim(),
        status: 'active',
        enrollment_date: joiningDate,
        advance_paid: adv,
        total_monthly_fee: totalMonthly,
        due_amount: due,
        due_date: currentMonthDueDate,
        due_status: due <= 0 ? 'green' : due > totalMonthly ? 'red' : 'yellow',
        enrolled_batches_count: selectedBatchIds.length,
        attendance_rate: 100,
        enrolled_batches: enrolledBatchObjects
      };

      setStudents(prev => [fullStudent, ...prev]);
      showToast(`Student ${fullName} (${fullStudent.roll_number}) registered successfully!`);
      setIsAddOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNew(false);
    }
  };

  // Save Edit Details
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setSavingEdit(true);

    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStudent.id,
          full_name: editFullName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          parent_name: editParentName.trim(),
          parent_relation: editParentRelation,
          parent_contact: editParentContact.trim() || editPhone.trim(),
          address: editAddress.trim(),
          joining_date: editJoiningDate,
          advance_paid: Number(editAdvancePaid || 0),
          status: editStatus,
          batch_ids: editSelectedBatchIds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update student');
      }

      // Reconstruct updated enrolled batches
      const updatedBatchObjects: StudentEnrolledBatch[] = editSelectedBatchIds.map(bId => {
        const b = batches.find(x => x.id === bId);
        return {
          batch_id: bId,
          batch_name: b?.name || 'Class Batch',
          course_id: b?.course_id || '',
          course_title: b?.course_title || 'Course',
          course_category: b?.course_category || 'Academy Arts',
          monthly_fee: Number(courses.find(c => c.id === b?.course_id)?.monthly_fee || 2000),
          trainer_id: b?.trainer_id || '',
          trainer_name: b?.trainer_name || 'Academy Guru',
          days_of_week: b?.days_of_week || [],
          start_time: b?.start_time || '09:00:00',
          end_time: b?.end_time || '10:30:00',
          room_or_hall: b?.room_or_hall || 'Hall',
          enrollment_status: 'active'
        };
      });

      const totalMonthly = updatedBatchObjects.reduce((acc, b) => acc + (b.monthly_fee || 0), 0);
      const adv = Number(editAdvancePaid || 0);
      // Formula: total monthly fee to be paid (for current month) - advance that paid
      const due = totalMonthly - adv;

      setStudents(prev =>
        prev.map(s =>
          s.id === editingStudent.id
            ? {
                ...s,
                full_name: editFullName.trim(),
                email: editEmail.trim(),
                phone: editPhone.trim(),
                parent_name: editParentName.trim(),
                parent_relation: editParentRelation,
                parent_contact: editParentContact.trim() || editPhone.trim(),
                address: editAddress.trim(),
                enrollment_date: editJoiningDate,
                advance_paid: adv,
                status: editStatus,
                total_monthly_fee: totalMonthly,
                due_amount: due,
                due_status: due <= 0 ? 'green' : due > totalMonthly ? 'red' : 'yellow',
                enrolled_batches_count: editSelectedBatchIds.length,
                enrolled_batches: updatedBatchObjects
              }
            : s
        )
      );

      // If details modal was open, sync it
      if (detailStudent && detailStudent.id === editingStudent.id) {
        setDetailStudent({
          ...detailStudent,
          full_name: editFullName.trim(),
          email: editEmail.trim(),
          phone: editPhone.trim(),
          parent_name: editParentName.trim(),
          parent_relation: editParentRelation,
          parent_contact: editParentContact.trim() || editPhone.trim(),
          address: editAddress.trim(),
          enrollment_date: editJoiningDate,
          advance_paid: adv,
          status: editStatus,
          total_monthly_fee: totalMonthly,
          due_amount: due,
          due_status: due <= 0 ? 'green' : due > totalMonthly ? 'red' : 'yellow',
          enrolled_batches_count: editSelectedBatchIds.length,
          enrolled_batches: updatedBatchObjects
        });
      }

      showToast(`Student ${editFullName} updated successfully!`);
      setEditingStudent(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete Student
  const handleDeleteStudent = async () => {
    if (!deletingStudent) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/students?id=${deletingStudent.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete student');
      }

      // If status was marked inactive to preserve history, or deleted
      setStudents(prev => prev.filter(s => s.id !== deletingStudent.id));
      if (detailStudent && detailStudent.id === deletingStudent.id) {
        setDetailStudent(null);
      }
      showToast(`Student ${deletingStudent.full_name} (${deletingStudent.roll_number}) deleted.`);
      setDeletingStudent(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Helper for due amount color styling and formatted values
  const getDueAmountDisplay = (s: Student) => {
    const monthly = Number(s.total_monthly_fee || 0);
    const adv = Number(s.advance_paid || 0);
    // Formula: total monthly amount to be paid (for current month) - advance that paid
    const due = s.due_amount !== undefined ? Number(s.due_amount) : (monthly - adv);

    // Green: Zero or negative due amount (fully paid or advance payment)
    if (due <= 0) {
      const text = due < 0 
        ? `-₹${Math.abs(due).toLocaleString('en-IN')}` 
        : '₹0';
      return {
        due,
        text,
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-extrabold shadow-2xs',
        dotClass: 'bg-emerald-600'
      };
    } 
    // Red: Fee remains unpaid for more than one month (more than current month amount)
    else if (due > monthly) {
      return {
        due,
        text: `₹${due.toLocaleString('en-IN')}`,
        badgeClass: 'bg-rose-50 text-rose-800 border border-rose-300 font-extrabold shadow-2xs',
        dotClass: 'bg-rose-600'
      };
    } 
    // Yellow: Current month's fee is pending (and <= current monthly amount)
    else {
      return {
        due,
        text: `₹${due.toLocaleString('en-IN')}`,
        badgeClass: 'bg-amber-50 text-amber-900 border border-amber-300 font-extrabold shadow-2xs',
        dotClass: 'bg-amber-600'
      };
    }
  };

  // Batches available for register modal courses
  const registerAvailableBatches = batches.filter(b => selectedCourseIds.includes(b.course_id));
  const editAvailableBatches = batches.filter(b => editSelectedCourseIds.includes(b.course_id));

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HEADER & TOP CONTROLS */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Student Directory
            </span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
              {students.length} Total Learners
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#8A064D]" />
            Student Management
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Track student admissions, status, course fees, due amounts, and parent details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
            />
          </div>

          {/* View Mode Toggle: Grid vs Row */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Grid View (Default)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('row')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'row'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Row / Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span>Row</span>
            </button>
          </div>

          {/* Register New Student Button */}
          <button
            onClick={handleOpenRegister}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Register Student</span>
          </button>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. ACTIVE / INACTIVE FILTERS (Active by default) */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-gray-700 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active Students</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-gray-700 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Inactive Students</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {inactiveCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#8A064D] text-white shadow-sm ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-gray-700 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          <span>All Students</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {students.length}
          </span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* 3. MAIN STUDENTS GRID (DISPLAY ONLY REQUIRED FIELDS) */}
      {/* ===================================================================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-[#F0D5E4]">
              <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-bold text-gray-600">No {statusFilter !== 'all' ? statusFilter : ''} students found.</p>
              <p className="text-xs text-gray-400 mt-1">Try switching filters or clearing your search.</p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const dueInfo = getDueAmountDisplay(s);
              const monthlyFee = s.total_monthly_fee || 0;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-[#F0D5E4] p-5 shadow-xs hover:shadow-md hover:border-[#8A064D]/50 transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar: Status Badge & Student ID */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-xl">
                        {s.roll_number}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        s.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                        <span className="capitalize">{s.status || 'Active'}</span>
                      </span>
                    </div>

                    {/* Student Name as Primary Heading */}
                    <h3 className="font-bold text-base text-[#2D041A] tracking-tight group-hover:text-[#8A064D] transition">
                      {s.full_name}
                    </h3>

                    {/* Contact Number below Name (Email removed from main grid!) */}
                    <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-medium text-gray-700">{s.phone}</span>
                    </div>

                    {/* Fee Details Box: Total Monthly Fee, Due Amount with Color, Due Date */}
                    <div className="mt-4 p-3.5 bg-gray-50/90 rounded-2xl border border-gray-100 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Total Monthly Fee:</span>
                        <span className="font-extrabold text-[#2D041A] text-sm">
                          ₹{monthlyFee.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Due Amount:</span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1.5 ${dueInfo.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${dueInfo.dotClass}`} />
                          <span>{dueInfo.text}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500 font-semibold">Due Date:</span>
                        <span className="font-mono font-bold text-gray-800 bg-white px-2 py-0.5 rounded-lg border border-gray-200 text-xs shadow-2xs">
                          {formatDueDateDisplay(s.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Below: Details, Edit, Delete with dark, high-contrast, premium colors */}
                  <div className="mt-5 pt-3.5 border-t border-gray-100 flex items-center gap-2">
                    <button
                      onClick={() => setDetailStudent(s)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-[#48082B] cursor-pointer"
                      title="View Complete Student Details"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs border border-[#1E3A8A] cursor-pointer"
                      title="Edit Student Information"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-sky-200" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingStudent(s)}
                      className="py-2 px-3 rounded-xl bg-[#881337] hover:bg-[#9F1239] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-xs border border-[#881337] cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. ROW-WISE (TABLE) VIEW */}
      {/* ===================================================================== */}
      {viewMode === 'row' && (
        <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                  <th className="py-3.5 px-4">Student ID & Status</th>
                  <th className="py-3.5 px-4">Student Name & Contact</th>
                  <th className="py-3.5 px-4 text-right">Total Monthly Fee</th>
                  <th className="py-3.5 px-4 text-center">Due Amount</th>
                  <th className="py-3.5 px-4 text-center">Due Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const dueInfo = getDueAmountDisplay(s);
                    const monthlyFee = s.total_monthly_fee || 0;

                    return (
                      <tr key={s.id} className="hover:bg-[#FFFDFC] transition">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-lg">
                              {s.roll_number}
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === 'active' 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              <span className="capitalize">{s.status || 'Active'}</span>
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-gray-900 text-xs">{s.full_name}</div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{s.phone}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                          ₹{monthlyFee.toLocaleString('en-IN')}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${dueInfo.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${dueInfo.dotClass}`} />
                            <span>{dueInfo.text}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-gray-800">
                          {formatDueDateDisplay(s.due_date)}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setDetailStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-[#48082B] cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                              <span>Details</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-3 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1D4ED8] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs border border-[#1E3A8A] cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-sky-200" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#881337] hover:bg-[#9F1239] active:scale-95 text-white transition flex items-center gap-1 shadow-xs border border-[#881337] cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. DETAILS MODAL (ALL STUDENT DETAILS IN ONE PLACE) */}
      {/* ===================================================================== */}
      {detailStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-3 py-1 rounded-xl">
                  {detailStudent.roll_number}
                </span>
                <div>
                  <h3 className="font-black text-lg text-[#2D041A] leading-tight">
                    {detailStudent.full_name}
                  </h3>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                    detailStudent.status === 'active' ? 'text-emerald-700' : 'text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${detailStudent.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                    <span className="capitalize">{detailStudent.status || 'Active'}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setDetailStudent(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              
              {/* Section 1: Financial & Fee Summary */}
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100">
                <h4 className="text-xs font-bold text-[#8A064D] uppercase tracking-wider mb-2.5">
                  Fee & Due Overview
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Total Monthly Fee</span>
                    <span className="text-base font-bold text-gray-900 mt-0.5 block">
                      ₹{(detailStudent.total_monthly_fee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Advance Paid</span>
                    <span className="text-base font-bold text-emerald-700 mt-0.5 block">
                      ₹{Number(detailStudent.advance_paid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Due Amount</span>
                    <span className={`text-base font-extrabold mt-0.5 block ${
                      (detailStudent.due_amount ?? 0) <= 0 
                        ? 'text-emerald-700' 
                        : (detailStudent.due_amount ?? 0) > (detailStudent.total_monthly_fee || 0) 
                        ? 'text-rose-700' 
                        : 'text-amber-700'
                    }`}>
                      {(detailStudent.due_amount ?? 0) < 0 
                        ? `-₹${Math.abs(detailStudent.due_amount ?? 0).toLocaleString('en-IN')}` 
                        : `₹${(detailStudent.due_amount ?? 0).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">Due Date</span>
                    <span className="text-base font-mono font-bold text-gray-800 mt-0.5 block">
                      {formatDueDateDisplay(detailStudent.due_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Personal Details */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Student Contact & Registration Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Contact Phone:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{detailStudent.phone}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Email Address:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{detailStudent.email}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Joining Date:</span>
                    <span className="font-semibold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-[#8A064D]" />
                      <span>{formatDdMonthName(detailStudent.enrollment_date)}</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Residential Address:</span>
                    <span className="font-medium text-gray-700 flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#8A064D] shrink-0 mt-0.5" />
                      <span>{detailStudent.address || 'Kannamangala, Bangalore'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Parent / Guardian Info */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2.5">
                  Parent / Guardian Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Guardian Name:</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{detailStudent.parent_name || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Relation:</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{detailStudent.parent_relation || 'Parent'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase font-semibold">Guardian Contact:</span>
                    <span className="font-semibold text-gray-900 mt-0.5 block">{detailStudent.parent_contact || detailStudent.phone}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Enrolled Courses & Batches */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Enrolled Courses & Batches ({detailStudent.enrolled_batches?.length || 0})
                  </h4>
                </div>

                <div className="space-y-2">
                  {(detailStudent.enrolled_batches && detailStudent.enrolled_batches.length > 0) ? (
                    detailStudent.enrolled_batches.map((eb, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-gray-900">{eb.course_title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Batch: <strong className="text-gray-800">{eb.batch_name}</strong> • Guru: {eb.trainer_name}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Timings: {eb.start_time?.substring(0, 5)} - {eb.end_time?.substring(0, 5)} ({eb.days_of_week?.join(', ')})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-bold text-[#8A064D]">₹{eb.monthly_fee}</span>
                          <span className="text-[10px] text-gray-400 block">/ month</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-400 italic py-2">
                      No active batch enrollments assigned.
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const s = detailStudent;
                    setDetailStudent(null);
                    setDeletingStudent(s);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[#881337] hover:bg-[#9F1239] active:scale-95 text-white shadow-xs border border-[#881337] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-200" />
                  <span>Delete Student</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailStudent(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const s = detailStudent;
                      setDetailStudent(null);
                      handleOpenEdit(s);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-[#1D4ED8] active:scale-95 text-white shadow-md border border-[#1E3A8A] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-sky-200" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. EDIT STUDENT MODAL (PRE-FILLED REGISTRATION FORM) */}
      {/* ===================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-lg border border-rose-100">
                  {editingStudent.roll_number}
                </span>
                <h3 className="font-black text-lg text-[#2D041A] mt-1">Edit Student Details</h3>
                <p className="text-xs text-gray-500">Update personal info, status, joining date, advance paid, and courses.</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Row 1: Student ID (read-only) & Status (Active / Inactive toggle) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student ID <span className="text-[10px] text-gray-400 font-normal">(System Generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={editingStudent.roll_number}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-[#8A064D] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Student Status <span className="text-[10px] text-[#8A064D] font-normal">(Active / Inactive)</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#8A064D]"
                  >
                    <option value="active">Active (Currently Enrolled)</option>
                    <option value="inactive">Inactive (Paused / Left)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Row 3: Phone & Joining Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Row 4: Advance Paid */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Advance Paid (INR ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editAdvancePaid}
                  onChange={(e) => setEditAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Row 5: Parent / Guardian Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Relation</label>
                  <select
                    value={editParentRelation}
                    onChange={(e) => setEditParentRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Parent Contact</label>
                  <input
                    type="tel"
                    required
                    value={editParentContact}
                    onChange={(e) => setEditParentContact(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Address</label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Courses & Batches Selection */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Enrolled Courses (Select multiple to assign batches):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {courses.map(crs => {
                    const isSelected = editSelectedCourseIds.includes(crs.id);
                    return (
                      <button
                        type="button"
                        key={crs.id}
                        onClick={() => handleEditToggleCourse(crs.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A064D] text-white shadow-2xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {crs.title}
                      </button>
                    );
                  })}
                </div>

                {editAvailableBatches.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Select Available Batches:
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {editAvailableBatches.map(b => {
                        const isBatchSelected = editSelectedBatchIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleEditToggleBatch(b.id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                              isBatchSelected
                                ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] font-bold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <span>{b.course_title} — {b.name}</span>
                              <span className="text-[10px] text-gray-400 block font-normal">
                                Guru: {b.trainer_name} ({b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)})
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isBatchSelected}
                              readOnly
                              className="accent-[#8A064D]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. REGISTER NEW STUDENT MODAL */}
      {/* ===================================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                  New ID: {nextAutoId}
                </span>
                <h3 className="font-black text-lg text-[#2D041A] mt-1">Register New Student</h3>
                <p className="text-xs text-gray-500">Student ID is generated in sequence automatically.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              
              {/* Row 1: Student ID (read-only, not manually editable) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Student ID <span className="text-[10px] text-emerald-600 font-normal">(Auto-generated in sequence, not editable)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={nextAutoId}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-bold text-[#8A064D] cursor-not-allowed"
                />
              </div>

              {/* Row 2: Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Student / Parent Email</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Row 3: Contact Number & Joining Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Contact Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Row 4: Advance Paid */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Advance Paid (INR ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Row 5: Parent / Guardian Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Relation</label>
                  <select
                    value={parentRelation}
                    onChange={(e) => setParentRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Parent Contact</label>
                  <input
                    type="tel"
                    placeholder="+91 98450 12345"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, apartment, locality, Bangalore..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Select Courses & Batches */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-bold text-gray-800">
                  Select Course(s) (Select multiple to display available batches):
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                  {courses.map(crs => {
                    const isSelected = selectedCourseIds.includes(crs.id);
                    return (
                      <button
                        type="button"
                        key={crs.id}
                        onClick={() => handleToggleCourse(crs.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A064D] text-white shadow-2xs'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {crs.title}
                      </button>
                    );
                  })}
                </div>

                {registerAvailableBatches.length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <label className="block text-xs font-bold text-gray-800 mb-1.5">
                      Available Batches for Selected Courses:
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {registerAvailableBatches.map(b => {
                        const isBatchSelected = selectedBatchIds.includes(b.id);
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleToggleBatch(b.id)}
                            className={`p-2 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                              isBatchSelected
                                ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] font-bold'
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div>
                              <span>{b.course_title} — {b.name}</span>
                              <span className="text-[10px] text-gray-400 block font-normal">
                                Guru: {b.trainer_name} ({b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)})
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isBatchSelected}
                              readOnly
                              className="accent-[#8A064D]"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {savingNew ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. DELETE CONFIRMATION MODAL */}
      {/* ===================================================================== */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-black text-base text-[#2D041A]">Confirm Student Deletion</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{deletingStudent.full_name}</strong> ({deletingStudent.roll_number})? 
              This will remove active batch enrollments. Historical attendance and payment records will be preserved safely.
            </p>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteStudent}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#881337] hover:bg-[#9F1239] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
