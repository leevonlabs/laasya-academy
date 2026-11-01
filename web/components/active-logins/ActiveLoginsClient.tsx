'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Laptop,
  Globe,
  Shield,
  ShieldCheck,
  Search,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  GraduationCap,
  Users
} from 'lucide-react';

interface SessionItem {
  id: string;
  user_id: string;
  profile_id?: string;
  user_name: string;
  identifier: string;
  role: string;
  device_name: string;
  browser: string;
  os: string;
  ip_address: string;
  is_active: boolean;
  last_active_at: string;
  created_at: string;
  is_current?: boolean;
}

export default function ActiveLoginsClient() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'student' | 'trainer' | 'owner'>('all');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/active-sessions?all=true');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load active sessions');
      }
      setSessions(data.sessions || []);
    } catch (err: any) {
      setError(err.message || 'Error loading sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string, userName: string) => {
    if (!confirm(`Are you sure you want to revoke the session for ${userName}? They will be immediately signed out from that device.`)) {
      return;
    }

    setRevokingId(sessionId);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/active-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to revoke session');
      }
      setMessage({ type: 'success', text: `Session for ${userName} has been successfully revoked.` });
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to revoke session.' });
    } finally {
      setRevokingId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      if (selectedRole !== 'all') {
        const r = (s.role || '').toLowerCase();
        if (selectedRole === 'trainer' && r !== 'trainer' && r !== 'guru') return false;
        if (selectedRole === 'student' && r !== 'student') return false;
        if (selectedRole === 'owner' && r !== 'owner' && r !== 'admin') return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = (s.user_name || '').toLowerCase().includes(q);
        const matchesIdent = (s.identifier || '').toLowerCase().includes(q);
        const matchesIp = (s.ip_address || '').includes(q);
        const matchesDevice = (s.device_name || '').toLowerCase().includes(q);
        return matchesName || matchesIdent || matchesIp || matchesDevice;
      }
      return true;
    });
  }, [sessions, selectedRole, search]);

  const stats = useMemo(() => {
    const total = sessions.length;
    const students = sessions.filter(s => (s.role || '').toLowerCase() === 'student').length;
    const gurus = sessions.filter(s => ['trainer', 'guru'].includes((s.role || '').toLowerCase())).length;
    const admins = sessions.filter(s => ['owner', 'admin', 'developer'].includes((s.role || '').toLowerCase())).length;
    return { total, students, gurus, admins };
  }, [sessions]);

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || '').toLowerCase();
    if (r === 'owner' || r === 'admin') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#FFF2F8] text-[#8A064D] border border-[#F0D5E4]">Admin</span>;
    }
    if (r === 'trainer' || r === 'guru') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Guru</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">Student</span>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">Active Logins & Sessions</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-[#8A064D] text-white">LIVE</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Real-time authenticated device sessions across Student, Guru, and Admin accounts. Revoke unauthorized or obsolete logins instantly.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSessions}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Active</div>
          <div className="text-2xl font-black text-gray-900 mt-1">{stats.total}</div>
          <div className="text-xs text-gray-400 mt-0.5">Connected devices</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Students</div>
          <div className="text-2xl font-black text-amber-800 mt-1">{stats.students}</div>
          <div className="text-xs text-gray-400 mt-0.5">Disciples & parents</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Gurus</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">{stats.gurus}</div>
          <div className="text-xs text-gray-400 mt-0.5">Faculty masters</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-[#8A064D] uppercase tracking-wider">Admins</div>
          <div className="text-2xl font-black text-[#8A064D] mt-1">{stats.admins}</div>
          <div className="text-xs text-gray-400 mt-0.5">Academy directors</div>
        </div>
      </div>

      {/* Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-red-50 text-red-900 border border-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">DISMISS</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'student', 'trainer', 'owner'] as const).map(role => {
            const labels = { all: 'All Roles', student: 'Students', trainer: 'Gurus', owner: 'Admins' };
            const isSel = selectedRole === role;
            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition whitespace-nowrap ${
                  isSel
                    ? 'bg-[#8A064D] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {labels[role]}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, roll, IP..."
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#8A064D] focus:border-transparent"
          />
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-[#8A064D] mb-3" />
            <p className="text-sm font-medium">Querying active sessions from database...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={fetchSessions} className="mt-3 text-xs underline font-bold text-[#8A064D]">Retry Loading</button>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Smartphone className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">No active sessions found</p>
            <p className="text-xs text-gray-400 mt-1">No devices currently match the selected criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredSessions.map(session => (
              <div
                key={session.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition hover:bg-gray-50 ${
                  session.is_current ? 'bg-amber-50/30' : ''
                }`}
              >
                {/* Left: Device & User Details */}
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 text-gray-600 mt-0.5">
                    {session.device_name?.toLowerCase().includes('phone') || session.device_name?.toLowerCase().includes('android') || session.device_name?.toLowerCase().includes('ios') ? (
                      <Smartphone className="w-5 h-5 text-gray-700" />
                    ) : (
                      <Laptop className="w-5 h-5 text-gray-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-sm">{session.user_name}</span>
                      {getRoleBadge(session.role)}
                      {session.is_current && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          This Session
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-700">{session.device_name}</span>
                      <span>•</span>
                      <span>{session.browser}</span>
                      <span>•</span>
                      <span>IP: {session.ip_address}</span>
                      {session.identifier && (
                        <>
                          <span>•</span>
                          <span>ID: {session.identifier}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Last active: {formatTimeAgo(session.last_active_at)}</span>
                      <span>•</span>
                      <span>Signed in: {new Date(session.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRevoke(session.id, session.user_name)}
                    disabled={revokingId === session.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 transition disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {revokingId === session.id ? 'Revoking...' : 'Revoke Session'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
