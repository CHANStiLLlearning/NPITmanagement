import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ShieldAlert, LogIn, LogOut, PlusCircle, Edit3, Trash2,
  Download, Search, RefreshCw, ShieldCheck, Globe, Clock, User,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuditLog {
  id: number;
  user_email: string;
  user_name?: string;
  action: string;
  module: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

const ACTION_CONFIG: Record<string, { label: string; badge: string; icon: React.ElementType }> = {
  login:        { label: 'Login',        badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: LogIn      },
  logout:       { label: 'Logout',       badge: 'bg-slate-100 text-[#1c3a73] border-slate-200',       icon: LogOut     },
  login_failed: { label: 'Failed Login', badge: 'bg-rose-100 text-rose-700 border-rose-200',       icon: ShieldAlert},
  create:       { label: 'Create',       badge: 'bg-blue-100 text-blue-700 border-blue-200',         icon: PlusCircle },
  update:       { label: 'Update',       badge: 'bg-amber-100 text-amber-700 border-amber-200',     icon: Edit3      },
  delete:       { label: 'Delete',       badge: 'bg-red-100 text-red-700 border-red-200',           icon: Trash2     },
  export:       { label: 'Export',       badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: Download   },
};

const ROWS_PER_PAGE = 10;

export default function SystemLogs() {
  const [search, setSearch]             = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [currentPage, setCurrentPage]   = useState(1);

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, moduleFilter]);

  // Alert Super Admins when this page is viewed
  useEffect(() => {
    axios.post('/system-logs/alert-view').catch(console.error);
  }, []);

  const { data: logs = [], refetch } = useQuery<AuditLog[]>({
    queryKey: ['system-logs', search, actionFilter, moduleFilter],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (search)       params.search = search;
      if (actionFilter) params.action = actionFilter;
      if (moduleFilter) params.module = moduleFilter;
      const { data } = await axios.get('/system-logs/', { params });
      return Array.isArray(data) ? data : [];
    },
  });

  const totalPages = useMemo(() => Math.ceil(logs.length / ROWS_PER_PAGE) || 1, [logs.length]);

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ROWS_PER_PAGE;
    return logs.slice(start, start + ROWS_PER_PAGE);
  }, [logs, currentPage]);

  const exportCSV = async () => {
    const params = new URLSearchParams();
    if (search)       params.append('search', search);
    if (actionFilter) params.append('action', actionFilter);
    if (moduleFilter) params.append('module', moduleFilter);
    const res = await axios.get(`/system-logs/export/csv?${params}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'system_audit_logs.csv'; a.click();
  };

  const startCount = logs.length === 0 ? 0 : (currentPage - 1) * ROWS_PER_PAGE + 1;
  const endCount   = Math.min(currentPage * ROWS_PER_PAGE, logs.length);

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#0a1f44]">Audit Log &amp; System Events</h1>
            <p className="text-sm text-slate-500">Real-time audit trail of system activities, logins, updates, deletes &amp; exports</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
            </Button>
            <Button onClick={exportCSV} className="bg-[#2269ff] hover:bg-[#2269ff] text-white" size="sm">
              <Download className="mr-1.5 h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user, IP address, details..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2269ff]"
            />
          </div>

          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff]">
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="export">Export</option>
          </select>

          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:ring-2 focus:ring-[#2269ff]">
            <option value="">All Modules</option>
            <option value="Auth">Auth</option>
            <option value="Students">Students</option>
            <option value="Teachers">Teachers</option>
            <option value="Attendance">Attendance</option>
            <option value="Scores">Scores</option>
            <option value="Teaching Reports">Teaching Reports</option>
            <option value="File Manager">File Manager</option>
          </select>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 shadow-xs">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Module', 'IP Address', 'Event Details'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-slate-500 bg-slate-50">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                      No audit log events found matching criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLogs.map((log, idx) => {
                    const cfg = ACTION_CONFIG[log.action.toLowerCase()] || { label: log.action, badge: 'bg-slate-100 text-[#1c3a73] border-slate-200', icon: ShieldCheck };
                    const Icon = cfg.icon;
                    const formattedDate = new Date(log.timestamp).toLocaleString();

                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-500 font-mono">
                          <Clock className="inline h-3.5 w-3.5 mr-1 text-slate-400" />
                          {formattedDate}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-[#2269ff] font-bold text-xs shrink-0">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-bold text-[#0a1f44] text-xs">{log.user_name || log.user_email}</p>
                              <p className="text-[11px] text-slate-400 font-mono">{log.user_email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${cfg.badge}`}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-xs text-[#1c3a73]">
                          {log.module}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs font-mono text-slate-500">
                          <Globe className="inline h-3 w-3 mr-1 text-slate-400" />
                          {log.ip_address || '127.0.0.1'}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate font-medium" title={log.details || ''}>
                          {log.details || '—'}
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* 10 Rows Pagination Controls Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5">
            <div className="text-xs font-bold text-slate-500">
              Showing <span className="text-[#0a1f44]">{startCount}</span> to <span className="text-[#0a1f44]">{endCount}</span> of <span className="text-[#0a1f44]">{logs.length}</span> entries (១០ ជួរ/ទំព័រ)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 rounded-lg px-2.5 text-xs font-bold text-slate-600 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4 mr-0.5" /> Previous
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-extrabold transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#2269ff] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {pageNum}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                disabled={currentPage >= totalPages}
                className="h-8 rounded-lg px-2.5 text-xs font-bold text-slate-600 disabled:opacity-40">
                Next <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
