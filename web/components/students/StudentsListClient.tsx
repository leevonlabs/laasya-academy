'use client';

import React, { useState } from 'react';
import { Student, Batch } from '@/lib/academy';
import { 
  GraduationCap, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  UserCheck, 
  X,
  Calendar,
  Layers
} from 'lucide-react';

interface Props {
  initialStudents: Student[];
  batches: Batch[];
}

export default function StudentsListClient({ initialStudents, batches }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [enrollStudentModal, setEnrollStudentModal] = useState<Student | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // New Student Form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [parentName, setParentName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const filteredStudents = students.filter(s =>
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.parent_name && s.parent_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          parent_name: parentName,
          emergency_contact: emergencyContact || phone
        })
      });

      if (res.ok) {
        const added = await res.json();
        setStudents(prev => [...prev, {
          ...added,
          full_name: fullName,
          email,
          phone,
          enrolled_batches_count: 0,
          attendance_rate: 100
        }]);
        setIsAddOpen(false);
        setFullName('');
        setEmail('');
        setPhone('');
        setParentName('');
        setEmergencyContact('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleEnrollBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollStudentModal || !selectedBatchId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/students/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: enrollStudentModal.id,
          batchId: selectedBatchId
        })
      });

      if (res.ok) {
        setStudents(prev =>
          prev.map(s =>
            s.id === enrollStudentModal.id
              ? { ...s, enrolled_batches_count: (s.enrolled_batches_count || 0) + 1 }
              : s
          )
        );
        setEnrollStudentModal(null);
        setSelectedBatchId('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2D041A] flex items-center gap-2">
            <span>Student Roster</span>
            <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-2.5 py-0.5 rounded-full font-semibold">
              {students.length} Learners
            </span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Student registrations, assigned batch timetables, and individual attendance percentages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by student name, roll no, parent..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-[#F0D5E4] rounded-xl text-xs w-72 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
            />
          </div>

          <button
            onClick={() => setIsAddOpen(true)}
            className="bg-[#8A064D] hover:bg-[#70043E] text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#F9E33A]" />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFF9FB] border-b border-[#F0D5E4] text-[11px] font-bold uppercase tracking-wider text-[#8A064D]">
                <th className="py-4 px-6">Roll Number</th>
                <th className="py-4 px-6">Student Details</th>
                <th className="py-4 px-6">Parent / Guardian</th>
                <th className="py-4 px-6 text-center">Enrolled Batches</th>
                <th className="py-4 px-6 text-center">Attendance %</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-gray-400">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FFFDFC] transition">
                    
                    {/* Roll Number */}
                    <td className="py-4 px-6 font-mono font-bold text-[#8A064D]">
                      <span className="bg-[#FFF2F8] border border-rose-100 px-2.5 py-1 rounded-lg">
                        {s.roll_number}
                      </span>
                    </td>

                    {/* Student Name & Email */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-[#2D041A]">{s.full_name}</div>
                      <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span>{s.email}</span>
                      </div>
                    </td>

                    {/* Parent Name & Phone */}
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-800">{s.parent_name || '—'}</div>
                      <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span>{s.phone}</span>
                      </div>
                    </td>

                    {/* Enrolled Batches Count */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">
                        <Layers className="w-3 h-3" />
                        {s.enrolled_batches_count || 0} Classes
                      </span>
                    </td>

                    {/* Attendance Percentage */}
                    <td className="py-4 px-6 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className={`font-bold ${
                          (s.attendance_rate || 0) >= 80 ? 'text-emerald-600' :
                          (s.attendance_rate || 0) >= 60 ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                          {s.attendance_rate || 100}%
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => {
                          setEnrollStudentModal(s);
                          setSelectedBatchId(batches[0]?.id || '');
                        }}
                        className="bg-[#FFF9FB] hover:bg-[#8A064D] hover:text-white text-[#8A064D] border border-[#F0D5E4] px-3 py-1.5 rounded-xl font-semibold text-xs transition cursor-pointer"
                      >
                        + Enroll in Batch
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Register New Student</h3>
                <p className="text-xs text-gray-500">Student roll number will be generated automatically.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Navya Reddy"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Student / Parent Email</label>
                  <input
                    type="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 99000 12345"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    placeholder="e.g. S. Ramanathan"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    placeholder="+91 99000 54321"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Registering...' : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enroll in Batch Modal */}
      {enrollStudentModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-bold text-base text-[#2D041A]">Enroll Student in Batch</h3>
                <p className="text-xs text-gray-500">Student: {enrollStudentModal.full_name} ({enrollStudentModal.roll_number})</p>
              </div>
              <button
                onClick={() => setEnrollStudentModal(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Batch</label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-[#8A064D]"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.course_title}) - {b.trainer_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEnrollStudentModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
