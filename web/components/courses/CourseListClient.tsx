'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Course } from '@/lib/academy';
import { 
  Search, 
  Plus, 
  Edit3, 
  Trash2,
  Eye,
  Calendar, 
  IndianRupee, 
  Check, 
  X,
  BookOpen,
  Sparkles,
  AlertCircle,
  Clock,
  Layers,
  Award,
  Tag,
  ChevronDown,
  FolderPlus,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  AlertTriangle,
  Image as ImageIcon,
  Upload,
  User,
  Lock
} from 'lucide-react';
import CourseImageUploadInput from '@/components/common/CourseImageUploadInput';

const COURSE_GURUS_MAP: Record<string, string> = {
  'Bharathanatyam': 'Smt. Anusha Sumesh (Founder & Guru)',
  'Kuchupudi': 'Guru Pramod T. Peethambaran',
  'Mohiniyatam': 'Guru Sruthy Ramesh',
  'Semi Classical': 'Guru Nandhana (Nandana Krishna)',
  'Western Dance': 'Guru Karthik R (Dhee / DKD)',
  'Zumba': 'Guru Ranjith Kumar S J',
  'Gymnastic': 'Guru Ranjith Kumar S J',
  'Carnatic Music': 'Shri H. Manikandan (Sangeetha Acharya)',
  'Violin': 'Guru Amos P Ovung (Director)',
  'Keyboard': 'Guru Shahil Patro (Trinity / RSL)',
  'Guitar': 'Guru Amos P Ovung (Director)',
  'Ukulele': 'Guru Shahil Patro',
  'Drawing': 'Guru Dipayan Sarkar (MFA Santiniketan)',
  'Art and Craft': 'Guru Dipayan Sarkar',
  'Kalari': 'Guru Vrushabh Prakash Owhal',
  'Karatte': 'Sensei Vijay Kumar Olekar (2nd Dan)',
  'Yoga': 'Acharya Sathish Kale (Yoga Acharya)',
  'Chess': 'Coach Sai Krishna (State Medalist)',
};

const DEFAULT_COURSE_IMAGES: Record<string, string> = {
  'Bharathanatyam': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Kuchupudi': 'https://images.unsplash.com/photo-1582234372722-50d7ccc30ebd?auto=format&fit=crop&w=800&q=80',
  'Mohiniyatam': 'https://images.unsplash.com/photo-1547153760-18fc86324498?auto=format&fit=crop&w=800&q=80',
  'Semi Classical': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
  'Western Dance': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Zumba': 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  'Gymnastic': 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
  'Carnatic Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Violin': 'https://images.unsplash.com/photo-1612225330812-01a9c6b355ec?auto=format&fit=crop&w=800&q=80',
  'Keyboard': 'https://images.unsplash.com/photo-1520523839898-50712140e698?auto=format&fit=crop&w=800&q=80',
  'Guitar': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Ukulele': 'https://images.unsplash.com/photo-1568219656418-15c329312bf1?auto=format&fit=crop&w=800&q=80',
  'Drawing': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Art and Craft': 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=800&q=80',
  'Kalari': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
  'Karatte': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Yoga': 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
  'Chess': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

const CATEGORY_DEFAULT_IMAGES: Record<string, string> = {
  'Classical Dance': 'https://images.unsplash.com/photo-1617196034183-421b4917c92d?auto=format&fit=crop&w=800&q=80',
  'Modern Dance & Fitness': 'https://images.unsplash.com/photo-1535525153412-5a42439a210d?auto=format&fit=crop&w=800&q=80',
  'Vocal & Music': 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
  'Musical Instruments': 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=800&q=80',
  'Martial Arts': 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=800&q=80',
  'Fine Arts': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80',
  'Mind Sports': 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80'
};

function getCourseImage(course: Course): string {
  if (course.image_url && course.image_url.trim()) {
    return course.image_url.trim();
  }
  if (DEFAULT_COURSE_IMAGES[course.title]) {
    return DEFAULT_COURSE_IMAGES[course.title];
  }
  if (course.category && CATEGORY_DEFAULT_IMAGES[course.category]) {
    return CATEGORY_DEFAULT_IMAGES[course.category];
  }
  return 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';
}

interface Props {
  initialCourses: Course[];
  initialCategories?: string[];
}

export default function CourseListClient({ initialCourses, initialCategories }: Props) {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Dynamic categories list initialized from DB & courses
  const defaultCategoryList = [
    'Classical Dance',
    'Modern Dance & Fitness',
    'Vocal & Music',
    'Musical Instruments',
    'Martial Arts',
    'Fine Arts',
    'Mind Sports'
  ];

  const [categories, setCategories] = useState<string[]>(() => {
    const set = new Set<string>([
      ...(initialCategories || []),
      ...defaultCategoryList,
      ...initialCourses.map(c => c.category).filter(Boolean)
    ]);
    return Array.from(set).sort();
  });

  // Searchable Category Dropdown state
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // New Category Modal State
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Delete Category Modal State
  const [deletingCategoryName, setDeletingCategoryName] = useState<string | null>(null);

  // Edit / Rename Category State
  const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null);
  const [renameCategoryInput, setRenameCategoryInput] = useState<string>('');
  const [renamingCategory, setRenamingCategory] = useState(false);

  // View Details Modal State
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);

  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editCategory, setEditCategory] = useState<string>('');
  const [editFee, setEditFee] = useState<number>(0);
  const [editDuration, setEditDuration] = useState<number>(12);
  const [editDesc, setEditDesc] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editIsActive, setEditIsActive] = useState<boolean>(true);
  const [isEditingNewCategory, setIsEditingNewCategory] = useState(false);
  const [customEditCategory, setCustomEditCategory] = useState('');

  // Add Course Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCategory, setNewCategory] = useState('Classical Dance');
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false);
  const [customNewCategory, setCustomNewCategory] = useState('');
  const [newFee, setNewFee] = useState(2000);
  const [newDuration, setNewDuration] = useState(12);
  const [newDesc, setNewDesc] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Delete Course Modal State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);

  // Status & Celebratory Toast
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showCelebratoryToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Close category dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
    }
    if (isCategoryDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCategoryDropdownOpen]);

  // Helper: check if a course has NO category
  const isCourseUncategorized = (c: Course): boolean => {
    return !c.category || c.category.trim() === '' || c.category.toLowerCase() === 'no category' || c.category.toLowerCase() === 'uncategorized';
  };

  // Count of courses without category
  const coursesWithoutCategoryCount = useMemo(() => {
    return courses.filter(isCourseUncategorized).length;
  }, [courses]);

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const isNoCat = isCourseUncategorized(c);
      
      let matchesCategory = true;
      if (selectedCategory === 'All') {
        matchesCategory = true;
      } else if (selectedCategory === 'No Category') {
        matchesCategory = isNoCat;
      } else {
        matchesCategory = c.category === selectedCategory;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        c.title.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.category && c.category.toLowerCase().includes(q)) ||
        (isNoCat && 'no category'.includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [courses, selectedCategory, searchQuery]);

  // Filtered categories for searchable dropdown
  const filteredDropdownCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categories;
    return categories.filter(cat => 
      cat.toLowerCase().includes(categorySearchQuery.toLowerCase().trim())
    );
  }, [categories, categorySearchQuery]);

  // Helper to generate next unique code
  const generateNextCourseCode = (courseList: Course[]) => {
    const codes = courseList.map(c => c.code).filter(Boolean);
    let maxNum = 0;
    for (const c of codes) {
      const match = c.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
    const nextNum = Math.max(maxNum + 1, courseList.length + 1);
    return `LCA-CRS-${String(nextNum).padStart(3, '0')}`;
  };

  const openAddModal = () => {
    setNewTitle('');
    setNewCode(generateNextCourseCode(courses));
    setNewCategory(categories[0] || 'Classical Dance');
    setIsCreatingNewCategory(false);
    setCustomNewCategory('');
    setNewFee(2000);
    setNewDuration(12);
    setNewDesc('');
    setNewImageUrl('');
    setIsAddOpen(true);
  };

  const openEditModal = (course: Course) => {
    setEditingCourse(course);
    setEditTitle(course.title);
    setEditCode(course.code);
    setEditCategory(course.category || '');
    setEditFee(Number(course.monthly_fee) || 0);
    setEditDuration(course.duration_months || 12);
    setEditDesc(course.description || '');
    setEditImageUrl(course.image_url || getCourseImage(course));
    setEditIsActive(course.is_active ?? true);
    setIsEditingNewCategory(false);
    setCustomEditCategory('');
  };

  // Add New Category (From Dedicated Button / Modal)
  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = newCategoryInput.trim();
    if (!catName) return;

    setSaving(true);
    try {
      const res = await fetch('/api/courses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catName })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }

      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      } else if (!categories.includes(catName)) {
        setCategories(prev => [...prev, catName].sort());
      }

      setIsAddCategoryOpen(false);
      setNewCategoryInput('');
      setSelectedCategory(catName);
      showCelebratoryToast(`Category "${catName}" created successfully!`);
    } catch (err: any) {
      alert(err.message || 'Error creating category');
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategoryName) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/courses/categories?name=${encodeURIComponent(deletingCategoryName)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete category');
      }

      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      } else {
        setCategories(prev => prev.filter(c => c !== deletingCategoryName));
      }

      // Update all courses in local state that had this category to have ''
      setCourses(prev => prev.map(c => {
        if (c.category === deletingCategoryName) {
          return { ...c, category: '' };
        }
        return c;
      }));

      // If viewing course had this category, update it
      if (viewingCourse && viewingCourse.category === deletingCategoryName) {
        setViewingCourse({ ...viewingCourse, category: '' });
      }

      // If current filter was this category, switch to 'No Category'
      if (selectedCategory === deletingCategoryName) {
        setSelectedCategory('No Category');
      }

      showCelebratoryToast(`Category "${deletingCategoryName}" deleted. Assigned courses marked as No Category.`);
      setDeletingCategoryName(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting category');
    } finally {
      setSaving(false);
    }
  };

  // Rename Category
  const handleRenameCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategoryName || !renameCategoryInput.trim()) return;
    const newName = renameCategoryInput.trim();
    if (newName === editingCategoryName) {
      setEditingCategoryName(null);
      return;
    }
    setRenamingCategory(true);
    try {
      const res = await fetch('/api/courses/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldName: editingCategoryName, newName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to rename category');

      setCategories(prev => prev.map(c => c === editingCategoryName ? newName : c).sort());
      setCourses(prev => prev.map(c => c.category === editingCategoryName ? { ...c, category: newName } : c));
      if (selectedCategory === editingCategoryName) {
        setSelectedCategory(newName);
      }
      setEditingCategoryName(null);
      showCelebratoryToast(`Category renamed to "${newName}" successfully!`);
    } catch (err: any) {
      alert(err.message || 'Error renaming category');
    } finally {
      setRenamingCategory(false);
    }
  };

  // Add Course
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const finalCategory = isCreatingNewCategory && customNewCategory.trim() 
        ? customNewCategory.trim() 
        : newCategory;

      if (isCreatingNewCategory && customNewCategory.trim()) {
        await fetch('/api/courses/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customNewCategory.trim() })
        }).catch(() => {});

        if (!categories.includes(customNewCategory.trim())) {
          setCategories(prev => [...prev, customNewCategory.trim()].sort());
        }
      }

      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          code: newCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(newFee),
          duration_months: Number(newDuration),
          description: newDesc.trim(),
          image_url: newImageUrl.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create course');
      }

      const added: Course = await res.json();
      setCourses(prev => [...prev, { ...added, batch_count: 0, image_url: newImageUrl.trim() || added.image_url }]);
      setIsAddOpen(false);
      showCelebratoryToast(`Course "${added.title}" (${added.code}) created successfully!`);
    } catch (e: any) {
      alert(e.message || 'Error creating course');
    } finally {
      setSaving(false);
    }
  };

  // Save Edit Course
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setSaving(true);

    try {
      const finalCategory = isEditingNewCategory && customEditCategory.trim()
        ? customEditCategory.trim()
        : editCategory;

      if (isEditingNewCategory && customEditCategory.trim()) {
        await fetch('/api/courses/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: customEditCategory.trim() })
        }).catch(() => {});

        if (!categories.includes(customEditCategory.trim())) {
          setCategories(prev => [...prev, customEditCategory.trim()].sort());
        }
      }

      const res = await fetch('/api/courses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCourse.id,
          title: editTitle.trim(),
          code: editCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(editFee),
          duration_months: Number(editDuration),
          description: editDesc.trim(),
          is_active: editIsActive,
          image_url: editImageUrl.trim() || undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update course');
      }

      const updated = await res.json();
      setCourses(prev =>
        prev.map(c =>
          c.id === editingCourse.id
            ? {
                ...c,
                title: editTitle.trim(),
                code: editCode.trim().toUpperCase(),
                category: finalCategory,
                monthly_fee: Number(editFee),
                duration_months: Number(editDuration),
                description: editDesc.trim(),
                is_active: editIsActive,
                image_url: editImageUrl.trim() || c.image_url
              }
            : c
        )
      );

      if (viewingCourse && viewingCourse.id === editingCourse.id) {
        setViewingCourse({
          ...viewingCourse,
          title: editTitle.trim(),
          code: editCode.trim().toUpperCase(),
          category: finalCategory,
          monthly_fee: Number(editFee),
          duration_months: Number(editDuration),
          description: editDesc.trim(),
          is_active: editIsActive,
          image_url: editImageUrl.trim() || viewingCourse.image_url
        });
      }

      setEditingCourse(null);
      showCelebratoryToast(`Course "${editTitle}" updated successfully!`);
    } catch (e: any) {
      alert(e.message || 'Error updating course');
    } finally {
      setSaving(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setSaving(true);

    try {
      const res = await fetch(`/api/courses?id=${deletingCourse.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete course');
      }

      setCourses(prev => prev.filter(c => c.id !== deletingCourse.id));
      if (viewingCourse && viewingCourse.id === deletingCourse.id) {
        setViewingCourse(null);
      }
      showCelebratoryToast(`Course "${deletingCourse.title}" deleted successfully.`);
      setDeletingCourse(null);
    } catch (e: any) {
      alert(e.message || 'Error deleting course');
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className="space-y-6">
      
      {/* ================================================================= */}
      {/* CELEBRATORY SUCCESS TOAST POPUP */}
      {/* ================================================================= */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-100 flex items-center gap-3 bg-white border border-emerald-200 px-5 py-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-emerald-950 uppercase tracking-wide">Action Successful</p>
            <p className="text-xs font-semibold text-emerald-800 mt-0.5">{toastMessage}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 p-1 rounded-lg text-emerald-600 hover:bg-emerald-50 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOP HEADER & SEARCH & ACTION BAR */}
      {/* ================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-[#F0D5E4] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-[#2D041A] tracking-tight">Course Curriculum & Catalog</h1>
              <span className="text-xs bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4] px-3.5 py-1 rounded-full font-bold shadow-2xs">
                Total Courses: {courses.length}
              </span>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-1">
              Configure course disciplines, monthly tuition fees, categories, assigned gurus, and syllabus.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* ADD COURSE BUTTON */}
            <button
              onClick={openAddModal}
              className="bg-[#8A064D] hover:bg-[#70043E] text-white px-5 py-2.5 rounded-2xl text-sm font-black shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#F9E33A]" />
              <span>Add Course</span>
            </button>
          </div>
        </div>

        {/* SEARCH AND FILTER BAR (REPLACES SUMMARY ROW) */}
        <div className="pt-4 border-t border-[#F0D5E4]/60 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by course, code, guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100/70 border border-[#F0D5E4] rounded-2xl text-sm font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
            />
          </div>

            {/* SEARCHABLE CATEGORIES DROPDOWN WITH DELETE BUTTON */}
            <div className="relative" ref={categoryDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                className={`px-4 py-2.5 rounded-2xl text-sm font-black transition flex items-center gap-2 border cursor-pointer ${
                  isCategoryDropdownOpen
                    ? 'bg-[#FFF2F8] border-[#8A064D] text-[#8A064D] shadow-xs'
                    : 'bg-white hover:bg-gray-50 border-[#F0D5E4] text-[#590231]'
                }`}
                title="Search and Manage Existing Categories"
              >
                <Tag className="w-4 h-4 text-[#8A064D]" />
                <span>Categories ({categories.length})</span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isCategoryDropdownOpen ? 'rotate-180 text-[#8A064D]' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isCategoryDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-[#F0D5E4] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 mb-3">
                    <span className="text-[11px] font-black uppercase text-[#590231] tracking-wider">Course Categories</span>
                    <span className="text-[10px] font-bold text-gray-400">{categories.length} Total</span>
                  </div>

                  {/* Search within categories */}
                  <div className="relative mb-3">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search categories..."
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D]"
                    />
                  </div>

                  {/* Categories List */}
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {/* All Categories Option */}
                    <div
                      onClick={() => {
                        setSelectedCategory('All');
                        setIsCategoryDropdownOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        selectedCategory === 'All' ? 'bg-[#FFF2F8] text-[#8A064D]' : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>All Categories</span>
                      <span className="text-[10px] bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">
                        {courses.length}
                      </span>
                    </div>

                    {/* Uncategorized Option if exists */}
                    {coursesWithoutCategoryCount > 0 && (
                      <div
                        onClick={() => {
                          setSelectedCategory('No Category');
                          setIsCategoryDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border border-red-300 ${
                          selectedCategory === 'No Category' ? 'bg-red-500 text-white border-red-600' : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                          <span>No Category</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          selectedCategory === 'No Category' ? 'bg-white/20 text-white' : 'bg-red-200 text-red-800'
                        }`}>
                          {coursesWithoutCategoryCount}
                        </span>
                      </div>
                    )}

                    {/* Dynamic categories from DB */}
                    {filteredDropdownCategories.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-3">No categories found matching "{categorySearchQuery}"</p>
                    ) : (
                      filteredDropdownCategories.map((cat) => {
                        const count = courses.filter(c => c.category === cat).length;
                        const isSelected = selectedCategory === cat;
                        return (
                          <div
                            key={cat}
                            className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                              isSelected ? 'bg-[#FFF2F8] text-[#8A064D]' : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div 
                              onClick={() => {
                                setSelectedCategory(cat);
                                setIsCategoryDropdownOpen(false);
                              }}
                              className="flex-1 flex items-center justify-between cursor-pointer mr-2"
                            >
                              <span className="truncate max-w-[150px]">{cat}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                isSelected ? 'bg-[#8A064D] text-white' : 'bg-gray-100 text-gray-500'
                              }`}>
                                {count}
                              </span>
                            </div>

                            {/* ACTION BUTTONS: EDIT & DELETE */}
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCategoryDropdownOpen(false);
                                  setEditingCategoryName(cat);
                                  setRenameCategoryInput(cat);
                                }}
                                className="p-1 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                                title={`Edit / Rename Category "${cat}"`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsCategoryDropdownOpen(false);
                                  setDeletingCategoryName(cat);
                                }}
                                className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                title={`Delete Category "${cat}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Box Type Button: + Add New Category */}
                  <div className="pt-3 mt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCategoryDropdownOpen(false);
                        setIsAddCategoryOpen(true);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-[#8A064D] text-[#8A064D] bg-[#FFF2F8] hover:bg-[#FFE6F2] font-black text-xs flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-[#8A064D]" />
                      <span>+ Add New Category</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* CATEGORIES ROW FILTER (WITH "NO CATEGORY" RED HIGHLIGHT BOUNDARIES) */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All Categories Pill */}
        <button
          onClick={() => setSelectedCategory('All')}
          className={`px-5 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
            selectedCategory === 'All'
              ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/60'
              : 'bg-white text-gray-700 border border-[#F0D5E4] hover:bg-gray-50'
          }`}
        >
          <span>All Disciplines</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
            selectedCategory === 'All' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
          }`}>
            {courses.length}
          </span>
        </button>

        {/* "NO CATEGORY" ROW FILTER PILL WITH RED HIGHLIGHT BOUNDARIES */}
        {coursesWithoutCategoryCount > 0 && (
          <button
            onClick={() => setSelectedCategory('No Category')}
            className={`px-5 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 border-2 border-red-500 shadow-sm ${
              selectedCategory === 'No Category'
                ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-400/50 shadow-md scale-102'
                : 'bg-red-50 text-red-700 hover:bg-red-100 ring-1 ring-red-300/40 animate-pulse'
            }`}
          >
            <AlertCircle className={`w-4 h-4 ${selectedCategory === 'No Category' ? 'text-white' : 'text-red-600'}`} />
            <span>No Category</span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-black ${
              selectedCategory === 'No Category' ? 'bg-white/20 text-white' : 'bg-red-200 text-red-900'
            }`}>
              {coursesWithoutCategoryCount}
            </span>
          </button>
        )}

        {/* Existing Categories Pills */}
        {categories.map((cat) => {
          const count = courses.filter(c => c.category === cat).length;
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-black whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? 'bg-[#8A064D] text-white shadow-md ring-2 ring-[#F9E33A]/60'
                  : 'bg-white text-gray-700 border border-[#F0D5E4] hover:bg-gray-50'
              }`}
            >
              <span>{cat}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}

        {/* Quick Add Category Pill */}
        <button
          onClick={() => setIsAddCategoryOpen(true)}
          className="px-4 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 text-[#8A064D] bg-[#FFF2F8] hover:bg-[#FFE6F2] border border-dashed border-[#8A064D]"
          title="Create a new category"
        >
          <Plus className="w-4 h-4" />
          <span>New Category</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* COURSES CARDS GRID */}
      {/* ================================================================= */}
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#F0D5E4] shadow-xs">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="font-black text-gray-800 text-base">No courses found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            {selectedCategory === 'No Category' 
              ? 'Great! There are currently no courses without a category.'
              : `No courses matching category "${selectedCategory}" or search query.`}
          </p>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-4 py-2 bg-[#8A064D] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#70043E] transition cursor-pointer"
            >
              View All Courses
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCourses.map((c) => {
            const hasNoCat = isCourseUncategorized(c);
            return (
              <div
                key={c.id}
                className={`bg-white rounded-3xl p-5 border shadow-xs hover:shadow-md transition flex flex-col justify-between group overflow-hidden ${
                  hasNoCat 
                    ? 'border-red-300 ring-1 ring-red-400/25 hover:border-red-500' 
                    : 'border-[#F0D5E4] hover:border-[#8A064D]/50'
                }`}
              >
                <div>
                  {/* Course Cover Image Banner */}
                  <div className="relative w-full h-44 overflow-hidden rounded-2xl bg-slate-100 mb-4 group/img">
                    <img
                      src={getCourseImage(c)}
                      alt={c.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30 pointer-events-none" />

                    {/* Overlaid Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
                      <span className="text-xs font-mono font-black text-white bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-xl shadow-xs border border-white/20">
                        {c.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {hasNoCat ? (
                          <span className="text-xs font-black text-red-100 bg-red-600/90 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1 shadow-xs border border-red-400">
                            <AlertCircle className="w-3.5 h-3.5 text-white" />
                            <span>No Category</span>
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-white bg-[#8A064D]/90 backdrop-blur-md px-3 py-1 rounded-full shadow-xs border border-white/20">
                            {c.category}
                          </span>
                        )}

                        {c.is_active === false && (
                          <span className="text-xs font-bold text-amber-200 bg-amber-950/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-amber-400/30">
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Title (Serif Font) */}
                  <h3 className="font-serif text-xl font-black text-[#2D041A] group-hover:text-[#8A064D] transition-colors leading-snug tracking-tight">
                    {c.title}
                  </h3>

                  {/* Guru Name (Sans Font, Avatar, No 'Assigned Guru' text) */}
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D] shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-sans text-xs md:text-sm font-bold text-[#8A064D] truncate">
                      {COURSE_GURUS_MAP[c.title] || 'Senior Faculty Guru'}
                    </span>
                  </div>

                  {/* Uncategorized Warning note if applicable */}
                  {hasNoCat && (
                    <div className="mt-3 p-2 bg-red-50/90 rounded-xl border border-red-200 text-xs text-red-800 font-semibold flex items-center justify-between">
                      <span>⚠️ Category not assigned</span>
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="text-red-700 font-black hover:underline text-xs cursor-pointer"
                      >
                        Set Category →
                      </button>
                    </div>
                  )}
                </div>

                {/* Bottom Meta & Action Buttons */}
                <div className="mt-5 pt-4 border-t border-[#F0D5E4]/60 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#6E3955] uppercase font-black tracking-wider block">Monthly Fee</span>
                    <span className="text-lg font-black text-[#8A064D] flex items-center tabular-nums">
                      ₹{Number(c.monthly_fee).toLocaleString('en-IN')}
                      <span className="text-xs font-bold text-[#6E3955] ml-1">/ mo</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <button
                      onClick={() => setViewingCourse(c)}
                      title="View Complete Course Details"
                      className="px-3.5 py-2 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-2xs border border-[#48082B]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                      <span>Details</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEditModal(c)}
                      title="Edit Course Details"
                      className="p-2 rounded-xl bg-[#FFF5F9] border border-[#E8BFD5] hover:bg-[#FCE7F3] text-[#8A064D] transition cursor-pointer shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingCourse(c)}
                      title="Delete Course"
                      className="p-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================================================================= */}
      {/* 1. VIEW DETAILS MODAL */}
      {/* ================================================================= */}
      {viewingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Modal Image Header Banner */}
            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 bg-slate-100">
              <img
                src={getCourseImage(viewingCourse)}
                alt={viewingCourse.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />
              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                <span className="text-[10px] font-mono font-black text-white bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/20">
                  {viewingCourse.code}
                </span>
                <h3 className="font-serif font-black text-2xl text-white mt-1 leading-tight drop-shadow-sm">
                  {viewingCourse.title}
                </h3>
              </div>
              <button
                onClick={() => setViewingCourse(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-[#8A064D] text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-white/20"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div>
                <span className="text-xs font-semibold text-gray-500">Category:</span>
                {isCourseUncategorized(viewingCourse) ? (
                  <span className="ml-2 text-[11px] font-black text-red-700 bg-red-50 border-2 border-red-500 px-2.5 py-0.5 rounded-full">
                    ⚠️ No Category
                  </span>
                ) : (
                  <span className="ml-2 text-xs font-bold text-[#8A064D] bg-[#FFF2F8] px-3 py-1 rounded-full border border-rose-100">
                    {viewingCourse.category}
                  </span>
                )}
              </div>
              <span className={`font-black px-2.5 py-0.5 rounded-full text-[11px] ${
                viewingCourse.is_active !== false 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {viewingCourse.is_active !== false ? 'Active & Open' : 'Inactive'}
              </span>
            </div>

            <div className="space-y-4">
              {/* Highlight Grid */}
              <div className="bg-[#FFF9FB] p-3.5 rounded-2xl border border-rose-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black text-[#590231] uppercase tracking-wider block">Monthly Tuition Fee</span>
                  <span className="text-lg font-black text-[#8A064D] mt-0.5 flex items-center">
                    ₹{Number(viewingCourse.monthly_fee).toLocaleString('en-IN')}
                    <span className="text-xs font-bold text-gray-500 ml-1">/ month</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Status</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                    {viewingCourse.is_active !== false ? 'Active Academic Course' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Guru & Batches Info */}
              <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-500">Assigned Faculty Guru</span>
                  <span className="font-black text-[#1A010F]">{COURSE_GURUS_MAP[viewingCourse.title] || 'Senior Faculty'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-500">Active Batches</span>
                  <span className="font-black text-[#8A064D] bg-[#FFF2F8] px-2 py-0.5 rounded-md">
                    {viewingCourse.batch_count || 1} Batch{(viewingCourse.batch_count || 1) > 1 ? 'es' : ''} Running
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-500">Status</span>
                  <span className={`font-black px-2 py-0.5 rounded-md text-[11px] ${
                    viewingCourse.is_active !== false 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {viewingCourse.is_active !== false ? 'Active & Open for Admission' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Full Description */}
              <div>
                <label className="text-xs font-black text-[#590231] uppercase tracking-wide block mb-1.5">
                  Complete Course Syllabus & Description
                </label>
                <div className="bg-[#FFF9FB] p-4 rounded-2xl border border-rose-100/70 text-xs font-medium text-gray-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                  {viewingCourse.description || 'No detailed syllabus text provided.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    const c = viewingCourse;
                    setViewingCourse(null);
                    setDeletingCourse(c);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-black text-rose-600 hover:bg-rose-50 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Course</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setViewingCourse(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const c = viewingCourse;
                      setViewingCourse(null);
                      openEditModal(c);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Course Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 2. EDIT COURSE MODAL */}
      {/* ================================================================= */}
      {editingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-[#2D041A]">Edit Course: {editingCourse.title}</h3>
                <p className="text-xs font-medium text-gray-500">Modify course title, code, category, syllabus, and fee.</p>
              </div>
              <button
                onClick={() => setEditingCourse(null)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#590231] text-slate-500 hover:text-white border border-slate-200 hover:border-[#590231] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Course Code</span>
                    <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400" />
                      <span>Locked</span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/90 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 select-none">
                    <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="tracking-wide">{editCode}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wider font-extrabold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-md">
                      Read-Only
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Dropdown + Add New Option */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide">
                    Category *
                  </label>
                  {!editCategory && (
                    <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-300 px-2 py-0.2 rounded-md">
                      ⚠️ Currently No Category
                    </span>
                  )}
                </div>

                {!isEditingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsEditingNewCategory(true);
                        } else {
                          setEditCategory(e.target.value);
                        }
                      }}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] ${
                        !editCategory ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                      }`}
                    >
                      <option value="">-- No Category (Unassigned) --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">➕ Create New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Enter new category name..."
                      value={customEditCategory}
                      onChange={(e) => setCustomEditCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#8A064D] rounded-xl text-xs font-bold text-[#1A010F] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customEditCategory.trim()) {
                          setEditCategory(customEditCategory.trim());
                          if (!categories.includes(customEditCategory.trim())) {
                            setCategories(prev => [...prev, customEditCategory.trim()].sort());
                          }
                          setIsEditingNewCategory(false);
                          setCustomEditCategory('');
                        }
                      }}
                      className="px-3 py-2 bg-[#8A064D] text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingNewCategory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Course Image Upload & Interactive Framing Studio */}
              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
                <CourseImageUploadInput
                  value={editImageUrl}
                  onChange={(url) => setEditImageUrl(url || '')}
                  label="Course Cover Image (Upload Only)"
                  maxSizeMB={5}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Monthly Fee (INR ₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={editFee}
                  onChange={(e) => setEditFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Course Description & Curriculum Details
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                <div>
                  <span className="text-xs font-black text-[#590231] block">Course Active Status</span>
                  <span className="text-[10px] text-gray-500 font-medium">Inactive courses won't appear in public admissions</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8A064D]"></div>
                </label>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 3. ADD NEW COURSE MODAL */}
      {/* ================================================================= */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h3 className="font-black text-lg text-[#2D041A]">Add New Academy Course</h3>
                <p className="text-xs font-medium text-gray-500">Unique course code generated automatically.</p>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#590231] text-slate-500 hover:text-white border border-slate-200 hover:border-[#590231] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kathak Classical"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5 flex items-center justify-between">
                    <span>Course Code</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>Auto-Assigned</span>
                    </span>
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100/90 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-600 select-none">
                    <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="tracking-wide">{newCode}</span>
                    <span className="ml-auto text-[9px] uppercase tracking-wider font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      System ID
                    </span>
                  </div>
                </div>
              </div>

              {/* Category Dropdown + Add New Option */}
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Category *
                </label>
                {!isCreatingNewCategory ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newCategory}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingNewCategory(true);
                        } else {
                          setNewCategory(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D]"
                    >
                      <option value="">-- No Category (Unassigned) --</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__NEW__">➕ Create New Category...</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type new category (e.g. Heritage Crafts)..."
                      value={customNewCategory}
                      onChange={(e) => setCustomNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#8A064D] rounded-xl text-xs font-bold text-[#1A010F] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customNewCategory.trim()) {
                          setNewCategory(customNewCategory.trim());
                          if (!categories.includes(customNewCategory.trim())) {
                            setCategories(prev => [...prev, customNewCategory.trim()].sort());
                          }
                          setIsCreatingNewCategory(false);
                          setCustomNewCategory('');
                        }
                      }}
                      className="px-3 py-2 bg-[#8A064D] text-white rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      Set
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewCategory(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-xl"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Course Image Upload & Interactive Framing Studio */}
              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-200">
                <CourseImageUploadInput
                  value={newImageUrl}
                  onChange={(url) => setNewImageUrl(url || '')}
                  label="Course Cover Image (Upload Only)"
                  maxSizeMB={5}
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Monthly Fee (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={newFee}
                  onChange={(e) => setNewFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Course Description & Curriculum
                </label>
                <textarea
                  rows={3}
                  placeholder="Complete description of the course syllabus, target age, prerequisites..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:ring-2 focus:ring-[#8A064D]"
                />
              </div>

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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating Course...' : 'Save & Publish Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4. NEW CATEGORY MODAL */}
      {/* ================================================================= */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#F0D5E4] animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF2F8] text-[#8A064D] flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2D041A]">Add New Category</h3>
                  <p className="text-[11px] font-medium text-gray-500">Create a new discipline grouping</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#590231] text-slate-500 hover:text-white border border-slate-200 hover:border-[#590231] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Theatre Arts, Folk Lore, Calligraphy..."
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#1A010F] placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddCategoryOpen(false);
                    setNewCategoryInput('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newCategoryInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 4.5 EDIT / RENAME CATEGORY MODAL */}
      {/* ================================================================= */}
      {editingCategoryName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#2D041A]">Rename Category</h3>
                  <p className="text-xs text-gray-500">Update category discipline name</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategoryName(null)}
                className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#590231] uppercase tracking-wide mb-1.5">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={renameCategoryInput}
                  onChange={(e) => setRenameCategoryInput(e.target.value)}
                  placeholder="e.g. Classical Dance"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-[#1A010F] focus:ring-2 focus:ring-[#8A064D] focus:bg-white transition"
                  autoFocus
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900">
                💡 Renaming will automatically update all existing courses and batches currently linked to this category.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategoryName(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={renamingCategory || !renameCategoryInput.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-[#8A064D] hover:bg-[#70043E] text-white shadow-md transition disabled:opacity-50 cursor-pointer"
                >
                  {renamingCategory ? 'Saving...' : 'Save Name'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 5. DELETE CATEGORY CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {deletingCategoryName && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-[#2D041A]">Delete Category</h3>
                <p className="text-xs font-bold text-rose-600">{deletingCategoryName}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete category <strong className="text-gray-900">"{deletingCategoryName}"</strong>?
            </p>
            <div className="mt-3 p-3 bg-red-50 rounded-2xl border border-red-200 text-xs font-semibold text-red-800">
              ⚠️ Note: Existing courses in this category will NOT be deleted, but will have their category removed and be marked as <strong>"No Category"</strong> with red highlight boundaries.
            </div>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingCategoryName(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* 6. DELETE COURSE CONFIRMATION MODAL */}
      {/* ================================================================= */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2.5 bg-rose-50 rounded-2xl">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-black text-base text-[#2D041A]">Confirm Course Deletion</h3>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900">{deletingCourse.title}</strong> ({deletingCourse.code})? 
              This will remove all associated batches and class session records under this course.
            </p>

            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setDeletingCourse(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleDeleteCourse}
                className="px-5 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {saving ? 'Deleting...' : 'Yes, Delete Course'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
