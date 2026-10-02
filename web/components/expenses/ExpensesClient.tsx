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
  FileCheck
} from 'lucide-react';
import { Expense, ExpenseSummary, ExpenseAuditLog } from '@/lib/expenses';

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
  const [summary, setSummary] = useState<ExpenseSummary>(initialSummary);
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMethod, setSelectedMethod] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [historyExpense, setHistoryExpense] = useState<Expense | null>(null);
  const [historyLogs, setHistoryLogs] = useState<ExpenseAuditLog[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  // Custom Category Add State
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    category: 'Rent',
    description: '',
    amount: '',
    payment_method: 'UPI' as 'Cash' | 'UPI' | 'Bank transfer' | 'Other',
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

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchDesc = exp.description.toLowerCase().includes(q);
        const matchVendor = (exp.vendor || '').toLowerCase().includes(q);
        const matchRef = (exp.reference_number || '').toLowerCase().includes(q);
        const matchCat = exp.category.toLowerCase().includes(q);
        if (!matchDesc && !matchVendor && !matchRef && !matchCat) return false;
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
  }, [expenses, searchQuery, selectedCategory, selectedMethod, startDate, endDate]);

  // Dynamic summary based on filtered records
  const dynamicSummary = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const count = filteredExpenses.length;

    const catTotals: Record<string, number> = {};
    for (const e of filteredExpenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + (Number(e.amount) || 0);
    }

    let top: { name: string; amount: number } | null = null;
    let max = 0;
    for (const [name, amt] of Object.entries(catTotals)) {
      if (amt > max) {
        max = amt;
        top = { name, amount: amt };
      }
    }

    return {
      totalAmount: total,
      topCategory: top,
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
    selectedCategory !== 'all' || 
    selectedMethod !== 'all' || 
    startDate || 
    endDate
  );

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedMethod('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Open add modal
  const openAddModal = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      category: categories[0]?.name || 'Rent',
      description: '',
      amount: '',
      payment_method: 'UPI',
      vendor: '',
      reference_number: '',
      attachment_name: '',
      attachment_url: ''
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setFormData({
      expense_date: exp.expense_date.split('T')[0],
      category: exp.category,
      description: exp.description,
      amount: String(exp.amount),
      payment_method: exp.payment_method,
      vendor: exp.vendor || '',
      reference_number: exp.reference_number || '',
      attachment_name: exp.attachment_name || '',
      attachment_url: exp.attachment_url || ''
    });
    setFormErrors({});
  };

  // Handle File Upload (Simulated receipt storage)
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
    if (!formData.expense_date) {
      errors.expense_date = 'Date is required';
    }
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }
    if (!formData.category || !formData.category.trim()) {
      errors.category = 'Category is required';
    }
    if (!formData.description || !formData.description.trim()) {
      errors.description = 'Description is required';
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

  // View Audit History
  const openHistoryModal = async (exp: Expense) => {
    setHistoryExpense(exp);
    setIsHistoryLoading(true);
    try {
      const res = await fetch(`/api/expenses/${exp.id}/history`);
      const json = await res.json();
      if (json.success) {
        setHistoryLogs(json.history);
      } else {
        setHistoryLogs([]);
      }
    } catch {
      setHistoryLogs([]);
    } finally {
      setIsHistoryLoading(false);
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

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Total This Period */}
        <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-6 border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF2F8] rounded-bl-full -z-0 opacity-70" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider">
              Total This Period
            </span>
            <div className="p-2.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-[#590231] tracking-tight relative z-10">
            ₹{dynamicSummary.totalAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2 relative z-10">
            {hasActiveFilters ? 'Across currently filtered results' : 'Total recorded academy expenditures'}
          </p>
        </div>

        {/* Top Category */}
        <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-6 border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FEF9C3]/50 rounded-bl-full -z-0" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-black text-[#854D0E] uppercase tracking-wider">
              Top Category Spend
            </span>
            <div className="p-2.5 rounded-xl bg-[#FEF9C3] text-[#854D0E] border border-[#F9E33A]/40">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl md:text-3xl font-black text-[#590231] truncate tracking-tight relative z-10">
            {dynamicSummary.topCategory ? dynamicSummary.topCategory.name : 'None'}
          </div>
          <p className="text-xs font-semibold text-gray-600 mt-2 relative z-10">
            {dynamicSummary.topCategory 
              ? `₹${dynamicSummary.topCategory.amount.toLocaleString('en-IN')} spent in this category`
              : 'No category data recorded'}
          </p>
        </div>

        {/* Count of Expenses */}
        <div className="bg-gradient-to-br from-white to-[#FFF9FB] rounded-3xl p-6 border border-[#F0D5E4] shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFF2F8] rounded-bl-full -z-0 opacity-70" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-black text-[#8A064D] uppercase tracking-wider">
              Count of Expenses
            </span>
            <div className="p-2.5 rounded-xl bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl md:text-4xl font-black text-[#590231] tracking-tight relative z-10">
            {dynamicSummary.expenseCount}
          </div>
          <p className="text-xs font-semibold text-gray-500 mt-2 relative z-10">
            {dynamicSummary.expenseCount === 1 ? '1 expense record found' : `${dynamicSummary.expenseCount} expense records found`}
          </p>
        </div>

      </div>

      {/* Search and Filters Section */}
      <div className="bg-white rounded-3xl p-6 border border-[#F0D5E4] shadow-xs space-y-4">
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by description, vendor, reference or category..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D] focus:ring-1 focus:ring-[#8A064D] placeholder-gray-400"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="w-full sm:w-52">
            <select
              value={selectedMethod}
              onChange={(e) => {
                setSelectedMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            >
              <option value="all">All Payment Methods</option>
              <option value="UPI">UPI</option>
              <option value="Cash">Cash</option>
              <option value="Bank transfer">Bank transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

        </div>

        {/* Date Range Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F0D5E4]/60">
          
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-[#8A064D] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              Date Range:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            />
            <span className="text-xs text-gray-400 font-bold">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
            />
          </div>

          {/* Active Filters Badges & Clear Button */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Active filters applied</span>
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-[#8A064D] text-xs font-black transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear filters</span>
              </button>
            </div>
          )}

        </div>

      </div>

      {/* Expense List Table */}
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
                  ? 'Try clearing active search or date filters to view all records.' 
                  : 'Keep your academy accounts clear and compliant by logging your expenditures.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-5 py-2.5 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#590231] transition"
              >
                Clear all filters
              </button>
            ) : (
              <button
                onClick={openAddModal}
                className="px-6 py-3 rounded-2xl bg-[#8A064D] text-white text-sm font-bold hover:bg-[#590231] shadow-md transition flex items-center gap-2"
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
                    <th className="py-4 px-5">Description</th>
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
                        <td className="py-4 px-5 font-bold text-gray-700 whitespace-nowrap">
                          {dateFormatted}
                        </td>

                        {/* Category */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-xl text-xs font-black bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">
                            {exp.category}
                          </span>
                        </td>

                        {/* Description */}
                        <td className="py-4 px-5 max-w-xs">
                          <div className="font-bold text-gray-900 leading-snug">
                            {exp.description}
                          </div>
                          {exp.reference_number && (
                            <div className="text-[11px] font-semibold text-gray-400 mt-0.5">
                              Ref: {exp.reference_number}
                            </div>
                          )}
                        </td>

                        {/* Vendor */}
                        <td className="py-4 px-5 font-semibold text-gray-700 whitespace-nowrap">
                          {exp.vendor || '—'}
                        </td>

                        {/* Method */}
                        <td className="py-4 px-5 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
                            {exp.payment_method}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-5 text-right font-black text-base text-[#590231] whitespace-nowrap">
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

                        {/* Actions */}
                        <td className="py-4 px-5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            
                            {/* Edit Button */}
                            <button
                              onClick={() => openEditModal(exp)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-[#8A064D] hover:bg-[#FFF2F8] border border-transparent hover:border-[#F0D5E4] transition"
                              title="Edit Expense"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* History Button */}
                            <button
                              onClick={() => openHistoryModal(exp)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition"
                              title="View Change History"
                            >
                              <History className="w-4 h-4" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => setDeletingExpense(exp)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition"
                              title="Remove Expense"
                            >
                              <Trash2 className="w-4 h-4" />
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
                    className="p-2 rounded-xl bg-white border border-[#F0D5E4] text-gray-700 font-bold hover:bg-[#FFF2F8] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-[#590231] px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    className="p-2 rounded-xl bg-white border border-[#F0D5E4] text-gray-700 font-bold hover:bg-[#FFF2F8] disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ADD / EDIT EXPENSE MODAL */}
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
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-[#8A064D] transition"
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
                    className="text-xs font-bold text-[#8A064D] hover:underline"
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
                      className="px-3 py-2 rounded-xl bg-[#8A064D] text-white text-xs font-bold hover:bg-[#590231]"
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
                    {categories.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                )}
                {formErrors.category && (
                  <p className="text-xs font-bold text-red-600 mt-1">{formErrors.category}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                  Description *
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Detail what this expense was for (e.g. October Studio Rent)..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                />
                {formErrors.description && (
                  <p className="text-xs font-bold text-red-600 mt-1">{formErrors.description}</p>
                )}
              </div>

              {/* Amount & Date in Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Amount */}
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

                {/* Date */}
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
                
                {/* Payment Method */}
                <div>
                  <label className="text-xs font-black text-[#590231] uppercase tracking-wider block mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank transfer">Bank transfer</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Vendor (Optional) */}
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Vendor / Payee (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    placeholder="e.g. BESCOM, Chowdiah Hall..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  />
                </div>

              </div>

              {/* Reference Number & Attachment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Reference Number (Optional) */}
                <div>
                  <label className="text-xs font-black text-gray-600 uppercase tracking-wider block mb-1">
                    Reference / Transaction No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.reference_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="UPI ID, NEFT ref, cash voucher..."
                    className="w-full px-4 py-3 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-sm font-bold text-gray-800 focus:outline-none focus:border-[#8A064D]"
                  />
                </div>

                {/* Attachment Upload (Receipt Photo or PDF) */}
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
                        className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
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
                  className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100 transition"
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

      {/* CHANGE HISTORY AUDIT MODAL */}
      {historyExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#F0D5E4] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            <div className="bg-[#590231] px-6 py-4 text-white flex items-center justify-between border-b border-[#8A064D]">
              <div className="flex items-center gap-2.5">
                <History className="w-5 h-5 text-[#F9E33A]" />
                <h3 className="font-black text-lg text-white">Expense Audit & Change History</h3>
              </div>
              <button
                onClick={() => setHistoryExpense(null)}
                className="p-1 rounded-lg text-rose-200 hover:text-white hover:bg-[#8A064D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="font-black text-base text-[#590231]">{historyExpense.description}</h4>
                <p className="text-xs text-gray-500 font-semibold">
                  Category: {historyExpense.category} • Current Amount: ₹{Number(historyExpense.amount).toLocaleString('en-IN')}
                </p>
              </div>

              {isHistoryLoading ? (
                <div className="py-8 text-center text-xs font-bold text-gray-500">
                  Loading change log history...
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="py-8 text-center text-xs font-bold text-gray-500 bg-[#FFF9FB] rounded-2xl border border-[#F0D5E4]">
                  No edits recorded yet. This expense retains its original values created by {historyExpense.created_by}.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="p-3.5 rounded-2xl bg-[#FFF9FB] border border-[#F0D5E4] text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#8A064D] uppercase tracking-wide">
                          Modified: {log.field_name}
                        </span>
                        <span className="text-[11px] font-semibold text-gray-400">
                          {new Date(log.changed_at).toLocaleString('en-GB')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <span className="line-through text-red-500 font-semibold">{log.old_value || 'None'}</span>
                        <span className="text-gray-400">➔</span>
                        <span className="font-bold text-emerald-700">{log.new_value || 'None'}</span>
                      </div>
                      <div className="text-[10px] text-gray-500 pt-0.5 font-semibold">
                        Changed by: {log.changed_by}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#F0D5E4] flex justify-end">
                <button
                  onClick={() => setHistoryExpense(null)}
                  className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold"
                >
                  Close History
                </button>
              </div>

            </div>

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
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md transition disabled:opacity-50"
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
