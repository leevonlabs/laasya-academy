'use client';

import React, { useState } from 'react';
import { Student, Batch, Course, StudentEnrolledBatch } from '@/lib/academy';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  UserCheck, 
  X,
  Calendar,
  Layers,
  LayoutGrid,
  List,
  Edit3,
  Eye,
  Clock,
  MapPin,
  CheckCircle2,
  Sparkles,
  Printer,
  ChevronRight,
  User,
  ShieldCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface Props {
  initialStudents: Student[];
  batches: Batch[];
  courses: Course[];
}

export default function StudentsListClient({ initialStudents, batches, courses }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  
  // View mode: 'grid' as first preference!
  const [viewMode, setViewMode] = useState<'grid' | 'row'>('grid');

  // Modals state
  // 1. Full Details Popup Modal
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);

  // 2. Edit Details Modal
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editParentName, setEditParentName] = useState('');
  const [editParentRelation, setEditParentRelation] = useState('Mother');
  const [editParentContact, setEditParentContact] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'inactive' | 'suspended'>('active');
  const [savingEdit, setSavingEdit] = useState(false);

  // 3. View Timetable Modal
  const [timetableStudent, setTimetableStudent] = useState<Student | null>(null);

  // 4. Enroll in Batch Modal
  const [enrollStudentModal, setEnrollStudentModal] = useState<Student | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [savingEnroll, setSavingEnroll] = useState(false);

  // 5. Register New Student Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState('Mother');
  const [parentContact, setParentContact] = useState('');
  const [address, setAddress] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [savingNew, setSavingNew] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter students
  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.parent_name && s.parent_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.address && s.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.enrolled_batches || []).some(b => b.course_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open Edit Modal
  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setEditFullName(s.full_name);
    setEditEmail(s.email);
    setEditPhone(s.phone);
    setEditParentName(s.parent_name || '');
    setEditParentRelation(s.parent_relation || 'Mother');
    setEditParentContact(s.parent_contact || s.phone);
    setEditAddress(s.address || '');
    setEditStatus(s.status || 'active');
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
          full_name: editFullName,
          email: editEmail,
          phone: editPhone,
          parent_name: editParentName,
          parent_relation: editParentRelation,
          parent_contact: editParentContact,
          address: editAddress,
          status: editStatus
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update student');
      }

      const updated = await res.json();

      setStudents(prev =>
        prev.map(s => (s.id === editingStudent.id ? { ...s, ...updated } : s))
      );

      // If full detail modal is open for this student, update it
      if (detailStudent && detailStudent.id === editingStudent.id) {
        setDetailStudent({ ...detailStudent, ...updated });
      }

      showToast(`Student details for ${editFullName} updated successfully!`);
      setEditingStudent(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Enroll in Batch
  const handleEnrollBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentModal || !selectedBatchId) return;
    setSavingEnroll(true);

    try {
      const res = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: enrollStudentModal.id,
          batchId: selectedBatchId
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to enroll student');
      }

      const batchObj = batches.find(b => b.id === selectedBatchId);
      const newEnrolledBatch: StudentEnrolledBatch = {
        batch_id: selectedBatchId,
        batch_name: batchObj?.name || 'Class Batch',
        course_id: batchObj?.course_id || '',
        course_title: batchObj?.course_title || 'Course',
        course_category: batchObj?.course_category || 'Academy Arts',
        monthly_fee: 2000,
        trainer_id: batchObj?.trainer_id || '',
        trainer_name: batchObj?.trainer_name || 'Academy Guru',
        days_of_week: batchObj?.days_of_week || [],
        start_time: batchObj?.start_time || '09:00:00',
        end_time: batchObj?.end_time || '10:30:00',
        room_or_hall: batchObj?.room_or_hall || 'Hall',
        enrollment_status: 'active'
      };

      setStudents(prev =>
        prev.map(s => {
          if (s.id === enrollStudentModal.id) {
            const currentBatches = s.enrolled_batches || [];
            // Prevent duplicate display
            const exists = currentBatches.some(b => b.batch_id === selectedBatchId);
            const updatedBatches = exists ? currentBatches : [...currentBatches, newEnrolledBatch];
            return {
              ...s,
              enrolled_batches_count: updatedBatches.length,
              enrolled_batches: updatedBatches
            };
          }
          return s;
        })
      );

      // If full detail modal is open for this student, update it
      if (detailStudent && detailStudent.id === enrollStudentModal.id) {
        setDetailStudent(prev => {
          if (!prev) return null;
          const currentBatches = prev.enrolled_batches || [];
          const exists = currentBatches.some(b => b.batch_id === selectedBatchId);
          const updatedBatches = exists ? currentBatches : [...currentBatches, newEnrolledBatch];
          return {
            ...prev,
            enrolled_batches_count: updatedBatches.length,
            enrolled_batches: updatedBatches
          };
        });
      }

      showToast(`Student ${enrollStudentModal.full_name} enrolled in ${batchObj?.name}!`);
      setEnrollStudentModal(null);
      setSelectedBatchId('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingEnroll(false);
    }
  };

  // Toggle course selection in Register Modal
  const handleToggleCourse = (courseId: string) => {
    setSelectedCourseIds(prev => {
      const exists = prev.includes(courseId);
      const updated = exists ? prev.filter(id => id !== courseId) : [...prev, courseId];
      // Automatically keep batch selection in sync
      const validBatchesForSelectedCourses = batches
        .filter(b => updated.includes(b.course_id))
        .map(b => b.id);
      setSelectedBatchIds(bPrev => bPrev.filter(bId => validBatchesForSelectedCourses.includes(bId)));
      return updated;
    });
  };

  // Toggle batch selection in Register Modal
  const handleToggleBatch = (batchId: string) => {
    setSelectedBatchIds(prev =>
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
          full_name: fullName,
          email,
          phone,
          parent_name: parentName,
          parent_relation: parentRelation,
          parent_contact: parentContact || phone,
          address: address,
          batch_ids: selectedBatchIds
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register student');
      }

      const created = await res.json();

      // Build enrolled_batches objects for the newly registered student
      const enrolledBatchObjects: StudentEnrolledBatch[] = selectedBatchIds.map(bId => {
        const b = batches.find(x => x.id === bId);
        return {
          batch_id: bId,
          batch_name: b?.name || 'Class Batch',
          course_id: b?.course_id || '',
          course_title: b?.course_title || 'Course',
          course_category: b?.course_category || 'Academy Arts',
          monthly_fee: 2000,
          trainer_id: b?.trainer_id || '',
          trainer_name: b?.trainer_name || 'Academy Guru',
          days_of_week: b?.days_of_week || [],
          start_time: b?.start_time || '09:00:00',
          end_time: b?.end_time || '10:30:00',
          room_or_hall: b?.room_or_hall || 'Hall',
          enrollment_status: 'active'
        };
      });

      const fullStudent: Student = {
        ...created,
        full_name: fullName,
        email,
        phone,
        parent_name: parentName,
        parent_relation: parentRelation,
        parent_contact: parentContact || phone,
        address,
        status: 'active',
        enrolled_batches_count: selectedBatchIds.length,
        attendance_rate: 100,
        enrolled_batches: enrolledBatchObjects
      };

      setStudents(prev => [fullStudent, ...prev]);
      showToast(`Student ${fullName} registered successfully with ${selectedBatchIds.length} batch(es)!`);
      
      // Reset form
      setIsAddOpen(false);
      setFullName('');
      setEmail('');
      setPhone('');
      setParentName('');
      setParentRelation('Mother');
      setParentContact('');
      setAddress('');
      setSelectedCourseIds([]);
      setSelectedBatchIds([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingNew(false);
    }
  };

  // Batches available for the selected courses in the register modal
  const availableBatchesForSelectedCourses = batches.filter(b =>
    selectedCourseIds.includes(b.course_id)
  );

  return (
    <div className="space-y-6">

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#2D041A] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#F9E33A] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <Sparkles className="w-5 h-5 text-[#F9E33A]" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* HEADER WITH VIEW SWITCHER AND ACTION BUTTONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-[#FCE7F3] text-[#8A064D]">
              Student Directory
            </span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-bold">
              {students.length} Learners Enrolled
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#2D041A] tracking-tight flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-[#8A064D]" />
            Student Roster & Enrollments
          </h1>
          <p className="text-xs text-gray-500 mt-1 max-w-2xl">
            Manage student registrations, parent & guardian profiles, weekly timetables, and batch assignments across all cultural arts disciplines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, roll no, parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            />
          </div>

          {/* VIEW SWITCHER: GRID WISE (1ST PREFERENCE) VS ROW WISE */}
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
            onClick={() => {
              setIsAddOpen(true);
              setSelectedCourseIds(courses.slice(0, 1).map(c => c.id));
              setSelectedBatchIds([]);
            }}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2.5 rounded-2xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Register Student</span>
          </button>

        </div>
      </div>

      {/* ===================================================================== */}
      {/* 1. GRID-WISE VIEW (FIRST PREFERENCE) */}
      {/* ===================================================================== */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-400 bg-white rounded-3xl border border-[#F0D5E4]">
              No students found matching your search.
            </div>
          ) : (
            filteredStudents.map((s) => {
              const initials = s.full_name
                .split(' ')
                .map(n => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase();

              const enrolledCount = s.enrolled_batches?.length || s.enrolled_batches_count || 0;

              return (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl border border-[#F0D5E4] p-5 shadow-xs hover:shadow-md transition group flex flex-col justify-between relative overflow-hidden"
                >
                  {/* Top Bar with Roll No and Status */}
                  <div>
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="font-mono text-xs font-extrabold text-[#8A064D] bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-xl">
                        {s.roll_number}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="capitalize">{s.status || 'Active'}</span>
                      </span>
                    </div>

                    {/* Student Avatar & Basic Info - CLICKABLE FOR FULL DETAILS */}
                    <div 
                      onClick={() => setDetailStudent(s)}
                      className="cursor-pointer group-hover:opacity-95 transition"
                    >
                      <div className="flex items-center gap-3.5 mb-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="font-bold text-base text-[#2D041A] truncate group-hover:text-[#8A064D] transition">
                            {s.full_name}
                          </h3>
                          <div className="text-[11px] text-gray-500 flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{s.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Parent / Guardian Info */}
                      <div className="bg-[#FFF9FB] p-3 rounded-2xl border border-[#F0D5E4] space-y-1.5 mb-3.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">Parent / Guardian:</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-purple-50 text-purple-700 text-[10px] font-bold">
                            {s.parent_relation || 'Parent'}
                          </span>
                        </div>
                        <div className="font-semibold text-gray-900 text-xs">
                          {s.parent_name || 'Guardian Not Listed'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-600">
                          <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>{s.parent_contact || s.phone}</span>
                        </div>
                        {s.address && (
                          <div className="flex items-start gap-1 text-[10px] text-gray-500 pt-1 border-t border-rose-100 truncate">
                            <MapPin className="w-3 h-3 text-[#8A064D] shrink-0 mt-0.5" />
                            <span className="truncate">{s.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Enrolled Classes Pills */}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center justify-between text-[11px] text-gray-500 font-semibold">
                          <span>Enrolled Batches</span>
                          <span className="text-[#8A064D] font-bold">{enrolledCount} Classes</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(s.enrolled_batches && s.enrolled_batches.length > 0) ? (
                            s.enrolled_batches.slice(0, 2).map((eb, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-gray-100 rounded-lg text-[10px] font-semibold text-gray-700 truncate max-w-[200px]"
                              >
                                {eb.course_title} ({eb.trainer_name.replace('Guru: ', '')})
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No batches assigned yet</span>
                          )}
                          {enrolledCount > 2 && (
                            <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold">
                              +{enrolledCount - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS (Edit, View Timetable, Enroll in Batch) */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-1.5">
                    
                    {/* View Details / Open popup */}
                    <button
                      onClick={() => setDetailStudent(s)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      title="View Full Profile Details"
                    >
                      <Eye className="w-3 h-3 text-gray-500" />
                      <span>Details</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Option 1: Edit Details */}
                      <button
                        onClick={() => handleOpenEdit(s)}
                        className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Edit Student Details"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Edit</span>
                      </button>

                      {/* Option 2: View Timetable */}
                      <button
                        onClick={() => setTimetableStudent(s)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#FFF9FB] hover:bg-[#FCE7F3] text-[#8A064D] border border-[#F0D5E4] text-[11px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="View Class Timetable"
                      >
                        <Calendar className="w-3 h-3 text-[#8A064D]" />
                        <span>Timetable</span>
                      </button>

                      {/* Option 3: Enroll in Batch */}
                      <button
                        onClick={() => {
                          setEnrollStudentModal(s);
                          setSelectedBatchId(batches[0]?.id || '');
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                        title="Enroll in New Batch"
                      >
                        <Plus className="w-3 h-3 text-[#F9E33A]" />
                        <span>Enroll</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ROW-WISE (TABLE) VIEW */}
      {/* ===================================================================== */}
      {viewMode === 'row' && (
        <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[#2D041A] font-bold">
                  <th className="py-3.5 px-4">Roll Number</th>
                  <th className="py-3.5 px-4">Student Details</th>
                  <th className="py-3.5 px-4">Parent / Guardian</th>
                  <th className="py-3.5 px-3">Address</th>
                  <th className="py-3.5 px-3 text-center">Enrolled Batches</th>
                  <th className="py-3.5 px-3 text-center">Attendance %</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-gray-400">
                      No students found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s) => (
                    <tr 
                      key={s.id} 
                      className="hover:bg-[#FFFDFC] transition group cursor-pointer"
                    >
                      {/* Roll Number */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-4 font-mono font-bold text-[#8A064D]"
                      >
                        <span className="bg-[#FFF2F8] border border-rose-100 px-2 py-0.5 rounded-lg">
                          {s.roll_number}
                        </span>
                      </td>

                      {/* Student Details */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-4"
                      >
                        <div className="font-bold text-gray-900 group-hover:text-[#8A064D] transition">
                          {s.full_name}
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span>{s.email}</span>
                        </div>
                      </td>

                      {/* Parent / Guardian */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-4"
                      >
                        <div className="font-semibold text-gray-800 flex items-center gap-1.5">
                          <span>{s.parent_name || '—'}</span>
                          <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[10px] font-bold">
                            {s.parent_relation || 'Parent'}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{s.parent_contact || s.phone}</span>
                        </div>
                      </td>

                      {/* Address */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-3 max-w-xs truncate text-gray-500 text-[11px]"
                      >
                        {s.address || 'Kannamangala, Bangalore'}
                      </td>

                      {/* Enrolled Batches */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-3 text-center"
                      >
                        <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-bold text-[11px]">
                          <Layers className="w-3 h-3" />
                          <span>{s.enrolled_batches?.length || s.enrolled_batches_count || 0} Batches</span>
                        </span>
                      </td>

                      {/* Attendance % */}
                      <td 
                        onClick={() => setDetailStudent(s)}
                        className="py-3.5 px-3 text-center"
                      >
                        <span className={`font-bold ${
                          (s.attendance_rate || 0) >= 80 ? 'text-emerald-600' :
                          (s.attendance_rate || 0) >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {s.attendance_rate || 100}%
                        </span>
                      </td>

                      {/* Action Options */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Option 1: Edit Details */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEdit(s);
                            }}
                            className="p-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 transition shadow-2xs"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Option 2: View Timetable */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTimetableStudent(s);
                            }}
                            className="p-1.5 rounded-xl bg-[#FFF9FB] hover:bg-[#FCE7F3] text-[#8A064D] border border-[#F0D5E4] transition shadow-2xs"
                            title="View Timetable"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          {/* Option 3: Enroll in Batch */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEnrollStudentModal(s);
                              setSelectedBatchId(batches[0]?.id || '');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white font-bold text-[11px] transition flex items-center gap-1 shadow-xs"
                            title="Enroll in Batch"
                          >
                            <Plus className="w-3 h-3 text-[#F9E33A]" />
                            <span>Enroll</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* POPUP 1: SELECTED STUDENT FULL DETAILS MODAL */}
      {/* ===================================================================== */}
      {detailStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A064D] to-[#430928] text-white flex items-center justify-center font-black text-base shadow-md">
                  {detailStudent.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-[#2D041A]">{detailStudent.full_name}</h2>
                    <span className="font-mono text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-2.5 py-0.5 rounded-lg border border-rose-100">
                      {detailStudent.roll_number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Enrolled on {detailStudent.enrollment_date || '2026-01-15'} • Status: <strong className="text-emerald-600 capitalize">{detailStudent.status || 'Active'}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-[#FFF9FB] p-3 rounded-2xl border border-[#F0D5E4] text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Enrolled Batches</span>
                <span className="text-lg font-black text-[#8A064D]">
                  {detailStudent.enrolled_batches?.length || detailStudent.enrolled_batches_count || 0}
                </span>
              </div>
              <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-center">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block">Attendance Rate</span>
                <span className="text-lg font-black text-emerald-700">
                  {detailStudent.attendance_rate || 100}%
                </span>
              </div>
              <div className="bg-purple-50/60 p-3 rounded-2xl border border-purple-100 text-center">
                <span className="text-[10px] font-bold text-purple-700 uppercase block">Weekly Classes</span>
                <span className="text-lg font-black text-purple-700">
                  {(detailStudent.enrolled_batches || []).reduce((acc, b) => acc + (b.days_of_week?.length || 2), 0)} Sessions
                </span>
              </div>
              <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-center">
                <span className="text-[10px] font-bold text-amber-700 uppercase block">Fee Status</span>
                <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mt-1">
                  Active
                </span>
              </div>
            </div>

            {/* Personal & Parent / Guardian Dossier */}
            <div className="bg-gray-50/80 rounded-2xl p-4 border border-gray-200 mb-6 space-y-3 text-xs">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#8A064D]" />
                Personal & Guardian Profile
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Student / Parent Email</span>
                  <span className="font-semibold text-gray-900">{detailStudent.email}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Student Contact Phone</span>
                  <span className="font-semibold text-gray-900">{detailStudent.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Parent / Guardian Name & Relation</span>
                  <span className="font-bold text-gray-900">
                    {detailStudent.parent_name || 'Not Listed'}{' '}
                    <span className="text-[#8A064D] font-semibold">({detailStudent.parent_relation || 'Parent'})</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Guardian Emergency Contact</span>
                  <span className="font-semibold text-gray-900">{detailStudent.parent_contact || detailStudent.phone}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Full Residential Address</span>
                  <span className="font-medium text-gray-800">{detailStudent.address || 'Kannamangala, Doddabanahalli, Bangalore'}</span>
                </div>
              </div>
            </div>

            {/* Enrolled Batches & Gurus Table */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#8A064D]" />
                  Enrolled Batches & Assigned Gurus
                </h3>
                <button
                  onClick={() => {
                    setEnrollStudentModal(detailStudent);
                    setSelectedBatchId(batches[0]?.id || '');
                  }}
                  className="text-xs text-[#8A064D] hover:underline font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Enroll in Another Batch</span>
                </button>
              </div>

              {(detailStudent.enrolled_batches && detailStudent.enrolled_batches.length > 0) ? (
                <div className="space-y-2">
                  {detailStudent.enrolled_batches.map((eb, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-2xl bg-white border border-[#F0D5E4] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#2D041A]">{eb.course_title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#FFF2F8] text-[#8A064D] text-[10px] font-bold">
                            {eb.course_category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 font-medium mt-0.5">
                          {eb.batch_name}
                        </div>
                        <div className="text-[11px] text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                          <span className="font-semibold text-gray-800">Guru: {eb.trainer_name}</span>
                          <span>•</span>
                          <span>{(eb.days_of_week || []).join(', ')}</span>
                          <span>•</span>
                          <span>{eb.start_time?.slice(0, 5)} - {eb.end_time?.slice(0, 5)}</span>
                          <span>•</span>
                          <span className="text-[#8A064D]">{eb.room_or_hall}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-emerald-700">₹{eb.monthly_fee}/m</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl text-xs">
                  No active batch enrollments. Click above to enroll in a batch.
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(detailStudent);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => {
                    setTimetableStudent(detailStudent);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#8A064D] hover:bg-[#70043E] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>View Timetable</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: EDIT STUDENT DETAILS (OPTION 1) */}
      {/* ===================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Edit Student Information</h3>
                <p className="text-xs text-gray-500">Roll No: {editingStudent.roll_number}</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student Contact Phone</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* Parent / Guardian Name & Relation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editParentName}
                    onChange={(e) => setEditParentName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship to Student</label>
                  <select
                    value={editParentRelation}
                    onChange={(e) => setEditParentRelation(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                  >
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Relative">Relative</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Parent Contact */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Parent / Guardian Contact</label>
                <input
                  type="text"
                  value={editParentContact}
                  onChange={(e) => setEditParentContact(e.target.value)}
                  placeholder="+91 98450 12345"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Residential Address</label>
                <textarea
                  rows={2}
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="e.g. Flat 304, Prestige Willow, Kannamangala, Bangalore"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Status</label>
                <select
                  value={editStatus}
                  onChange={(e: any) => setEditStatus(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl font-medium"
                >
                  <option value="active">Active (Enrolled)</option>
                  <option value="inactive">Inactive (Temporarily on leave)</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{savingEdit ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: VIEW STUDENT TIMETABLE (OPTION 2) */}
      {/* ===================================================================== */}
      {timetableStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6 print:hidden">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#8A064D]" />
                  <h3 className="font-black text-lg text-[#2D041A]">Weekly Class Timetable</h3>
                </div>
                <p className="text-xs text-gray-500">
                  Student: <strong className="text-gray-900">{timetableStudent.full_name}</strong> ({timetableStudent.roll_number})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#8A064D] hover:bg-[#70043E] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>Print Timetable</span>
                </button>
                <button
                  onClick={() => setTimetableStudent(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div className="border border-[#F0D5E4] rounded-2xl p-5 bg-white space-y-4">
              
              {/* Academy Header for Print */}
              <div className="text-center pb-3 border-b border-rose-100">
                <h4 className="font-extrabold text-sm text-[#2D041A] uppercase tracking-wide">
                  Laasya Cultural Academy
                </h4>
                <p className="text-[10px] text-[#8A064D] font-bold">
                  ಲಾಸ್ಯ ಸಾಂಸ್ಕೃತಿಕ ಅಕಾಡೆಮಿ • Student Schedule & Class Timetable
                </p>
                <p className="text-[10px] text-gray-500">
                  Kannamangala Campus, Bangalore • Helpdesk: +91 8151 998 899
                </p>
              </div>

              {/* Student Name Banner */}
              <div className="flex justify-between items-center text-xs bg-[#FFF9FB] p-3 rounded-xl border border-rose-100">
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Learner</span>
                  <span className="font-bold text-gray-900 text-sm">{timetableStudent.full_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-bold uppercase block">Roll Number</span>
                  <span className="font-mono font-bold text-[#8A064D]">{timetableStudent.roll_number}</span>
                </div>
              </div>

              {/* Days breakdown: Monday to Sunday */}
              <div className="space-y-2.5 pt-2">
                {[
                  'Monday',
                  'Tuesday',
                  'Wednesday',
                  'Thursday',
                  'Friday',
                  'Saturday',
                  'Sunday'
                ].map((dayName) => {
                  // Find all batches that have this day in their schedule
                  const dayBatches = (timetableStudent.enrolled_batches || []).filter(b => {
                    const days = (b.days_of_week || []).map(d => d.toLowerCase());
                    return days.some(d => d.includes(dayName.toLowerCase().slice(0, 3)));
                  });

                  return (
                    <div 
                      key={dayName}
                      className={`p-3 rounded-xl border transition ${
                        dayBatches.length > 0 
                          ? 'bg-white border-[#F0D5E4] shadow-2xs' 
                          : 'bg-gray-50/50 border-gray-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          dayBatches.length > 0 ? 'text-[#8A064D]' : 'text-gray-400'
                        }`}>
                          {dayName}
                        </span>
                        {dayBatches.length > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            {dayBatches.length} Class Session(s)
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">No scheduled classes</span>
                        )}
                      </div>

                      {dayBatches.length > 0 && (
                        <div className="space-y-1.5 mt-2">
                          {dayBatches.map((b, bIdx) => (
                            <div 
                              key={bIdx}
                              className="bg-[#FFF9FB] p-2.5 rounded-lg border border-rose-100 flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-gray-900">{b.course_title}</span>
                                <span className="text-gray-500 block text-[11px]">{b.batch_name}</span>
                                <span className="text-[10px] text-[#8A064D] font-semibold mt-0.5 block">
                                  Guru: {b.trainer_name} • {b.room_or_hall}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 font-mono font-bold text-gray-800 bg-white px-2 py-1 rounded border border-gray-200 text-[11px]">
                                  <Clock className="w-3 h-3 text-[#8A064D]" />
                                  {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Close Button */}
            <div className="flex justify-end pt-4 mt-2 print:hidden">
              <button
                onClick={() => setTimetableStudent(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] text-white hover:bg-[#70043E] transition cursor-pointer"
              >
                Close Timetable
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: ENROLL IN BATCH MODAL (OPTION 3) */}
      {/* ===================================================================== */}
      {enrollStudentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Enroll Student in Batch</h3>
                <p className="text-xs text-gray-500">
                  Student: <strong className="text-gray-900">{enrollStudentModal.full_name}</strong> ({enrollStudentModal.roll_number})
                </p>
              </div>
              <button
                onClick={() => setEnrollStudentModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollBatch} className="space-y-4">
              
              {/* Existing Enrollments Warning */}
              {enrollStudentModal.enrolled_batches && enrollStudentModal.enrolled_batches.length > 0 && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs">
                  <span className="font-bold text-purple-900 block mb-1">Currently Enrolled In:</span>
                  <ul className="list-disc pl-4 space-y-0.5 text-purple-800 text-[11px]">
                    {enrollStudentModal.enrolled_batches.map((eb, idx) => (
                      <li key={idx}>
                        {eb.course_title} - {eb.batch_name} (Guru: {eb.trainer_name})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Select Batch */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Select New Batch & Guru <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                >
                  <option value="" disabled>-- Select Class Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.course_title} - {b.name} | Guru: {b.trainer_name} ({b.days_of_week?.join(', ')} @ {b.start_time?.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Highlight Card */}
              {selectedBatchId && (() => {
                const b = batches.find(x => x.id === selectedBatchId);
                if (!b) return null;
                return (
                  <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-[#F0D5E4] text-xs space-y-1">
                    <span className="font-bold text-[#8A064D] block">{b.course_title}</span>
                    <span className="font-semibold text-gray-800 block">{b.name}</span>
                    <div className="text-[11px] text-gray-600 flex items-center justify-between pt-1 border-t border-rose-100">
                      <span><strong>Guru:</strong> {b.trainer_name}</span>
                      <span><strong>Studio:</strong> {b.room_or_hall}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Schedule: {(b.days_of_week || []).join(', ')} ({b.start_time} - {b.end_time})
                    </div>
                  </div>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEnrollStudentModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEnroll || !selectedBatchId}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-[#F9E33A]" />
                  <span>{savingEnroll ? 'Enrolling...' : 'Confirm Enrollment'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: REGISTER NEW STUDENT (WITH RELATION PROMPT & MULTI-COURSE/BATCH) */}
      {/* ===================================================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 my-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-[#2D041A]">Register New Academy Student</h3>
                <p className="text-xs text-gray-500">
                  Student roll number will be generated automatically. Select courses and available batches below.
                </p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4 text-xs">
              
              {/* 1. Student Full Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navya Ramesh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* 2. Student / Parent Email & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Student / Parent Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student.parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 99000 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              {/* 3. Parent / Guardian Name (with relation prompt after entering) */}
              <div className="p-3.5 bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4] space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh S."
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>

                {/* AFTER ENTERING NAME: RELATION TO STUDENT PROMPT */}
                {parentName.trim().length > 0 && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-150 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-[#8A064D] mb-1">
                        Relation to Student <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={parentRelation}
                        onChange={(e) => setParentRelation(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-[#8A064D] rounded-xl text-xs font-bold text-[#8A064D] focus:ring-2 focus:ring-[#8A064D]"
                      >
                        <option value="Mother">Mother</option>
                        <option value="Father">Father</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Grandmother">Grandmother</option>
                        <option value="Grandfather">Grandfather</option>
                        <option value="Relative">Relative</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Parent / Guardian Contact <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="+91 99000 54321"
                        value={parentContact}
                        onChange={(e) => setParentContact(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 4. Full Address */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Full Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Flat 204, Green Acres, Doddabanahalli, Kannamangala, Bangalore - 560067"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              {/* 5. Select Course(s) [Multi-select] */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2D041A]">
                    Select Courses <span className="text-rose-500">*</span> (Select one or multiple)
                  </label>
                  <span className="text-[11px] text-gray-500">
                    {selectedCourseIds.length} course(s) selected
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {courses.map((c) => {
                    const isSelected = selectedCourseIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleToggleCourse(c.id)}
                        className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#8A064D] text-white border-[#8A064D] shadow-xs'
                            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <span className="font-bold block truncate">{c.title}</span>
                          <span className={`text-[10px] block truncate ${isSelected ? 'text-[#F9E33A]' : 'text-gray-500'}`}>
                            {c.category}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-1.5 ${
                          isSelected ? 'bg-white border-white' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-[#8A064D]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. Available Batches with Trainer / Guru Names (Appears when courses selected) */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#2D041A]">
                    Available Batches with Gurus
                  </label>
                  <span className="text-[11px] text-[#8A064D] font-bold">
                    {selectedBatchIds.length} batch(es) selected
                  </span>
                </div>

                {availableBatchesForSelectedCourses.length === 0 ? (
                  <div className="p-4 bg-gray-50 rounded-xl text-center text-gray-400 text-xs">
                    Please select at least one course above to view available batch schedules and Gurus.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {availableBatchesForSelectedCourses.map((b) => {
                      const isBatchSelected = selectedBatchIds.includes(b.id);
                      return (
                        <div
                          key={b.id}
                          onClick={() => handleToggleBatch(b.id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition flex items-center justify-between ${
                            isBatchSelected
                              ? 'bg-[#FFF9FB] border-[#8A064D] shadow-2xs'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">{b.name}</span>
                              <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">
                                {b.course_title}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#8A064D] font-bold mt-0.5">
                              Guru: {b.trainer_name}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {(b.days_of_week || []).join(', ')} • {b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)} ({b.room_or_hall})
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 ml-3 ${
                            isBatchSelected
                              ? 'bg-[#8A064D] border-[#8A064D] text-white'
                              : 'border-gray-300'
                          }`}>
                            {isBatchSelected && <Check className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingNew || selectedCourseIds.length === 0}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#F9E33A]" />
                  <span>{savingNew ? 'Registering...' : 'Complete Registration'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
