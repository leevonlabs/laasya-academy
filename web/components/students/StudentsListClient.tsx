'use client';

import React, { useState, useMemo } from 'react';
import { Student, Batch, Course, StudentEnrolledBatch } from '@/lib/academy';
import PhotoUploadInput from '@/components/common/PhotoUploadInput';
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
  AlertTriangle,
  ZoomIn,
  Maximize2,
  ArrowLeft
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

  // Dedicated Full Page View Mode ('list' | 'register' | 'edit')
  const [pageMode, setPageMode] = useState<'list' | 'register' | 'edit'>('list');

  // Helper for batch timing minutes calculation
  const parseTimeToMinutes = (tStr?: string): number => {
    if (!tStr) return 0;
    const clean = tStr.trim().toLowerCase();
    const isPM = clean.includes('pm');
    const isAM = clean.includes('am');
    const timeOnly = clean.replace(/[ap]m/, '').trim();
    const parts = timeOnly.split(':').map(Number);
    let hours = parts[0] || 0;
    const mins = parts[1] || 0;
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  // Helper to detect timing clash between two batches
  const checkBatchClash = (batchA: Batch, batchB: Batch): { hasClash: boolean; reason: string } => {
    if (batchA.id === batchB.id) return { hasClash: false, reason: '' };

    const daysA = (batchA.days_of_week || []).map(d => d.toLowerCase().slice(0, 3));
    const daysB = (batchB.days_of_week || []).map(d => d.toLowerCase().slice(0, 3));
    const commonDays = daysA.filter(d => daysB.includes(d));
    if (commonDays.length === 0) return { hasClash: false, reason: '' };

    const startA = parseTimeToMinutes(batchA.start_time);
    const endA = parseTimeToMinutes(batchA.end_time) || (startA + 60);
    const startB = parseTimeToMinutes(batchB.start_time);
    const endB = parseTimeToMinutes(batchB.end_time) || (startB + 60);

    if (startA < endB && startB < endA) {
      const dayNames = (batchA.days_of_week || []).filter(d =>
        (batchB.days_of_week || []).some(bDay => bDay.toLowerCase().slice(0, 3) === d.toLowerCase().slice(0, 3))
      ).join(', ');
      return {
        hasClash: true,
        reason: `Schedule clash with "${batchB.name}" on ${dayNames} (${batchA.start_time?.slice(0, 5)} - ${batchA.end_time?.slice(0, 5)})`
      };
    }

    return { hasClash: false, reason: '' };
  };

  // Modals state
  // 1. Details Modal
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ src: string; title: string } | null>(null);

  // 2. Edit Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editDateOfBirth, setEditDateOfBirth] = useState<string>('');
  const [editAge, setEditAge] = useState<string>('');
  const [editGender, setEditGender] = useState<'male' | 'female' | 'trans'>('female');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
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
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'trans'>('female');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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

  // Toggle Student Status (Active <-> Inactive)
  const handleToggleStudentStatus = async (s: Student) => {
    const newStatus = s.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: s.id,
          status: newStatus
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update student status');
      }
      setStudents(prev => prev.map(item => item.id === s.id ? { ...item, status: newStatus } : item));
      showToast(`Student ${s.full_name} marked as ${newStatus.toUpperCase()}. Enrolled batch seats adjusted.`);
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  // Open Edit Modal / Full Page with pre-filled details
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setEditFullName(s.full_name);
    setEditDateOfBirth(s.date_of_birth ? s.date_of_birth.substring(0, 10) : '');
    setEditAge(s.age ? String(s.age) : '');
    setEditGender((s.gender as any) || 'female');
    setEditEmail(s.email);
    setEditPhone(s.phone);
    setEditAvatarUrl(s.avatar_url || null);
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
    setPageMode('edit');
  };

  // Open Register Full Page
  const handleOpenRegister = () => {
    setFullName('');
    setDateOfBirth('');
    setAge('');
    setGender('female');
    setEmail('');
    setPhone('');
    setAvatarUrl(null);
    setParentName('');
    setParentRelation('Mother');
    setParentContact('');
    setAddress('');
    setJoiningDate(new Date().toISOString().split('T')[0]);
    setAdvancePaid(0);
    setSelectedCourseIds(courses.slice(0, 1).map(c => c.id));
    setSelectedBatchIds([]);
    setIsAddOpen(false);
    setPageMode('register');
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
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    if (selectedBatchIds.includes(batchId)) {
      setSelectedBatchIds(prev => prev.filter(id => id !== batchId));
      return;
    }

    // Check scheduling clash against already selected batches
    const clashingBatch = batches
      .filter(b => selectedBatchIds.includes(b.id))
      .find(selectedB => checkBatchClash(targetBatch, selectedB).hasClash);

    if (clashingBatch) {
      const clashInfo = checkBatchClash(targetBatch, clashingBatch);
      alert(`⚠️ TIMING CLASH DETECTED!\n\n${clashInfo.reason}\n\nA student cannot be enrolled in batches with overlapping days and timings.`);
      return;
    }

    setSelectedBatchIds(prev => [...prev, batchId]);
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
    const targetBatch = batches.find(b => b.id === batchId);
    if (!targetBatch) return;

    if (editSelectedBatchIds.includes(batchId)) {
      setEditSelectedBatchIds(prev => prev.filter(id => id !== batchId));
      return;
    }

    // Check scheduling clash against already selected batches
    const clashingBatch = batches
      .filter(b => editSelectedBatchIds.includes(b.id))
      .find(selectedB => checkBatchClash(targetBatch, selectedB).hasClash);

    if (clashingBatch) {
      const clashInfo = checkBatchClash(targetBatch, clashingBatch);
      alert(`⚠️ TIMING CLASH DETECTED!\n\n${clashInfo.reason}\n\nA student cannot be enrolled in batches with overlapping days and timings.`);
      return;
    }

    setEditSelectedBatchIds(prev => [...prev, batchId]);
  };

  // Helper to auto-calculate chronological age from Date of Birth
  const calculateAge = (dobString: string) => {
    if (!dobString) return '';
    const dob = new Date(dobString);
    if (isNaN(dob.getTime())) return '';
    const today = new Date();
    let calculatedAge = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      calculatedAge--;
    }
    return calculatedAge >= 0 ? String(calculatedAge) : '';
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
          date_of_birth: dateOfBirth || undefined,
          age: age ? Number(age) : undefined,
          gender: gender,
          email: email.trim(),
          phone: phone.trim(),
          avatar_url: avatarUrl || undefined,
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
        date_of_birth: dateOfBirth || undefined,
        age: age ? Number(age) : undefined,
        gender: gender as any,
        email: email.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl || undefined,
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
          date_of_birth: editDateOfBirth || null,
          age: editAge ? Number(editAge) : undefined,
          gender: editGender,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          avatar_url: editAvatarUrl !== undefined ? editAvatarUrl : null,
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
                date_of_birth: editDateOfBirth || undefined,
                age: editAge ? Number(editAge) : undefined,
                gender: editGender as any,
                email: editEmail.trim(),
                phone: editPhone.trim(),
                avatar_url: editAvatarUrl || undefined,
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
          date_of_birth: editDateOfBirth || undefined,
          age: editAge ? Number(editAge) : undefined,
          gender: editGender as any,
          email: editEmail.trim(),
          phone: editPhone.trim(),
          avatar_url: editAvatarUrl || undefined,
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

  // DEDICATED FULL PAGE FOR REGISTERING NEW DISCIPLE
  if (pageMode === 'register') {
    const totalMonthlyCalculated = registerAvailableBatches
      .filter(b => selectedBatchIds.includes(b.id))
      .reduce((acc, b) => acc + (b.monthly_fee || 0), 0);
    const calculatedDue = totalMonthlyCalculated - Number(advancePaid || 0);

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPageMode('list')}
              className="p-2.5 rounded-2xl bg-[#FFF2F8] hover:bg-rose-100 text-[#8A064D] border border-rose-200 transition cursor-pointer"
              title="Back to Students List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-rose-100">
                  {nextAutoId}
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  New Admission
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#2D041A] tracking-tight mt-1">
                Register New Disciple
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Enter complete admission profile, contact information, and assign conflict-free batches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPageMode('list')}
              className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingNew || !fullName.trim()}
              onClick={handleRegisterStudent}
              className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40"
            >
              {savingNew ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#F9E33A]" />
                  <span>Registering Disciple...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 text-[#F9E33A]" />
                  <span>Register Disciple</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Personal & Contact & Guardian Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* Personal Details Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-4 h-4 text-[#8A064D]" />
                <span>Personal Information</span>
              </h2>

              <PhotoUploadInput
                value={avatarUrl}
                onChange={setAvatarUrl}
                label="Student Profile Photo"
                initials={fullName ? fullName.slice(0, 2).toUpperCase() : 'ST'}
                studentName={fullName}
                rollNumber={nextAutoId}
                maxSizeMB={1}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student ID <span className="text-[10px] text-gray-400 font-normal">(System Generated)</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={nextAutoId}
                    className="w-full px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-black text-[#8A064D] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateOfBirth(val);
                      const autoAge = calculateAge(val);
                      if (autoAge) setAge(autoAge);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      placeholder="14"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition cursor-pointer"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="trans">Trans</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Email
                  </label>
                  <input
                    type="email"
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Primary Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit mobile"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Residential Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Complete residential address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Guardian & Admission Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#8A064D]" />
                <span>Parent / Guardian & Admission Details</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Parent / Guardian"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Relation
                  </label>
                  <select
                    value={parentRelation}
                    onChange={(e) => setParentRelation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition cursor-pointer"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Guardian Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="10-digit number"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Course & Batch Allocation with Clash & Capacity Checking */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8A064D]" />
                  <span>Course & Batch Enrollment</span>
                </h2>
                <span className="text-[11px] font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-full border border-rose-100">
                  {selectedBatchIds.length} Batches Selected
                </span>
              </div>

              {/* Course Selection Pills */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                  Select Enrolled Courses:
                </label>
                <div className="flex flex-wrap gap-2">
                  {courses.map(crs => {
                    const isSelected = selectedCourseIds.includes(crs.id);
                    return (
                      <button
                        type="button"
                        key={crs.id}
                        onClick={() => handleToggleCourse(crs.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/60'
                            : 'bg-[#FFF9FB] text-gray-700 border border-[#F0D5E4] hover:bg-[#FFF2F8]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#F9E33A]" />}
                        <span>{crs.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Available Batches for Selected Courses */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                  Available Batches (Timings & Schedule):
                </label>

                {registerAvailableBatches.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500">
                    Please select at least one course above to see available batch schedules.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {registerAvailableBatches.map(b => {
                      const isSelected = selectedBatchIds.includes(b.id);
                      const isFull = (b.enrolled_count || 0) >= (b.max_capacity || 20);
                      
                      // Check clash against already selected batches (excluding this one)
                      const clashingBatch = batches
                        .filter(otherB => selectedBatchIds.includes(otherB.id) && otherB.id !== b.id)
                        .find(otherB => checkBatchClash(b, otherB).hasClash);
                      const clashInfo = clashingBatch ? checkBatchClash(b, clashingBatch) : null;

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBatch(b.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF2F8] border-[#8A064D] shadow-2xs ring-1 ring-[#8A064D]'
                              : clashingBatch
                              ? 'bg-rose-50/50 border-rose-300 opacity-80'
                              : isFull
                              ? 'bg-amber-50/50 border-amber-300'
                              : 'bg-white border-gray-200 hover:border-[#8A064D]/50 hover:bg-[#FFFDFE]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-[#8A064D] focus:ring-[#8A064D]"
                                />
                                <span className="font-black text-xs text-[#2D041A]">
                                  {b.course_title} — {b.name}
                                </span>
                              </div>

                              {/* Days and Timings Row */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#8A064D]" />
                                  <span>{b.days_of_week?.join(', ') || 'Regular'}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#8A064D]" />
                                  <span>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</span>
                                </span>
                              </div>

                              {/* Guru & Room */}
                              <div className="mt-1 text-[11px] text-gray-500 font-medium flex items-center gap-3">
                                <span>Guru: <strong className="text-gray-700">{b.trainer_name || 'Assigned'}</strong></span>
                                <span>Room: <strong className="text-gray-700">{b.room_or_hall || b.room || 'Hall'}</strong></span>
                              </div>
                            </div>

                            {/* Capacity Badge */}
                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isFull 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {b.enrolled_count || 0}/{b.max_capacity || 20} Seats
                              </span>
                            </div>
                          </div>

                          {/* Full Warning Message Banner */}
                          {isFull && !isSelected && (
                            <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>⚠️ Batch has reached maximum capacity ({b.enrolled_count}/{b.max_capacity || 20} seats filled).</span>
                            </div>
                          )}

                          {/* Timing Clash Warning Banner */}
                          {clashInfo && (
                            <div className="mt-2.5 p-2 rounded-xl bg-rose-100 border border-rose-300 text-[11px] font-black text-rose-900 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>⚠️ {clashInfo.reason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Fee Calculation Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-semibold">Total Monthly Tuition:</span>
                  <span className="font-black text-sm text-[#2D041A]">₹{totalMonthlyCalculated.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-semibold">Advance Payment Applied:</span>
                  <span className="font-black text-emerald-700">₹{Number(advancePaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#F0D5E4] flex justify-between items-center">
                  <span className="font-black text-[#590231]">Initial Balance Due:</span>
                  <span className="font-black text-base text-[#8A064D]">₹{Math.max(0, calculatedDue).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DEDICATED FULL PAGE FOR EDITING DISCIPLE
  if (pageMode === 'edit' && editingStudent) {
    const totalMonthlyCalculated = editAvailableBatches
      .filter(b => editSelectedBatchIds.includes(b.id))
      .reduce((acc, b) => acc + (b.monthly_fee || 0), 0);
    const calculatedDue = totalMonthlyCalculated - Number(editAdvancePaid || 0);

    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-200">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setPageMode('list');
                setEditingStudent(null);
              }}
              className="p-2.5 rounded-2xl bg-[#FFF2F8] hover:bg-rose-100 text-[#8A064D] border border-rose-200 transition cursor-pointer"
              title="Back to Students List"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-rose-100">
                  {editingStudent.roll_number}
                </span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                  editStatus === 'active' 
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                    : 'text-gray-700 bg-gray-100 border-gray-200'
                }`}>
                  {editStatus === 'active' ? 'Active Disciple' : 'Inactive'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-[#2D041A] tracking-tight mt-1">
                Edit Disciple: {editFullName}
              </h1>
              <p className="text-xs text-gray-500 font-medium">
                Update disciple admission profile, status, contact details, and assigned conflict-free batches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPageMode('list');
                setEditingStudent(null);
              }}
              className="px-5 py-2.5 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={savingEdit || !editFullName.trim()}
              onClick={handleSaveEdit}
              className="px-6 py-2.5 rounded-2xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-black shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40"
            >
              {savingEdit ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-[#F9E33A]" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-[#F9E33A]" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Form Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Personal & Contact Details */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <User className="w-4 h-4 text-[#8A064D]" />
                <span>Personal & Profile Information</span>
              </h2>

              <PhotoUploadInput
                value={editAvatarUrl}
                onChange={setEditAvatarUrl}
                label="Student Profile Photo"
                initials={editFullName ? editFullName.slice(0, 2).toUpperCase() : 'ST'}
                studentName={editFullName}
                rollNumber={editingStudent.roll_number}
                maxSizeMB={1}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Status <span className="text-[10px] text-[#8A064D] font-normal">(Active / Inactive)</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition cursor-pointer"
                  >
                    <option value="active">Active (Enrolled - Counts in batch capacity)</option>
                    <option value="inactive">Inactive (Paused / Left - Frees up batch seat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDateOfBirth(val);
                      const autoAge = calculateAge(val);
                      if (autoAge) setEditAge(autoAge);
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                      Gender
                    </label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition cursor-pointer"
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="trans">Trans</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Email
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Primary Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Residential Address
                  </label>
                  <textarea
                    rows={2}
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>

            {/* Guardian & Admission Card */}
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                <ShieldCheck className="w-4 h-4 text-[#8A064D]" />
                <span>Parent / Guardian & Admission Info</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Relation
                  </label>
                  <select
                    value={editParentRelation}
                    onChange={(e) => setEditParentRelation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition cursor-pointer"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Guardian Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={editParentContact}
                    onChange={(e) => setEditParentContact(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    required
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Advance Paid (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editAdvancePaid}
                    onChange={(e) => setEditAdvancePaid(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Batch Allocation with Timings, Clash Detection & Full Capacity Warning */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-black text-[#590231] uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#8A064D]" />
                  <span>Enrolled Courses & Batches</span>
                </h2>
                <span className="text-[11px] font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-full border border-rose-100">
                  {editSelectedBatchIds.length} Batches Assigned
                </span>
              </div>

              {/* Course Pills */}
              <div>
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                  Enrolled Disciplines:
                </label>
                <div className="flex flex-wrap gap-2">
                  {courses.map(crs => {
                    const isSelected = editSelectedCourseIds.includes(crs.id);
                    return (
                      <button
                        type="button"
                        key={crs.id}
                        onClick={() => handleEditToggleCourse(crs.id)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/60'
                            : 'bg-[#FFF9FB] text-gray-700 border border-[#F0D5E4] hover:bg-[#FFF2F8]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#F9E33A]" />}
                        <span>{crs.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Batches with Full Details */}
              <div className="pt-3 border-t border-gray-100">
                <label className="block text-xs font-black text-gray-700 uppercase tracking-wide mb-2">
                  Batch Schedule, Timings & Capacity:
                </label>

                {editAvailableBatches.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-gray-50 border border-dashed border-gray-200 text-xs text-gray-500">
                    Select a course above to manage batch allocations.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                    {editAvailableBatches.map(b => {
                      const isSelected = editSelectedBatchIds.includes(b.id);
                      const isFull = (b.enrolled_count || 0) >= (b.max_capacity || 20);

                      // Check clash against already selected batches (excluding this one)
                      const clashingBatch = batches
                        .filter(otherB => editSelectedBatchIds.includes(otherB.id) && otherB.id !== b.id)
                        .find(otherB => checkBatchClash(b, otherB).hasClash);
                      const clashInfo = clashingBatch ? checkBatchClash(b, clashingBatch) : null;

                      return (
                        <div
                          key={b.id}
                          onClick={() => handleEditToggleBatch(b.id)}
                          className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-[#FFF2F8] border-[#8A064D] shadow-2xs ring-1 ring-[#8A064D]'
                              : clashingBatch
                              ? 'bg-rose-50/50 border-rose-300 opacity-80'
                              : isFull
                              ? 'bg-amber-50/50 border-amber-300'
                              : 'bg-white border-gray-200 hover:border-[#8A064D]/50 hover:bg-[#FFFDFE]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-[#8A064D] focus:ring-[#8A064D]"
                                />
                                <span className="font-black text-xs text-[#2D041A]">
                                  {b.course_title} — {b.name}
                                </span>
                              </div>

                              {/* Days & Timings Row */}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#8A064D]" />
                                  <span>{b.days_of_week?.join(', ') || 'Regular'}</span>
                                </span>
                                <span className="px-2 py-0.5 rounded-lg bg-gray-100 font-bold text-gray-700 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-[#8A064D]" />
                                  <span>{b.start_time?.substring(0, 5)} - {b.end_time?.substring(0, 5)}</span>
                                </span>
                              </div>

                              {/* Guru & Room */}
                              <div className="mt-1 text-[11px] text-gray-500 font-medium flex items-center gap-3">
                                <span>Guru: <strong className="text-gray-700">{b.trainer_name || 'Assigned'}</strong></span>
                                <span>Room: <strong className="text-gray-700">{b.room_or_hall || b.room || 'Hall'}</strong></span>
                              </div>
                            </div>

                            {/* Capacity Badge */}
                            <div className="text-right shrink-0">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black ${
                                isFull 
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                                {b.enrolled_count || 0}/{b.max_capacity || 20} Seats
                              </span>
                            </div>
                          </div>

                          {/* Full Warning Message Banner */}
                          {isFull && !isSelected && (
                            <div className="mt-2.5 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-900 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span>⚠️ Batch has reached capacity ({b.enrolled_count}/{b.max_capacity || 20} seats filled).</span>
                            </div>
                          )}

                          {/* Timing Clash Warning Banner */}
                          {clashInfo && (
                            <div className="mt-2.5 p-2 rounded-xl bg-rose-100 border border-rose-300 text-[11px] font-black text-rose-900 flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>⚠️ {clashInfo.reason}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dynamic Fee Calculation Card */}
              <div className="p-4 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] space-y-2 text-xs">
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-semibold">Total Monthly Tuition:</span>
                  <span className="font-black text-sm text-[#2D041A]">₹{totalMonthlyCalculated.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-semibold">Advance Payment Applied:</span>
                  <span className="font-black text-emerald-700">₹{Number(editAdvancePaid || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-[#F0D5E4] flex justify-between items-center">
                  <span className="font-black text-[#590231]">Current Balance Due:</span>
                  <span className="font-black text-base text-[#8A064D]">₹{Math.max(0, calculatedDue).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-70 bg-[#2D041A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border-2 border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8A064D] to-[#EBB128] flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-black text-[#F9E33A] uppercase tracking-wider">Action Successful</div>
            <div className="text-xs font-bold text-white mt-0.5">{toastMessage}</div>
          </div>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded-lg transition ml-3 cursor-pointer text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. HEADER & TOP CONTROLS */}
      {/* ===================================================================== */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4]/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Student Directory
            </span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold tabular-nums">
              {students.length} Total Learners
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-7 h-7 text-[#8A064D]" />
            <span>Student Management</span>
          </h1>
          <p className="text-xs text-[#6E3955] mt-1 max-w-2xl font-medium">
            Track student admissions, status, course fees, due amounts, and parent details.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="w-4 h-4 text-[#8A064D]/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FFF9FB] border border-[#F0D5E4] rounded-2xl text-xs font-semibold text-[#2D041A] placeholder:text-[#8A064D]/40 focus:outline-none focus:ring-2 focus:ring-[#8A064D]/20 focus:border-[#8A064D] focus:bg-white transition"
            />
          </div>

          {/* View Mode Toggle: Grid vs Row */}
          <div className="flex items-center bg-[#FFF2F8] p-1 rounded-2xl border border-[#F0D5E4]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'text-[#6E3955] hover:text-[#2D041A]'
              }`}
              title="Grid View (Default)"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('row')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'row'
                  ? 'bg-[#8A064D] text-white shadow-xs'
                  : 'text-[#6E3955] hover:text-[#2D041A]'
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
            className="bg-[#8A064D] hover:bg-[#70043E] active:scale-98 text-white px-5 py-2.5 rounded-2xl text-xs font-black tracking-wide shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer border border-[#F9E33A]/40"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Register Student</span>
          </button>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. ACTIVE / INACTIVE FILTERS (Active by default) */}
      {/* ===================================================================== */}
      <div className="flex items-center gap-2.5">
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>Active Students</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
            statusFilter === 'active' ? 'bg-white/20 text-white' : 'bg-[#FFF2F8] text-[#8A064D]'
          }`}>
            {activeCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('inactive')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'inactive'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Inactive Students</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
            statusFilter === 'inactive' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
          }`}>
            {inactiveCount}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-[#8A064D] text-white shadow-xs ring-2 ring-[#F9E33A]/40'
              : 'bg-white text-[#521D38] border border-[#F0D5E4] hover:bg-[#FFF9FB]'
          }`}
        >
          <span>All Students</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-extrabold tabular-nums ${
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
            <div className="col-span-full py-16 text-center text-[#6E3955] bg-white rounded-3xl border border-[#F0D5E4]">
              <AlertTriangle className="w-8 h-8 text-[#8A064D]/30 mx-auto mb-2" />
              <p className="font-bold text-[#2D041A]">No {statusFilter !== 'all' ? statusFilter : ''} students found.</p>
              <p className="text-xs text-[#6E3955] mt-1 font-medium">Try switching filters or clearing your search.</p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const dueInfo = getDueAmountDisplay(s);
              const monthlyFee = s.total_monthly_fee || 0;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-[#F0D5E4]/90 p-5 shadow-xs hover:shadow-md hover:border-[#8A064D]/40 transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Bar: Status Badge & Student ID */}
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-100/80 px-3 py-1 rounded-xl shadow-2xs tabular-nums">
                        {s.roll_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          s.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          <span className="capitalize">{s.status || 'Active'}</span>
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleStudentStatus(s);
                          }}
                          title={`Click to mark ${s.status === 'active' ? 'Inactive' : 'Active'}`}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                            s.status === 'active'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          }`}
                        >
                          {s.status === 'active' ? 'Set Inactive' : 'Set Active'}
                        </button>
                      </div>
                    </div>

                    {/* Combined Live Attendance Counts: Current Month & Last Month */}
                    {s.total_attendance && (
                      <div className="mb-3.5 p-2 px-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4]/80 flex items-center justify-between text-[11px] font-semibold text-gray-700">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500 font-medium">This Month:</span>
                          <span className="font-black text-emerald-600 tabular-nums">{s.total_attendance.this_month_held}</span>
                          <span className="text-gray-400">/</span>
                          <span className="font-black text-rose-600 tabular-nums">{s.total_attendance.this_month_absent}</span>
                        </div>
                        <span className="text-gray-300">|</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-gray-500 font-medium">Last Month:</span>
                          <span className="font-black text-emerald-600 tabular-nums">{s.total_attendance.last_month_held}</span>
                          <span className="text-gray-400">/</span>
                          <span className="font-black text-rose-600 tabular-nums">{s.total_attendance.last_month_absent}</span>
                        </div>
                      </div>
                    )}

                    {/* Student Info with Profile Photo */}
                    <div className="flex items-start gap-3.5 my-1.5">
                      {s.avatar_url ? (
                        <img
                          src={s.avatar_url}
                          alt={s.full_name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-[#F9E33A] shadow-xs shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-[#590231] text-[#F9E33A] font-black text-base flex items-center justify-center shrink-0 border border-rose-200/50 shadow-2xs">
                          {s.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Student Name as Primary Heading */}
                        <h3 className="font-bold text-lg text-[#2D041A] tracking-tight group-hover:text-[#8A064D] transition truncate">
                          {s.full_name}
                        </h3>

                        {/* Contact Number below Name */}
                        <div className="text-sm text-[#6E3955] flex items-center gap-1.5 mt-1 truncate tabular-nums">
                          <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="font-medium text-[#2D041A]">{s.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Fee Details Box: Total Monthly Fee, Due Amount with Color, Due Date */}
                    <div className="mt-4 p-4 bg-[#FFF9FB]/70 rounded-2xl border border-[#F0D5E4]/60 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6E3955] font-semibold text-xs uppercase tracking-wide">Total Monthly Fee:</span>
                        <span className="font-extrabold text-[#2D041A] text-base tabular-nums">
                          ₹{monthlyFee.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6E3955] font-semibold text-xs uppercase tracking-wide">Due Amount:</span>
                        <span className={`px-3 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 tabular-nums ${dueInfo.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${dueInfo.dotClass}`} />
                          <span>{dueInfo.text}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#6E3955] font-semibold text-xs uppercase tracking-wide">Due Date:</span>
                        <span className="font-mono font-bold text-[#2D041A] bg-white px-2.5 py-1 rounded-xl border border-[#F0D5E4] text-xs shadow-2xs tabular-nums">
                          {formatDueDateDisplay(s.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Below: Details, Edit, Delete with refined, cohesive styling */}
                  <div className="mt-5 pt-3.5 border-t border-[#F0D5E4]/50 flex items-center gap-2.5">
                    <button
                      onClick={() => setDetailStudent(s)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs border border-[#48082B] cursor-pointer"
                      title="View Complete Student Details"
                    >
                      <Eye className="w-4 h-4 text-[#F9E33A]" />
                      <span>Details</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(s)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-[#FFF5F9] hover:bg-[#FCE7F3] active:scale-95 text-[#8A064D] hover:text-[#70043E] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs border border-[#E8BFD5] cursor-pointer"
                      title="Edit Student Information"
                    >
                      <Edit3 className="w-4 h-4 text-[#8A064D]" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingStudent(s)}
                      className="py-2.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 hover:text-rose-800 text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs border border-rose-200 cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4 text-rose-600" />
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
        <div className="bg-white rounded-3xl border border-[#F0D5E4]/90 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#590231] font-bold text-xs uppercase tracking-wider">
                  <th className="py-4 px-5">Student ID & Status</th>
                  <th className="py-4 px-5">Student Name & Contact</th>
                  <th className="py-4 px-5 text-right">Total Monthly Fee</th>
                  <th className="py-4 px-5 text-center">Due Amount</th>
                  <th className="py-4 px-5 text-center">Due Date</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0D5E4]/40 text-sm">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#6E3955]">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => {
                    const dueInfo = getDueAmountDisplay(s);
                    const monthlyFee = s.total_monthly_fee || 0;

                    return (
                      <tr key={s.id} className="hover:bg-[#FFFDFC] transition">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg text-xs tabular-nums">
                              {s.roll_number}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                s.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                                <span className="capitalize">{s.status || 'Active'}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStudentStatus(s);
                                }}
                                title={`Click to mark ${s.status === 'active' ? 'Inactive' : 'Active'}`}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition cursor-pointer ${
                                  s.status === 'active'
                                    ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                }`}
                              >
                                {s.status === 'active' ? 'Set Inactive' : 'Set Active'}
                              </button>
                            </div>
                          </div>
                          {s.total_attendance && (
                            <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-gray-600">
                              <span>
                                This: <span className="font-black text-emerald-600 tabular-nums">{s.total_attendance.this_month_held}</span>/<span className="font-black text-rose-600 tabular-nums">{s.total_attendance.this_month_absent}</span>
                              </span>
                              <span className="text-gray-300">|</span>
                              <span>
                                Last: <span className="font-black text-emerald-600 tabular-nums">{s.total_attendance.last_month_held}</span>/<span className="font-black text-rose-600 tabular-nums">{s.total_attendance.last_month_absent}</span>
                              </span>
                            </div>
                          )}

                        </td>

                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            {s.avatar_url ? (
                              <img
                                src={s.avatar_url}
                                alt={s.full_name}
                                className="w-11 h-11 rounded-xl object-cover border border-[#F9E33A] shrink-0"
                              />
                            ) : (
                              <div className="w-11 h-11 rounded-xl bg-[#590231] text-[#F9E33A] font-black text-sm flex items-center justify-center shrink-0 border border-rose-200/50">
                                {s.full_name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-[#2D041A] text-sm">{s.full_name}</div>
                              <div className="text-xs text-[#6E3955] flex items-center gap-1.5 mt-0.5 tabular-nums">
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{s.phone}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-5 text-right font-extrabold text-[#2D041A] text-sm tabular-nums">
                          ₹{monthlyFee.toLocaleString('en-IN')}
                        </td>

                        <td className="py-4 px-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-extrabold tabular-nums ${dueInfo.badgeClass}`}>
                            <span className={`w-2 h-2 rounded-full ${dueInfo.dotClass}`} />
                            <span>{dueInfo.text}</span>
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center font-mono font-bold text-[#2D041A] text-xs tabular-nums">
                          {formatDueDateDisplay(s.due_date)}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDetailStudent(s)}
                              className="px-3.5 py-2 rounded-xl bg-[#2D041A] hover:bg-[#48082B] active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border border-[#48082B] cursor-pointer"
                              title="View Details"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                              <span>Details</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="px-3.5 py-2 rounded-xl bg-[#FFF5F9] hover:bg-[#FCE7F3] active:scale-95 text-[#8A064D] text-xs font-bold transition flex items-center gap-1.5 shadow-2xs border border-[#E8BFD5] cursor-pointer"
                              title="Edit Details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#8A064D]" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 transition flex items-center shadow-2xs border border-rose-200 cursor-pointer"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4 text-rose-600" />
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
      {/* 5. DETAILS MODAL (BIG IMAGE & PERFECT INFORMATION ALIGNMENT) */}
      {/* ===================================================================== */}
      {detailStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl border border-[#F0D5E4] max-h-[90vh] overflow-y-auto my-8">
            
            {/* Modal Header & Hero Section */}
            <div className="flex flex-col sm:flex-row items-start gap-5 pb-6 border-b border-gray-100 mb-5 relative">
              {/* Close Button Top Right */}
              <button
                onClick={() => setDetailStudent(null)}
                className="absolute top-0 right-0 w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer z-10"
                title="Close"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* BIG STUDENT PORTRAIT WITH CLICK TO ENLARGE LIGHTBOX */}
              <div className="shrink-0 mx-auto sm:mx-0">
                {detailStudent.avatar_url ? (
                  <div
                    onClick={() => setLightboxImage({ src: detailStudent.avatar_url!, title: detailStudent.full_name })}
                    className="relative w-36 h-44 sm:w-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-[#F0D5E4] bg-neutral-900 shadow-md group cursor-pointer"
                    title="Click to view full image"
                  >
                    <img
                      src={detailStudent.avatar_url}
                      alt={detailStudent.full_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Hover Overlay with Zoom Icon */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2 p-3 text-center">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-xs">
                        <ZoomIn className="w-6 h-6 text-[#F9E33A]" />
                      </div>
                      <span className="text-[11px] font-bold text-white bg-black/60 px-2.5 py-1 rounded-full border border-white/20">
                        Click to view full image
                      </span>
                    </div>

                    {/* Subtle Corner Maximize Indicator */}
                    <div className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/70 text-white group-hover:opacity-0 transition-opacity">
                      <Maximize2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                    </div>
                  </div>
                ) : (
                  <div className="w-36 h-44 sm:w-44 sm:h-52 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#590231] text-[#F9E33A] font-bold text-3xl flex flex-col items-center justify-center shadow-md border-2 border-[#F9E33A]/40 gap-2">
                    <span>{detailStudent.full_name.slice(0, 2).toUpperCase()}</span>
                    <span className="text-[10px] text-white/70 uppercase tracking-widest font-sans font-normal">No Photo</span>
                  </div>
                )}
              </div>

              {/* STUDENT HEADER INFO */}
              <div className="flex-1 min-w-0 pr-8 space-y-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black text-[#8A064D] bg-[#FFF2F8] border border-rose-200 px-3 py-1 rounded-lg shadow-2xs">
                    {detailStudent.roll_number}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                    detailStudent.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${detailStudent.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="capitalize">{detailStudent.status === 'active' ? 'Active Disciple' : 'Inactive'}</span>
                  </span>
                </div>

                <h3 className="font-serif font-black text-2xl sm:text-3xl text-[#2D041A] leading-tight">
                  {detailStudent.full_name}
                </h3>

                {/* Quick Contact & Batch summary */}
                <div className="space-y-1.5 text-xs text-gray-700 pt-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    {detailStudent.phone && (
                      <a
                        href={`tel:${detailStudent.phone}`}
                        className="flex items-center gap-1.5 font-bold text-[#8A064D] hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{detailStudent.phone}</span>
                      </a>
                    )}
                    {detailStudent.email && (
                      <a
                        href={`mailto:${detailStudent.email}`}
                        className="flex items-center gap-1.5 font-medium text-gray-600 hover:text-[#8A064D] truncate max-w-[240px]"
                      >
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span className="truncate">{detailStudent.email}</span>
                      </a>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-[#8A064D]" />
                    <span>Enrolled: <strong>{formatDdMonthName(detailStudent.enrollment_date)}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              
              {/* SECTION 1: FINANCIAL & FEE SUMMARY */}
              <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100">
                <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Fee &amp; Due Overview</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Total Monthly Fee</span>
                    <span className="text-sm sm:text-base font-extrabold text-[#2D041A] mt-0.5 block">
                      ₹{(detailStudent.total_monthly_fee || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Advance Paid</span>
                    <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5 block">
                      ₹{Number(detailStudent.advance_paid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Due Amount</span>
                    <span className={`text-sm sm:text-base font-extrabold mt-0.5 block ${
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

                  <div className="bg-white p-3 rounded-xl border border-rose-100 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Due Date</span>
                    <span className="text-sm sm:text-base font-mono font-extrabold text-gray-800 mt-0.5 block">
                      {formatDueDateDisplay(detailStudent.due_date)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: STUDENT CONTACT & PERSONAL DETAILS */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Student Contact &amp; Personal Info</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                  {/* Row 1: Contact Phone, Email Address, Date of Birth */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Contact Phone</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{detailStudent.phone || '—'}</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Email Address</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1.5 mt-0.5 truncate">
                      <Mail className="w-4 h-4 text-[#8A064D] shrink-0" />
                      <span className="truncate">{detailStudent.email || '—'}</span>
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Date of Birth</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-[#8A064D] shrink-0" />
                      <span>{detailStudent.date_of_birth ? formatDdMonthName(detailStudent.date_of_birth) : '—'}</span>
                    </span>
                  </div>

                  {/* Row 2: Age, Gender, Joining Date */}
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Age</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-0.5 block">
                      {detailStudent.age ? `${detailStudent.age} Years` : '—'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Gender</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 capitalize mt-0.5 block">
                      {detailStudent.gender || '—'}
                    </span>
                  </div>

                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Joining Date</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-1.5 mt-0.5">
                      <Calendar className="w-4 h-4 text-[#8A064D] shrink-0" />
                      <span>{formatDdMonthName(detailStudent.enrollment_date)}</span>
                    </span>
                  </div>

                  {/* Row 3: Residential Address - Spans full 3 columns completely without truncation */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs sm:col-span-3">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider mb-1">Residential Address</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 flex items-start gap-2 break-words whitespace-normal leading-relaxed">
                      <MapPin className="w-4 h-4 text-[#8A064D] shrink-0 mt-0.5" />
                      <span>{detailStudent.address || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: PARENT / GUARDIAN DETAILS */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#8A064D]" />
                  <span>Parent / Guardian Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Guardian Name</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-0.5 block">{detailStudent.parent_name || '—'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Relation</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-0.5 block">{detailStudent.parent_relation || 'Parent'}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-2xs">
                    <span className="text-[#590231]/60 block text-[10px] sm:text-[11px] uppercase font-bold tracking-wider">Guardian Contact</span>
                    <span className="text-sm sm:text-base font-extrabold text-gray-900 mt-0.5 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{detailStudent.parent_contact || detailStudent.phone}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: ENROLLED COURSES & BATCHES */}
              <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-black text-[#590231] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#8A064D]" />
                    <span>Enrolled Courses &amp; Batches ({detailStudent.enrolled_batches?.length || 0})</span>
                  </h4>
                </div>

                <div className="space-y-2">
                  {(detailStudent.enrolled_batches && detailStudent.enrolled_batches.length > 0) ? (
                    detailStudent.enrolled_batches.map((eb, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between text-xs shadow-2xs">
                        <div>
                          <div className="font-bold text-gray-900">{eb.course_title}</div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            Batch: <strong className="text-gray-800">{eb.batch_name}</strong> • Guru: {eb.trainer_name}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span>Timings: {eb.start_time?.substring(0, 5)} - {eb.end_time?.substring(0, 5)} ({eb.days_of_week?.join(', ')})</span>
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
              <div className="flex items-center justify-between pt-4 border-t border-[#F0D5E4]/60">
                <button
                  type="button"
                  onClick={() => {
                    const s = detailStudent;
                    setDetailStudent(null);
                    setDeletingStudent(s);
                  }}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 shadow-2xs border border-rose-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Student</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailStudent(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-medium text-[#521D38] bg-gray-100 hover:bg-gray-200 transition cursor-pointer"
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
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] active:scale-95 text-white shadow-sm border border-[#8A064D] transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#F9E33A]" />
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
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              
              {/* Profile Photo Upload */}
              <PhotoUploadInput
                value={editAvatarUrl}
                onChange={setEditAvatarUrl}
                label="Student Profile Photo"
                initials={editFullName ? editFullName.slice(0, 2).toUpperCase() : 'ST'}
                studentName={editFullName}
                rollNumber={editingStudent.roll_number}
                maxSizeMB={1}
              />

              {/* Row 1: Student ID (read-only) & Status (Active / Inactive toggle) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student ID <span className="text-[10px] text-gray-500 font-normal">(System Generated)</span>
                  </label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={editingStudent.roll_number}
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-black text-[#8A064D] cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Student Status <span className="text-[10px] text-[#8A064D] font-normal">(Active / Inactive)</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
                  >
                    <option value="active">Active (Currently Enrolled)</option>
                    <option value="inactive">Inactive (Paused / Left)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Date of Birth, Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editDateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDateOfBirth(val);
                      const autoAge = calculateAge(val);
                      if (autoAge) setEditAge(autoAge);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="e.g. 14"
                    value={editAge}
                    onChange={(e) => setEditAge(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <select
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="trans">Trans</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Student Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Student Email</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 4: Phone & Joining Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Student Contact Number</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={editJoiningDate}
                    onChange={(e) => setEditJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Advance Paid */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Advance Paid (INR ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editAdvancePaid}
                  onChange={(e) => setEditAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Row 6: Parent / Guardian Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Parent Name</label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Relation</label>
                  <select
                    value={editParentRelation}
                    onChange={(e) => setEditParentRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Parent Contact</label>
                  <input
                    type="tel"
                    required
                    value={editParentContact}
                    onChange={(e) => setEditParentContact(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Full Address</label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Courses & Batches Selection */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
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
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
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
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold'
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
                className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 text-[#8A064D] hover:text-[#590231] border border-rose-200 flex items-center justify-center transition shadow-2xs cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              
              {/* Profile Photo Upload */}
              <PhotoUploadInput
                value={avatarUrl}
                onChange={setAvatarUrl}
                label="Student Profile Photo"
                initials={fullName ? fullName.slice(0, 2).toUpperCase() : 'ST'}
                studentName={fullName}
                rollNumber={nextAutoId}
                maxSizeMB={1}
              />

              {/* Row 1: Student ID (read-only, not manually editable) */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Student ID <span className="text-[10px] text-emerald-600 font-bold">(Auto-generated in sequence, not editable)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={nextAutoId}
                  className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl text-xs font-mono font-black text-[#8A064D] cursor-not-allowed"
                />
              </div>

              {/* Row 2: Date of Birth, Age & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDateOfBirth(val);
                      const autoAge = calculateAge(val);
                      if (autoAge) setAge(autoAge);
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    placeholder="e.g. 14"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white cursor-pointer"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="trans">Trans</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Full Name & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Student Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Student / Parent Email</label>
                  <input
                    type="email"
                    required
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 4: Contact Number & Joining Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Contact Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Row 5: Advance Paid */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Advance Paid (INR ₹)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Row 6: Parent / Guardian Info */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Relation</label>
                  <select
                    value={parentRelation}
                    onChange={(e) => setParentRelation(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] cursor-pointer"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Parent Contact</label>
                  <input
                    type="tel"
                    placeholder="+91 98450 12345"
                    value={parentContact}
                    onChange={(e) => setParentContact(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">Full Residential Address</label>
                <textarea
                  rows={2}
                  placeholder="Street, apartment, locality, Bangalore..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              {/* Select Courses & Batches */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
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
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
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
                    <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
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
                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold'
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
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
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
      {/* ===================================================================== */}
      {/* FULLSCREEN IMAGE LIGHTBOX VIEWER */}
      {/* ===================================================================== */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-80 flex flex-col items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150"
          onClick={() => setLightboxImage(null)}
        >
          {/* Top Bar with title and close button */}
          <div 
            className="w-full max-w-4xl flex items-center justify-between pb-3 text-white mb-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-lg text-[#F9E33A]">{lightboxImage.title}</span>
              <span className="text-xs text-gray-400 font-medium">(Student Portrait)</span>
            </div>
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-white/20"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Full Image Container */}
          <div 
            className="relative max-w-4xl max-h-[85vh] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={lightboxImage.src}
              alt={lightboxImage.title}
              className="max-h-[85vh] max-w-full object-contain"
            />
          </div>

          <p className="text-xs text-white/50 mt-3 font-medium">
            Click anywhere outside or press Close to dismiss
          </p>
        </div>
      )}

    </div>
  );
}
