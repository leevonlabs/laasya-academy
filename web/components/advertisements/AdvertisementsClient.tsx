'use client';

import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  X, 
  Eye, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Send, 
  Image as ImageIcon, 
  Upload,
  Smartphone,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Announcement } from '@/lib/announcements';

interface Props {
  initialAnnouncements: Announcement[];
}

export default function AdvertisementsClient({ initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [previewAnnouncement, setPreviewAnnouncement] = useState<Announcement | null>(null);
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image_url: '',
    publish_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'Published' as 'Draft' | 'Scheduled' | 'Published' | 'Expired',
    action_links: [] as Array<{ title: string; url: string }>
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'edit' | 'preview'>('edit');
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const isBanner = (ann: Announcement) => {
    return ann.announcement_type === 'banner' || (Boolean(ann.image_url) && ann.announcement_type !== 'message');
  };

  const bannerAds = useMemo(() => {
    return announcements.filter(a => !a.is_deleted && isBanner(a));
  }, [announcements]);

  const filteredBanners = useMemo(() => {
    return bannerAds.filter(ann => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = ann.title?.toLowerCase().includes(q);
        const matchesMessage = ann.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMessage) return false;
      }
      if (statusFilter !== 'all') {
        if (ann.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [bannerAds, searchQuery, statusFilter]);

  const activeCount = useMemo(() => bannerAds.filter(a => a.status === 'Published').length, [bannerAds]);
  const scheduledCount = useMemo(() => bannerAds.filter(a => a.status === 'Scheduled').length, [bannerAds]);
  const expiredCount = useMemo(() => bannerAds.filter(a => a.status === 'Expired').length, [bannerAds]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 800;
        const maxH = 1050;
        let w = img.width;
        let h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, image_url: compressed }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: '',
      message: '',
      image_url: '',
      publish_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'Published',
      action_links: []
    });
    setFormErrors({});
    setActiveFormTab('edit');
    setIsCreateModalOpen(true);
  };

  const openEditModal = (ann: Announcement) => {
    setEditingAnnouncement(ann);
    const links = Array.isArray(ann.action_links) ? ann.action_links : [];
    setFormData({
      title: ann.title || '',
      message: ann.message || '',
      image_url: ann.image_url || '',
      publish_date: ann.publish_date ? ann.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
      expiry_date: ann.expiry_date ? ann.expiry_date.split('T')[0] : '',
      status: (ann.status || 'Published') as any,
      action_links: links
    });
    setFormErrors({});
    setActiveFormTab('edit');
    setIsCreateModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Advertisement campaign title is required.';
    if (!formData.image_url) errors.image_url = 'Please upload a banner poster image.';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        audience: 'All students',
        type_tag: 'General',
        publish_date: formData.publish_date,
        expiry_date: formData.expiry_date || null,
        status: formData.status,
        image_url: formData.image_url,
        announcement_type: 'banner',
        action_links: formData.action_links
      };

      if (editingAnnouncement) {
        const res = await fetch(`/api/announcements/${editingAnnouncement.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success && json.announcement) {
          setAnnouncements(prev => prev.map(a => a.id === editingAnnouncement.id ? json.announcement : a));
          showToast('Advertisement updated successfully!');
          setIsCreateModalOpen(false);
        } else {
          showToast(json.error || 'Failed to update advertisement', 'error');
        }
      } else {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const json = await res.json();
        if (json.success && json.announcement) {
          setAnnouncements(prev => [json.announcement, ...prev]);
          showToast('Advertisement published to student and guru app homepages!');
          setIsCreateModalOpen(false);
        } else {
          showToast(json.error || 'Failed to create advertisement', 'error');
        }
      }
    } catch {
      showToast('Network error while saving advertisement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingAnnouncement) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/announcements/${deletingAnnouncement.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        setAnnouncements(prev => prev.filter(a => a.id !== deletingAnnouncement.id));
        showToast('Advertisement deleted.');
        setDeletingAnnouncement(null);
      } else {
        showToast(json.error || 'Failed to delete advertisement', 'error');
      }
    } catch {
      showToast('Network error while deleting', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
          toastMessage.type === 'success' ? 'bg-[#03543F] text-white' : 'bg-red-600 text-white'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-300" /> : <X className="w-5 h-5" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-[#590231] to-[#8A064D] p-6 sm:p-8 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#F9E33A] text-[#590231] text-xs font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
              APP HOME PROMOTIONS
            </span>
            <span className="text-white/70 text-xs font-semibold">• Live Mobile Carousels</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-[#F9E33A]" />
            App Banner Advertisements
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-2xl">
            Create high-impact promotional banners displayed on the home page below the welcome header in Student and Guru mobile apps.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#F9E33A] hover:bg-[#ebd52f] text-[#590231] font-bold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Advertisement</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#F0D5E4] shadow-xs">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Campaigns</div>
          <div className="text-2xl font-black text-[#590231] mt-1">{bannerAds.length}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs">
          <div className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Active & Visible</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-xs">
          <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Scheduled</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{scheduledCount}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expired / Closed</div>
          <div className="text-2xl font-black text-gray-500 mt-1">{expiredCount}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#F0D5E4] shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search advertisements by title or description..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] text-gray-700 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="published">Active (Published)</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Advertisements Grid */}
      {filteredBanners.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#F0D5E4] text-center">
          <div className="w-16 h-16 bg-[#FFF2F8] text-[#590231] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No Advertisements Found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            {searchQuery ? 'Try adjusting your search filters.' : 'Upload your first promotional banner for the student and guru app carousels.'}
          </p>
          <button
            onClick={openCreateModal}
            className="mt-5 inline-flex items-center gap-2 bg-[#590231] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#70043e] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Advertisement</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBanners.map(ann => {
            const isLive = ann.status === 'Published';
            const isSched = ann.status === 'Scheduled';
            return (
              <div key={ann.id} className="bg-white rounded-2xl border border-[#F0D5E4] shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all">
                {/* Image Poster Header */}
                <div className="relative aspect-16/9 bg-gray-100 overflow-hidden group">
                  {ann.image_url ? (
                    <img 
                      src={ann.image_url} 
                      alt={ann.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <ImageIcon className="w-12 h-12 stroke-1" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs ${
                      isLive 
                        ? 'bg-emerald-600 text-white' 
                        : isSched 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 text-white'
                    }`}>
                      {ann.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Quick Action Preview Overlay */}
                  <button
                    onClick={() => setPreviewAnnouncement(ann)}
                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-xl backdrop-blur-xs transition-all"
                    title="Preview on mobile device mockup"
                  >
                    <Smartphone className="w-4 h-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">{ann.title}</h3>
                    {ann.message && (
                      <p className="text-xs text-gray-600 mt-1.5 line-clamp-2 leading-relaxed">{ann.message}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        <span>Active from: {ann.publish_date?.split('T')[0] || 'Today'}</span>
                      </div>
                      {ann.expiry_date && (
                        <span>Exp: {ann.expiry_date.split('T')[0]}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => setPreviewAnnouncement(ann)}
                        className="flex-1 py-2 px-3 text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={() => openEditModal(ann)}
                        className="p-2 text-gray-600 hover:text-[#590231] hover:bg-[#FFF2F8] rounded-xl transition-all"
                        title="Edit advertisement"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingAnnouncement(ann)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete advertisement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#590231] to-[#70043e] text-white">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-[#F9E33A]" />
                <h2 className="text-lg font-bold">
                  {editingAnnouncement ? 'Edit Banner Advertisement' : 'Create New App Banner Advertisement'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/70 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Banner Poster Image (High Resolution) *
                </label>
                {formData.image_url ? (
                  <div className="relative rounded-2xl overflow-hidden border border-[#F0D5E4] bg-gray-50 aspect-16/9">
                    <img 
                      src={formData.image_url} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                      className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-xl shadow-md hover:bg-red-700 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-[#F0D5E4] hover:border-[#8A064D] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer bg-[#FFF9FB] hover:bg-[#FFF2F8] transition-all group">
                    <Upload className="w-8 h-8 text-[#8A064D] group-hover:scale-110 transition-transform mb-2" />
                    <span className="text-sm font-bold text-[#590231]">Click to upload banner image</span>
                    <span className="text-xs text-gray-500 mt-1">Recommended 800x450 or 800x1050 JPEG / PNG</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </label>
                )}
                {formErrors.image_url && (
                  <p className="text-xs font-bold text-red-600 mt-1.5">{formErrors.image_url}</p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Navaratri Classical Music Festival 2026"
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] focus:bg-white font-medium"
                />
                {formErrors.title && (
                  <p className="text-xs font-bold text-red-600 mt-1">{formErrors.title}</p>
                )}
              </div>

              {/* Description / Caption */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Description / Caption (Optional)
                </label>
                <textarea
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Brief details about the performance, workshop, or registration dates..."
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 rounded-xl border border-gray-200 focus:outline-hidden focus:border-[#8A064D] focus:bg-white font-medium"
                />
              </div>

              {/* Action Links */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Interactive Button / Link (Optional)
                  </label>
                  {formData.action_links.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        action_links: [{ title: 'Explore Details', url: 'https://' }]
                      }))}
                      className="text-xs font-bold text-[#8A064D] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Button</span>
                    </button>
                  )}
                </div>

                {formData.action_links.map((link, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...prev.action_links];
                          updated[idx].title = val;
                          return { ...prev, action_links: updated };
                        });
                      }}
                      placeholder="Button text (e.g. Register Now)"
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(prev => {
                          const updated = [...prev.action_links];
                          updated[idx].url = val;
                          return { ...prev, action_links: updated };
                        });
                      }}
                      placeholder="Destination URL (https://...)"
                      className="flex-1 px-3 py-1.5 text-xs bg-white rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, action_links: [] }))}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Schedule Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Start Display Date
                  </label>
                  <input
                    type="date"
                    value={formData.publish_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Auto-Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Initial Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                  className="w-full px-3.5 py-2 text-sm bg-gray-50 rounded-xl border border-gray-200 font-medium"
                >
                  <option value="Published">Published (Live Immediately)</option>
                  <option value="Scheduled">Scheduled (Wait for Start Date)</option>
                  <option value="Draft">Draft (Saved but Not Visible)</option>
                </select>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-bold text-white bg-[#590231] hover:bg-[#70043e] rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-[#F9E33A]" />
                      <span>{editingAnnouncement ? 'Save Changes' : 'Publish Advertisement'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Mockup Preview Modal */}
      {previewAnnouncement && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setPreviewAnnouncement(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-4">
              <span className="text-xs font-bold text-[#8A064D] uppercase tracking-wider">Mobile Preview</span>
              <h4 className="text-base font-black text-gray-900 mt-0.5">App Home Banner</h4>
            </div>

            {/* Smartphone frame */}
            <div className="border-4 border-gray-900 rounded-2xl overflow-hidden shadow-xl bg-gray-50 p-3 space-y-3">
              <div className="text-[10px] font-bold text-gray-400 text-center tracking-widest">• HOME DASHBOARD •</div>
              <div className="rounded-xl overflow-hidden shadow-md bg-white border border-gray-200">
                {previewAnnouncement.image_url ? (
                  <img 
                    src={previewAnnouncement.image_url} 
                    alt={previewAnnouncement.title}
                    className="w-full aspect-16/9 object-cover" 
                  />
                ) : (
                  <div className="w-full aspect-16/9 bg-gray-200 flex items-center justify-center text-gray-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
                <div className="p-3">
                  <div className="text-xs font-bold text-gray-900">{previewAnnouncement.title}</div>
                  {previewAnnouncement.message && (
                    <div className="text-[11px] text-gray-600 mt-1 line-clamp-2">{previewAnnouncement.message}</div>
                  )}
                  {previewAnnouncement.action_links && previewAnnouncement.action_links.length > 0 && (
                    <div className="mt-2.5 inline-block text-[10px] font-bold bg-[#590231] text-[#F9E33A] px-3 py-1 rounded-lg">
                      {previewAnnouncement.action_links[0].title || 'Explore Now'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAnnouncement && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900">Delete Advertisement</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{deletingAnnouncement.title}"</span>? This will immediately remove it from all student and guru app carousels.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeletingAnnouncement(null)}
                className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isSubmitting}
                className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-md"
              >
                {isSubmitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
