'use client';

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  X, 
  Calendar, 
  DollarSign, 
  Tag, 
  CreditCard, 
  Building, 
  FileText, 
  History, 
  Edit3, 
  Trash2, 
  Paperclip, 
  CheckCircle2, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Download,
  Eye,
  FileCheck,
  User,
  Hash
} from 'lucide-react';
import { Expense, ExpenseSummary, ExpenseAuditLog } from '@/lib/expenses';
import DateRangeQuickFilter from '@/components/common/DateRangeQuickFilter';

interface CategoryItem {
  id: string;
  name: string;
  is_custom: boolean;
}

interface Props {
  initialExpenses: Expense[];
  initialSummary: ExpenseSummary;
  categories: CategoryItem[];
}

export default function ExpensesClient({ initialExpenses, initialSummary, categories: initialCategories }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);

  // Default to Current Month for Date Range and Top Summary
  const { defaultStartDate, defaultEndDate } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const start = new Date(y, m, 1).toISOString().split('T')[0];
    const end = new Date(y, m + 1, 0).toISOString().split('T')[0];
    return { defaultStartDate: start, defaultEndDate: end };
  }, []);

  // Filters state - Default to Current Month
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [searchQuery, setSearchQuery] = useState('');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailsExpense, setDetailsExpense] = useState<Expense | null>(null);
  const [detailsLogs, setDetailsLogs] = useState<ExpenseAuditLog[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Custom Category Add State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state - Clean, no prefilled values in cells for new expense
  const [formData, setFormData] = useState({
    expense_date: '',
    category: '',
    description: '',
    amount: '',
    payment_method: '' as 'Cash' | 'UPI' | 'Bank transfer' | 'Other' | '',
    vendor: '',
    reference_number: '',
    attachment_name: '',
    attachment_url: ''
  });

  // Validation errors beside fields
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Notification Toast state (Only shown after action is confirmed)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (exp.is_deleted) return false;

      // General Search match (description, reference, category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchRef = (exp.reference_number || '').toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        const matchVen = (exp.vendor || '').toLowerCase().includes(q);
        if (!matchDesc && !matchRef && !matchCat && !matchVen) return false;
      }

      // Dedicated Vendor Column Search
      if (vendorSearchQuery.trim()) {
        const vq = vendorSearchQuery.toLowerCase();
        const matchVendor = (exp.vendor || '').toLowerCase().includes(vq);
        if (!matchVendor) return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Method filter
      if (selectedMethod !== 'all' && exp.payment_method !== selectedMethod) {
        return false;
      }

      // Date range filter
      if (startDate && exp.expense_date < startDate) {
        return false;
      }
      if (endDate && exp.expense_date > endDate) {
        return false;
      }

      return true;
    });
  }, [expenses, searchQuery, vendorSearchQuery, selectedCategory, selectedMethod, startDate, endDate]);

  // Dynamic summary based on filtered records (Current month by default)
  const dynamicSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;
    return {
      totalAmount: total,
      expenseCount: count
    };
  }, [filteredExpenses]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredExpenses.slice(start, start + itemsPerPage);
  }, [filteredExpenses, currentPage]);

  const hasActiveFilters = Boolean(
    searchQuery || 
    vendorSearchQuery ||
    selectedCategory !== 'all' || 
    selectedMethod !== 'all' || 
    startDate !== defaultStartDate || 
    endDate !== defaultEndDate
  );

  const clearFilters = () => {
    setSearchQuery('');
    setVendorSearchQuery('');
    setSelectedCategory('all');
    setSelectedMethod('all');
    setStartDate(defaultStartDate);
    setEndDate(defaultEndDate);
    setCurrentPage(1);
  };

  // Open add modal with NO PREFILLED DETAILS in any cell
  const openAddModal = () => {
    setFormData({
      expense_date: '',
      category: '',
      description: '',
      amount: '',
      payment_method: '',
      vendor: '',
      reference_number: '',
      attachment_name: '',
      attachment_url: ''
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open edit modal (loads existing record details)
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      expense_date: exp.expense_date ? exp.expense_date.split('T')[0] : '',
      category: exp.category || '',
      description: exp.description || '',
      amount: String(exp.amount || ''),
      payment_method: exp.payment_method as any,
      vendor: exp.vendor || '',
      reference_number: exp.reference_number || '',
      attachment_name: exp.attachment_name || '',
      attachment_url: exp.attachment_url || ''
    });
    setFormErrors({});
  };

  // View Details Modal (Includes full description and audit change history)
  const openDetailsModal = async (exp: Expense) => {
    setDetailsExpense(exp);
    setIsDetailsLoading(true);
    try {
      const res = await fetch(`/api/expenses/${exp.id}/history`);
      const json = await res.json();
      if (json.success && json.history) {
        setDetailsLogs(json.history);
      } else {
        setDetailsLogs([]);
      }
    } catch {
      setDetailsLogs([]);
    } finally {
      setIsDetailsLoading(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setFormErrors(prev => ({ ...prev, attachment: 'File size must be under 2 MB' }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        attachment_name: file.name,
        attachment_url: URL.createObjectURL(file)
      }));
      setFormErrors(prev => {
        const copy = { ...prev };
        delete copy.attachment;
        return copy;
      });
    }
  };

  // Handle Custom Category Add
  const handleAddCustomCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/expenses/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });
      const data = await res.json();
      if (data.success && data.category) {
        setCategories(prev => [...prev, data.category]);
        setFormData(prev => ({ ...prev, category: data.category.name }));
        setNewCategoryName('');
        setShowAddCategory(false);
        showToast(`Category "${data.category.name}" added successfully`);
      } else {
        alert(data.error || 'Failed to add category');
      }
    } catch {
      alert('Network error while adding category');
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.category || !formData.category.trim()) {
      errors.category = 'Please select a category';
    }
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Description is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.expense_date) {
      errors.expense_date = 'Date is required';
    }
    if (!formData.payment_method) {
      errors.payment_method = 'Please select a payment method';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add Expense
  const handleSubmitAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      const json = await res.json();
      if (json.success && json.expense) {
        setExpenses(prev => [json.expense, ...prev]);
        setIsAddModalOpen(false);
        showToast('Expense recorded successfully! Action confirmed.');
      } else {
        showToast(json.error || 'Failed to record expense', 'error');
      }
    } catch {
      showToast('Network error while saving expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Expense
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });
      const json = await res.json();
      if (json.success && json.expense) {
        setExpenses(prev => prev.map(item => item.id === editingExpense.id ? json.expense : item));
        setEditingExpense(null);
        showToast('Expense updated and change history recorded!');
      } else {
        showToast(json.error || 'Failed to update expense', 'error');
      }
    } catch {
      showToast('Network error while updating expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete / Remove
  const handleConfirmDelete = async () => {
    if (!deletingExpense) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/expenses/${deletingExpense.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setExpenses(prev => prev.filter(item => item.id !== deletingExpense.id));
        setDeletingExpense(null);
        showToast('Expense marked as removed and archived in audit logs.');
      } else {
        showToast(json.error || 'Failed to remove expense', 'error');
      }
    } catch {
      showToast('Network error while removing expense', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border text-white transition-all transform animate-in slide-in-from-bottom duration-300 ${
          toastMessage.type === 'success' 
            ? 'bg-[#590231] border-[#F9E33A] text-white' 
            : 'bg-red-700 border-red-400'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-6 h-6 text-[#F9E33A] shrink-0" />
          ) : (
            <AlertTriangle className="w-6 h-6 text-white shrink-0" />
          )}
          <span className="font-bold text-sm tracking-wide">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#F0D5E4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-[#590231] tracking-tight">
                Academy Expenses & Spending
              </h1>
              <p className="text-sm font-semibold text-gray-500">
                Record, review, and audit all academy expenditures in one centralized ledger
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-base shadow-lg hover:shadow-xl transition-all border border-[#F9E33A]/60 cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5 text-[#F9E33A]" />
          <span>Record New Expense</span>
        </button>
      </div>

      {/* Top Summary Cards (Current Month By Default, Top Category Card Removed) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        
        {/* Total This Period / Current Month */}
        <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-6 border border-[#F0D5E4]/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFF2F8] rounded-bl-full -z-0 opacity-70" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider">
              {startDate === defaultStartDate && endDate === defaultEndDate 
                ? 'Total Spent This Month' 
                : 'Total Spent in Selected Period'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-[#590231] tracking-tight relative z-10 tabular-nums">
            ₹{dynamicSummary.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-xs font-semibold text-[#6E3955] mt-2 relative z-10">
            {startDate === defaultStartDate && endDate === defaultEndDate 
              ? 'Current month total expenditure summary' 
              : `Aggregated spending from ${startDate || 'start'} to ${endDate || 'present'}`}
          </p>
        </div>

        {/* Count of Expenses / Current Month */}
        <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-6 border border-[#F0D5E4]/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-[#FFF2F8] rounded-bl-full -z-0 opacity-70" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider">
              {startDate === defaultStartDate && endDate === defaultEndDate 
                ? 'Expense Count This Month' 
                : 'Expense Count in Selected Period'}
            </span>
            <div className="p-2.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-[#590231] tracking-tight relative z-10 tabular-nums">
            {dynamicSummary.expenseCount}
          </div>
          <p className="text-xs font-semibold text-[#6E3955] mt-2 relative z-10">
            {dynamicSummary.expenseCount === 1 
              ? '1 expense record logged' 
              : `${dynamicSummary.expenseCount} expense records logged`}
          </p>
        </div>

      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        
        {/* Row 1: Search Inputs (Dedicated Vendor Search + General Search) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Vendor Search Bar (Dedicated per User Request) */}
          <div className="relative">
            <Building className="w-4 h-4 text-[#8A064D] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={vendorSearchQuery}
              onChange={(e) => {
                setVendorSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Vendor..."
              className="w-full pl-11 pr-8 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D] focus:ring-1 focus:ring-[#8A064D] placeholder-gray-400"
            />
            {vendorSearchQuery && (
              <button 
                onClick={() => setVendorSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* General Keyword Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search description, ref, cat..."
              className="w-full pl-11 pr-8 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D] focus:ring-1 focus:ring-[#8A064D] placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank transfer">Bank transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        {/* Row 2: Regular Date Range Quick Filter (Current Month by Default) & Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0D5E4]/60">
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Date Period:
            </span>
            {/* Our Regular Date Range Quick Filter Component */}
            <DateRangeQuickFilter
              startDate={startDate}
              endDate={endDate}
              align="left"
              onApply={({ startDate: s, endDate: e }) => {
                setStartDate(s);
                setEndDate(e);
                setCurrentPage(1);
              }}
              placeholder="Select Date Range"
            />
          </div>

          {/* Active Filters Badges & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Filters applied</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-black transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset to Current Month</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Expense List Table (Description column is hidden from table) */}
      <div className="bg-white rounded-3xl border border-[#F0D5E4] shadow-xs overflow-hidden">
        
        {filteredExpenses.length === 0 ? (
          /* Empty State */
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#FFF2F8] border border-[#F0D5E4] flex items-center justify-center text-[#8A064D]">
              <Receipt className="w-8 h-8" />
            </div>
            <div className="max-w-md">
              <h3 className="text-lg font-black text-[#590231]">
                {hasActiveFilters 
                  ? 'No expenses match the selected filters.' 
                  : 'No expenses recorded yet. Record your first expense.'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveFilters 
                  ? 'Try expanding your date range or clearing search criteria to view records.' 
                  : 'Keep your academy accounts clear and compliant by logging your expenditures.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#590231] transition cursor-pointer"
              >
                Reset filters to current month
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="px-6 py-3 rounded-2xl bg-[#8A064D] text-white text-sm font-bold hover:bg-[#590231] shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#F9E33A]" />
                <span>Record your first expense</span>
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF2F8] text-[#590231] border-b border-[#F0D5E4] text-xs font-black uppercase tracking-wider">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Vendor</th>
                    <th className="py-4 px-5">Method</th>
                    <th className="py-4 px-5 text-right">Amount</th>
                    <th className="py-4 px-4 text-center">Attachment</th>
                    <th className="py-4 px-5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0D5E4]/60 text-sm">
                  {paginatedExpenses.map((exp) => {
                    const dateFormatted = exp.expense_date 
                      ? new Date(exp.expense_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
                      : '—';

                    return (
                      <tr key={exp.id} className="hover:bg-[#FFF9FB] transition">
                        
                        {/* Date */}
                        <td className="py-4 px-5 font-bold text-gray-700 whitespace-nowrap tabular-nums">
                          {dateFormatted}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
                            {exp.category}
                          </span>
                        </td>

                        {/* Vendor */}
                        <td className="py-4 px-5 font-semibold text-gray-800 whitespace-nowrap">
                          {exp.vendor ? (
                            <span className="inline-flex items-center gap-1.5 font-bold text-gray-800">
                              <Building className="w-3.5 h-3.5 text-[#8A064D]" />
                              {exp.vendor}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">None</span>
                          )}
                        </td>

                        {/* Method */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            {exp.payment_method}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 text-right font-black text-base text-[#590231] whitespace-nowrap tabular-nums">
                          ₹{Number(exp.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>

                        {/* Attachment */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {exp.attachment_name ? (
                            <button
                              onClick={() => {
                                if (exp.attachment_url) {
                                  window.open(exp.attachment_url, '_blank');
                                } else {
                                  alert(`Attachment file: ${exp.attachment_name}`);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FEF9C3] hover:bg-[#FEF08A] text-[#854D0E] text-xs font-bold border border-[#F9E33A] transition cursor-pointer"
                              title={exp.attachment_name}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              <span className="max-w-[70px] truncate">{exp.attachment_name}</span>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions (Replaced View History with View Details) */}
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            
                            {/* View Details Button (Primary Action) */}
                            <button
                              onClick={() => openDetailsModal(exp)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2D041A] hover:bg-[#48082B] text-white border border-[#48082B] text-xs font-bold transition shadow-2xs cursor-pointer"
                              title="View Full Expense Details & Audit History"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#F9E33A]" />
                              <span>View Details</span>
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 rounded-xl bg-[#FFF5F9] border border-[#E8BFD5] hover:bg-[#FCE7F3] text-[#8A064D] transition cursor-pointer shadow-2xs"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingExpense(exp)}
                              className="p-1.5 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition cursor-pointer shadow-2xs"
                              title="Remove Expense"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#FFF9FB] border-t border-[#F0D5E4] flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} records
                </span>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    className="p-2 rounded-xl border border-[#F0D5E4] bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-black text-[#590231] px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 rounded-xl border border-[#F0D5E4] bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* VIEW DETAILS MODAL (Displays Full Description, Metadata, & Change History) */}
      {detailsExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
            
            {/* Modal Header */}
            <div className="bg-[#590231] px-6 py-5 text-white flex items-center justify-between border-b border-[#8A064D]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#8A064D] flex items-center justify-center text-[#F9E33A] border border-[#F9E33A]/40">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-white">Expense Details & History</h3>
                  <p className="text-xs text-rose-200 font-semibold">
                    Category: {detailsExpense.category} • Date: {detailsExpense.expense_date ? new Date(detailsExpense.expense_date).toLocaleDateString('en-GB') : '—'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailsExpense(null)}
                className="p-1.5 rounded-xl text-rose-200 hover:text-white hover:bg-[#8A064D] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              
              {/* Highlighted Full Description Section */}
              <div className="bg-[#FFF9FB] p-5 rounded-2xl border border-[#F0D5E4]">
                <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider block mb-2">
                  Full Description
                </span>
                <p className="text-sm font-bold text-gray-900 leading-relaxed whitespace-pre-wrap">
                  {detailsExpense.description}
                </p>
              </div>

              {/* Particulars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Amount</span>
                  <span className="text-lg font-black text-[#590231] mt-1 block">
                    ₹{Number(detailsExpense.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Payment Method</span>
                  <span className="text-sm font-black text-gray-800 mt-1 block">
                    {detailsExpense.payment_method}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Vendor / Payee</span>
                  <span className="text-sm font-black text-gray-800 mt-1 block truncate">
                    {detailsExpense.vendor || 'Not specified'}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Reference Number</span>
                  <span className="text-sm font-black text-gray-800 mt-1 block truncate">
                    {detailsExpense.reference_number || 'None'}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Logged By</span>
                  <span className="text-sm font-black text-gray-800 mt-1 block truncate">
                    {detailsExpense.created_by || 'Director'}
                  </span>
                </div>

                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200">
                  <span className="text-[11px] font-bold text-gray-500 uppercase block">Receipt Attachment</span>
                  {detailsExpense.attachment_name ? (
                    <button
                      onClick={() => {
                        if (detailsExpense.attachment_url) {
                          window.open(detailsExpense.attachment_url, '_blank');
                        } else {
                          alert(`Attachment file: ${detailsExpense.attachment_name}`);
                        }
                      }}
                      className="text-xs font-bold text-[#8A064D] hover:underline mt-1 flex items-center gap-1 truncate"
                    >
                      <Paperclip className="w-3.5 h-3.5" />
                      <span>{detailsExpense.attachment_name}</span>
                    </button>
                  ) : (
                    <span className="text-sm font-semibold text-gray-400 mt-1 block">None</span>
                  )}
                </div>

              </div>

              {/* Audit & Change History Logs */}
              <div className="border-t border-[#F0D5E4] pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm text-[#590231] flex items-center gap-2">
                    <History className="w-4 h-4 text-[#8A064D]" />
                    <span>Change & Audit History</span>
                  </h4>
                  <span className="text-xs font-semibold text-gray-500">
                    {detailsLogs.length} change log(s)
                  </span>
                </div>

                {isDetailsLoading ? (
                  <div className="py-6 text-center text-xs font-bold text-gray-500">
                    Loading change log history...
                  </div>
                ) : detailsLogs.length === 0 ? (
                  <div className="py-6 text-center text-xs font-bold text-gray-500 bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                    No modifications recorded. This expense retains its original values created by {detailsExpense.created_by}.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {detailsLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-[#8A064D] uppercase tracking-wide">
                            Field Modified: {log.field_name}
                          </span>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {new Date(log.changed_at).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="line-through text-red-500 font-semibold">{log.old_value || 'None'}</span>
                          <span className="text-gray-400 font-bold">➔</span>
                          <span className="font-bold text-emerald-700">{log.new_value || 'None'}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 pt-0.5 font-semibold">
                          Changed by: {log.changed_by}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const expToEdit = detailsExpense;
                  setDetailsExpense(null);
                  openEditModal(expToEdit);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#8A064D] border border-[#F0D5E4] text-xs font-bold transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit This Expense</span>
              </button>

              <button
                onClick={() => setDetailsExpense(null)}
                className="px-5 py-2 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white text-xs font-bold transition cursor-pointer"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

      {/* RECORD NEW EXPENSE / EDIT MODAL (No prefilled details in cells for new expense) */}
      {(isAddModalOpen || editingExpense) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-[#590231] px-6 py-4 text-white flex items-center justify-between border-b border-[#8A064D]">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="font-black text-lg text-white">
                  {editingExpense ? 'Edit Expense Record' : 'Record New Academy Expense'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingExpense(null);
                }}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-[#8A064D] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={editingExpense ? handleSubmitEdit : handleSubmitAdd} className="p-6 space-y-4">
              
              {/* Category & New Category Option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider">
                    Category *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCategory(!showAddCategory)}
                    className="text-xs font-bold text-[#8A064D] hover:underline cursor-pointer"
                  >
                    {showAddCategory ? 'Cancel Custom' : '+ Add Custom Category'}
                  </button>
                </div>

                {showAddCategory ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="e.g. Sound System, Stage Props..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCategory}
                      className="px-3 py-2 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#590231] cursor-pointer"
                    >
                      Save Category
                    </button>
                  </div>
                ) : (
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  >
                    <option value="">— Select Category —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
                {formErrors.category && (
                  <p className="text-xs font-bold text-red-600 mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Description (Empty by default) */}
              <div>
                <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter detailed description of spending..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                />
                {formErrors.description && (
                  <p className="text-xs font-bold text-red-600 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Amount & Date in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Amount (Empty by default) */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Amount (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-black text-sm">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-black text-gray-900 focus:outline-none focus:border-[#8A064D]"
                    />
                  </div>
                  {formErrors.amount && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.amount}</p>
                  )}
                </div>

                {/* Expense Date (Empty by default) */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expense_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expense_date: e.target.value }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  />
                  {formErrors.expense_date && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.expense_date}</p>
                  )}
                </div>

              </div>

              {/* Payment Method & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Payment Method (No prefill) */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  >
                    <option value="">— Select Payment Method —</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.payment_method && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.payment_method}</p>
                  )}
                </div>

                {/* Vendor (Optional, empty by default) */}
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Vendor / Payee (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    placeholder="Enter vendor / store name..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  />
                </div>

              </div>

              {/* Reference Number & Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Reference Number (Optional, empty by default) */}
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Reference / Transaction No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="UPI Ref, Cheque No, Transaction ID..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  />
                </div>

                {/* Attachment Upload (Optional) */}
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Receipt Photo or PDF (Optional)
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-2xl bg-[#FFF9FB] border border-dashed border-[#8A064D]/50 hover:bg-[#FFF2F8] text-xs font-bold text-[#8A064D] cursor-pointer transition">
                      <Paperclip className="w-4 h-4" />
                      <span className="truncate">
                        {formData.attachment_name || 'Upload receipt / bill'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.attachment_name && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, attachment_name: '', attachment_url: '' }))}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {formErrors.attachment && (
                    <p className="text-xs font-bold text-red-600 mt-1">{formErrors.attachment}</p>
                  )}
                </div>

              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#F0D5E4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingExpense(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#8A064D] hover:bg-[#590231] text-white font-black text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : (
                    <span>{editingExpense ? 'Save Changes' : 'Confirm & Record Expense'}</span>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (EXPLAINS IMPACT & FLAGS AS REMOVED) */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-red-200 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-black text-gray-900">
                Confirm Expense Removal
              </h3>
              <p className="text-xs font-semibold text-gray-600 mt-2 leading-relaxed">
                Are you sure you want to remove <strong className="text-gray-900">"{deletingExpense.description}"</strong> (₹{Number(deletingExpense.amount).toLocaleString('en-IN')})?
              </p>
              <div className="mt-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-left text-xs font-bold text-[#8A064D]">
                ⚠️ <strong>Audit Impact:</strong> To protect academic and financial integrity, this expense will be flagged as <strong>removed</strong> rather than silently erased. A permanent audit record will be preserved.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingExpense(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
