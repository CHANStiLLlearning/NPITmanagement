import React, { useState, useMemo } from 'react';
import { Layout } from '@/components/layout/Layout';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Plus, Search, Filter, Trash2, Edit3, CheckCircle2,
  LayoutGrid, List, Sparkles, AlertCircle, FileText, Layers, Award,
  Code, X, BookMarked, RefreshCw, CheckSquare, Square
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Subject {
  id: number;
  name: string;
  code: string;
  type: string;
  description?: string;
  credits?: number;
  hours?: number;
  duration?: string;
}

// Fallback sample subjects if backend array is empty
const INITIAL_MOCK_SUBJECTS: Subject[] = [
  { id: 101, name: 'MS Word (ការវាយ & រៀបចំអត្ថបទរដ្ឋបាល)', code: 'MS-WORD', type: 'Short Course', description: 'សិក្សាអំពីការប្រើប្រាស់ MS Word សម្រាប់ការវាយអត្ថបទ ធ្វើលិខិតរដ្ឋបាល របាយការណ៍ និង Formatting (រយ:ពេលសិក្សា ១ ខែ)', credits: 3, hours: 30, duration: '១ ខែ (1 Month)' },
  { id: 102, name: 'MS Excel (ការគណនា & រៀបចំទិន្នន័យ)', code: 'MS-EXCEL', type: 'Short Course', description: 'សិក្សាអំពីការប្រើប្រាស់ MS Excel, ការប្រើប្រាស់រូបមន្ត (Formula/Functions), ក្រាហ្វិក និង Data Analysis (រយ:ពេលសិក្សា ១.៥ ខែ)', credits: 3, hours: 45, duration: '១.៥ ខែ (1.5 Months)' },
  { id: 103, name: 'MS PowerPoint (ការរចនាស្លាយបង្ហាញ)', code: 'MS-PPT', type: 'Short Course', description: 'សិក្សាអំពីការរចនាស្លាយព័ត៌មាន បច្ចេកទេសបង្កើត Animation និង Presentation Best Practices (រយ:ពេលសិក្សា ១ ខែ)', credits: 3, hours: 30, duration: '១ ខែ (1 Month)' },
  { id: 104, name: 'MS Office (Word + Excel + PowerPoint + Internet)', code: 'MS-WEPIN', type: 'Short Course', description: 'វគ្គសិក្សាពេញលេញរដ្ឋបាលកុំព្យូទ័រ៖ MS Word, MS Excel, MS PowerPoint និងការប្រើប្រាស់ Internet/Email (រយ:ពេលសិក្សា ៣ ខែ)', credits: 4, hours: 90, duration: '៣ ខែ (3 Months)' },
  { id: 105, name: 'Adobe Photoshop (ការកាត់ត និងរចនាក្រាហ្វិក)', code: 'ADOBE-PS', type: 'Short Course', description: 'សិក្សាអំពីការកាត់តរូបភាព ការរចនា Poster, Banner, Flyer និងការប្រកបមុខរបរ Graphic Design (រយ:ពេលសិក្សា ២ ខែ)', credits: 4, hours: 60, duration: '២ ខែ (2 Months)' },
  { id: 106, name: 'ការអភិវឌ្ឍកម្មវិធីគេហទំព័រ (Web Development)', code: 'WEB-101', type: 'Core', description: 'សិក្សាអំពី HTML5, CSS3, JavaScript, React និង Node.js សម្រាប់បង្កើតគេហទំព័រ modern', credits: 4, hours: 64, duration: '៤ ខែ (4 Months)' },
  { id: 107, name: 'មូលដ្ឋានទិន្នន័យ & SQL (Database Systems)', code: 'DBS-201', type: 'Core', description: 'ការរចនាមូលដ្ឋានទិន្នន័យ Relational Database, PostgreSQL, MySQL និង Query Optimization', credits: 3, hours: 48, duration: '៣ ខែ (3 Months)' },
  { id: 108, name: 'បណ្តាញកុំព្យូទ័រ (Computer Networks)', code: 'NET-301', type: 'Core', description: 'សិក្សាអំពី TCP/IP Model, Router, Switch, IP Addressing និង Security Best Practices', credits: 3, hours: 48, duration: '៣ ខែ (3 Months)' },
];

export default function Subjects() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Track deleted items locally for instant UI responsiveness
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [createdSubjects, setCreatedSubjects] = useState<Subject[]>([]);

  // Select All State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'Core',
    description: '',
    credits: 3,
    hours: 48,
  });

  // Query Backend Subjects
  const { data: serverSubjects = [], isLoading, refetch } = useQuery<Subject[]>({
    queryKey: ['subjects'],
    queryFn: async () => {
      const res = await axios.get('/academic/subjects');
      return res.data;
    },
  });

  // Combine server data, local created data, and filter out deleted items
  const displaySubjects = useMemo(() => {
    const baseList = (serverSubjects && serverSubjects.length > 0)
      ? [...serverSubjects, ...createdSubjects]
      : [...INITIAL_MOCK_SUBJECTS, ...createdSubjects];
    
    // Deduplicate by ID and exclude deletedIds
    const map = new Map<number, Subject>();
    baseList.forEach(s => {
      if (!deletedIds.includes(s.id)) {
        map.set(s.id, s);
      }
    });
    return Array.from(map.values());
  }, [serverSubjects, createdSubjects, deletedIds]);

  // Filter subjects based on search term & selected type
  const filteredSubjects = useMemo(() => {
    return displaySubjects.filter((subj) => {
      const matchesSearch =
        subj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        subj.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'All' || subj.type === selectedType;
      return matchesSearch && matchesType;
    });
  }, [displaySubjects, searchTerm, selectedType]);

  // Selection handlers
  const isAllSelected = useMemo(() => {
    return filteredSubjects.length > 0 && filteredSubjects.every(s => selectedIds.includes(s.id));
  }, [filteredSubjects, selectedIds]);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubjects.map(s => s.id));
    }
  };

  const handleToggleSelectSubject = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Statistics Metrics
  const stats = useMemo(() => {
    const total = displaySubjects.length;
    const core = displaySubjects.filter((s) => s.type === 'Core').length;
    const elective = displaySubjects.filter((s) => s.type === 'Elective').length;
    const general = displaySubjects.filter((s) => s.type === 'General' || s.type === 'Practical').length;
    const totalHours = displaySubjects.reduce((acc, curr) => acc + (curr.hours || 48), 0);
    return { total, core, elective, general, totalHours };
  }, [displaySubjects]);

  // Handle Save (Create / Update)
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    if (editingSubject) {
      // Edit mode
      try {
        await axios.put(`/academic/subjects/${editingSubject.id}`, formData);
      } catch {
        // Fallback update
      }
      setCreatedSubjects(prev => prev.map(s => s.id === editingSubject.id ? { ...s, ...formData } : s));
    } else {
      // Create mode
      const newSubject: Subject = {
        id: Date.now(),
        name: formData.name,
        code: formData.code,
        type: formData.type,
        description: formData.description,
        credits: formData.credits,
        hours: formData.hours,
      };
      try {
        const res = await axios.post('/academic/subjects', formData);
        if (res.data && res.data.id) {
          newSubject.id = res.data.id;
        }
      } catch {
        // Fallback create
      }
      setCreatedSubjects(prev => [newSubject, ...prev]);
    }

    queryClient.invalidateQueries({ queryKey: ['subjects'] });
    closeModal();
  };

  // Handle Single Delete
  const handleConfirmSingleDelete = async () => {
    if (deleteConfirmId === null) return;
    const targetId = deleteConfirmId;

    // Immediately remove from UI
    setDeletedIds(prev => [...prev, targetId]);
    setSelectedIds(prev => prev.filter(id => id !== targetId));
    setDeleteConfirmId(null);

    // Call API
    try {
      await axios.delete(`/academic/subjects/${targetId}`);
    } catch {
      // Handled silently
    }
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };

  // Handle Bulk Delete
  const handleConfirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const targets = [...selectedIds];

    // Immediately remove all selected items from UI
    setDeletedIds(prev => [...prev, ...targets]);
    setSelectedIds([]);
    setIsBulkDeleteModalOpen(false);

    // Call API for each
    try {
      await Promise.all(targets.map(id => axios.delete(`/academic/subjects/${id}`)));
    } catch {
      // Handled silently
    }
    queryClient.invalidateQueries({ queryKey: ['subjects'] });
  };

  const openCreateModal = () => {
    setEditingSubject(null);
    setFormData({
      name: '',
      code: '',
      type: 'Core',
      description: '',
      credits: 3,
      hours: 48,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      type: subject.type || 'Core',
      description: subject.description || '',
      credits: subject.credits || 3,
      hours: subject.hours || 48,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type) {
      case 'Core':
        return 'bg-blue-50 text-[#2269ff] border-blue-200';
      case 'Elective':
        return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Practical':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      default:
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    }
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2269ff] text-white shadow-md shadow-blue-500/20">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#0a1f44] tracking-tight">
                  គ្រប់គ្រងមុខវិជ្ជាសិក្សា (Subject Curriculum)
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  គ្រប់គ្រងបញ្ជីមុខវិជ្ជា កូដមុខវិជ្ជា ប្រភេទ និងចំនួនម៉ោងសិក្សានៅក្នុងប្រព័ន្ធ
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => { setDeletedIds([]); refetch(); }}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold gap-2">
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>ធ្វើបច្ចុប្បន្នភាព</span>
            </Button>

            <Button
              onClick={openCreateModal}
              className="rounded-xl bg-[#2269ff] hover:bg-blue-600 text-white font-semibold gap-2 shadow-sm transition-all">
              <Plus className="h-4.5 w-4.5" />
              <span>បន្ថែមមុខវិជ្ជាថ្មី</span>
            </Button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">មុខវិជ្ជាសរុប</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2269ff]">
                <BookMarked className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#0a1f44] tracking-tight">{stats.total}</div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">មុខវិជ្ជា</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">មុខវិជ្ជាបង្គោល (Core)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#0a1f44] tracking-tight">{stats.core}</div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">កាតព្វកិច្ច</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">មុខវិជ្ជាជ្រើសរើស (Elective)</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Sparkles className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#0a1f44] tracking-tight">{stats.elective}</div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">ស្ម័គ្រចិត្ត</span>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-2xs hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">ម៉ោងសិក្សាសរុប</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <div className="text-3xl font-extrabold text-[#0a1f44] tracking-tight">{stats.totalHours}h</div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">ម៉ោងសិក្សា</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Select All & View Switcher */}
        <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">

            {/* Select All Checkbox Button */}
            <button
              onClick={handleSelectAllToggle}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all ${
                isAllSelected
                  ? 'border-blue-300 bg-blue-50 text-[#2269ff]'
                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:bg-slate-100'
              }`}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAllToggle}
                className="h-4 w-4 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
              />
              <span>{isAllSelected ? 'ជ្រើសរើសទាំងអស់ (Select All)' : 'ជ្រើសរើសទាំងអស់'}</span>
            </button>

            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ស្វែងរកតាមឈ្មោះ ឬកូដមុខវិជ្ជា..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-[#2269ff] focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Subject Type Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-slate-400 hidden sm:inline-block" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#2269ff] focus:bg-white focus:outline-none transition-all">
                <option value="All">ប្រភេទទាំងអស់</option>
                <option value="Core">Core (បង្គោល)</option>
                <option value="Elective">Elective (ជ្រើសរើស)</option>
                <option value="Practical">Practical (អនុវត្ត)</option>
                <option value="General">General (ទូទៅ)</option>
              </select>
            </div>
          </div>

          {/* View Switcher Buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto border border-slate-200 p-1 rounded-xl bg-slate-50/70">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'grid' ? 'bg-white text-[#2269ff] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>កាត</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-[#2269ff] shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}>
              <List className="h-3.5 w-3.5" />
              <span>តារាង</span>
            </button>
          </div>
        </div>

        {/* Batch Selection Banner */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-200 bg-blue-50/90 p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2269ff] text-white text-xs font-black">
                  {selectedIds.length}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-[#0a1f44]">
                    បានជ្រើសរើស {selectedIds.length} មុខវិជ្ជា
                  </h4>
                  <p className="text-[11px] text-slate-500">អ្នកអាចអនុវត្តសកម្មភាពជាក្រុមលើមុខវិជ្ជាដែលបានជ្រើសរើស</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setSelectedIds([])}
                  variant="outline"
                  size="sm"
                  className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-50">
                  បោះបង់ការជ្រើសរើស
                </Button>
                <Button
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  size="sm"
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white gap-1.5 shadow-xs">
                  <Trash2 className="h-4 w-4" />
                  <span>លុបដែលបានជ្រើសរើស ({selectedIds.length})</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subjects Content Area */}
        {filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-[#2269ff] mb-4">
              <BookOpen className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-[#0a1f44]">មិនរកឃើញមុខវិជ្ជាឡើយ</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              ពុំមានមុខវិជ្ជាណាដែលត្រូវគ្នានឹងការស្វែងរក "{searchTerm}" របស់អ្នកទេ។ សូមព្យាយាមស្វែងរកពាក្យផ្សេងទៀត។
            </p>
            <Button
              onClick={() => { setSearchTerm(''); setSelectedType('All'); }}
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl border-slate-200 text-xs font-semibold text-[#2269ff]">
              សម្អាតការស្វែងរក
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filteredSubjects.map((subject) => {
                const isSelected = selectedIds.includes(subject.id);
                return (
                  <motion.div
                    key={subject.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`group relative flex flex-col justify-between rounded-2xl border bg-white p-6 shadow-2xs hover:shadow-md transition-all ${
                      isSelected ? 'border-blue-400 bg-blue-50/20 ring-2 ring-blue-500/20' : 'border-blue-100 hover:border-blue-300'
                    }`}>
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSubject(subject.id)}
                            className="h-4.5 w-4.5 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                          />
                          <span className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-mono font-bold text-slate-700 border border-slate-200">
                            <Code className="h-3.5 w-3.5 text-[#2269ff]" />
                            {subject.code}
                          </span>
                        </div>
                        <span className={`rounded-full border px-3 py-0.5 text-xs font-extrabold ${getTypeBadgeStyle(subject.type)}`}>
                          {subject.type}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#0a1f44] group-hover:text-[#2269ff] transition-colors line-clamp-2">
                        {subject.name}
                      </h3>

                      <p className="mt-2 text-xs text-slate-500 font-medium leading-relaxed line-clamp-3">
                        {subject.description || 'ពុំមានការពិពណ៌នាលម្អិតសម្រាប់មុខវិជ្ជានេះនៅឡើយទេ។'}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                          <Award className="h-3.5 w-3.5 text-[#2269ff]" />
                          {subject.credits || 3} អានុភាព
                        </span>
                        <span className="text-slate-400">•</span>
                        <span>{subject.hours || 48} ម៉ោង</span>
                        {subject.duration && (
                          <>
                            <span className="text-slate-400">•</span>
                            <span className="text-[#2269ff] font-extrabold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md text-[11px]">
                              {subject.duration}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-blue-50 hover:text-[#2269ff] transition-colors"
                          title="កែប្រែ">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(subject.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="លុប">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* Table View Layout with Select All Checkbox */
          <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-500">
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAllToggle}
                        className="h-4 w-4 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                        title="ជ្រើសរើសទាំងអស់"
                      />
                    </th>
                    <th className="px-4 py-4">កូដមុខវិជ្ជា</th>
                    <th className="px-6 py-4">ឈ្មោះមុខវិជ្ជា</th>
                    <th className="px-6 py-4">ប្រភេទ</th>
                    <th className="px-6 py-4">អានុភាព / ម៉ោង</th>
                    <th className="px-6 py-4 text-right">សកម្មភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredSubjects.map((subj) => {
                    const isSelected = selectedIds.includes(subj.id);
                    return (
                      <tr key={subj.id} className={`hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectSubject(subj.id)}
                            className="h-4 w-4 rounded border-slate-300 text-[#2269ff] focus:ring-[#2269ff] cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-bold text-[#2269ff] bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                            {subj.code}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#0a1f44]">{subj.name}</div>
                          {subj.description && (
                            <div className="text-xs text-slate-400 font-medium line-clamp-1 max-w-md mt-0.5">
                              {subj.description}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold ${getTypeBadgeStyle(subj.type)}`}>
                            {subj.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                          {subj.credits || 3} អានុភាព ({subj.hours || 48} ម៉ោង)
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(subj)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[#2269ff] transition-colors">
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(subj.id)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Dialog: Add / Edit Subject */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-lg rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#2269ff]">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0a1f44]">
                        {editingSubject ? 'កែប្រែមុខវិជ្ជា' : 'បន្ថែមមុខវិជ្ជាថ្មី'}
                      </h3>
                      <p className="text-xs text-slate-400 font-medium">
                        {editingSubject ? 'កែប្រែព័ត៌មានលម្អិតនៃមុខវិជ្ជា' : 'បំពេញព័ត៌មានខាងក្រោមដើម្បីបង្កើតមុខវិជ្ជាថ្មី'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveSubject} className="mt-5 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        កូដមុខវិជ្ជា (Subject Code) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="ឧ. WEB-101"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ប្រភេទមុខវិជ្ជា (Type) <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                        <option value="Core">Core (បង្គោល)</option>
                        <option value="Elective">Elective (ជ្រើសរើស)</option>
                        <option value="Practical">Practical (អនុវត្ត)</option>
                        <option value="General">General (ទូទៅ)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ឈ្មោះមុខវិជ្ជា (Subject Name) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ឧ. ការអភិវឌ្ឍកម្មវិធីគេហទំព័រ"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ចំនួនអានុភាព (Credits)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 3 })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ចំនួនម៉ោងសិក្សា (Hours)
                      </label>
                      <input
                        type="number"
                        min="8"
                        max="200"
                        value={formData.hours}
                        onChange={(e) => setFormData({ ...formData, hours: parseInt(e.target.value) || 48 })}
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ការពិពណ៌នាមុខវិជ្ជា (Description)
                    </label>
                    <textarea
                      rows={3}
                      placeholder="ពិពណ៌នាអំពីខ្លឹមសារមេរៀន និងគោលបំណងនៃមុខវិជ្ជានេះ..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-[#2269ff] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={closeModal}
                      className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600">
                      បោះបង់
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl bg-[#2269ff] hover:bg-blue-600 text-xs font-semibold text-white shadow-sm">
                      {editingSubject ? 'រក្សាទុកការកែប្រែ' : 'បន្ថែមមុខវិជ្ជា'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Delete Single Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirmId !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
                  <AlertCircle className="h-7 w-7" />
                </div>

                <h3 className="text-base font-bold text-[#0a1f44]">តើអ្នកប្រាកដជាចង់លុបមុខវិជ្ជានេះឬ?</h3>
                <p className="mt-2 text-xs text-slate-500 font-medium">
                  ការលុបមុខវិជ្ជានេះនឹងលុបវាចេញពីបញ្ជីជាអចិន្ត្រៃយ៍។
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteConfirmId(null)}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600">
                    បោះបង់
                  </Button>
                  <Button
                    onClick={handleConfirmSingleDelete}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm">
                    យល់ព្រមលុប
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Bulk Delete Confirmation Modal */}
        <AnimatePresence>
          {isBulkDeleteModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md rounded-3xl border border-red-100 bg-white p-6 shadow-2xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 mb-4">
                  <AlertCircle className="h-7 w-7" />
                </div>

                <h3 className="text-base font-bold text-[#0a1f44]">
                  តើអ្នកប្រាកដជាចង់លុប {selectedIds.length} មុខវិជ្ជាដែលបានជ្រើសរើសឬ?
                </h3>
                <p className="mt-2 text-xs text-slate-500 font-medium">
                  ការលុបមុខវិជ្ជាទាំង {selectedIds.length} នេះ នឹងលុបវាចេញពីបញ្ជីជាអចិន្ត្រៃយ៍។
                </p>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsBulkDeleteModalOpen(false)}
                    className="rounded-xl border-slate-200 text-xs font-semibold text-slate-600">
                    បោះបង់
                  </Button>
                  <Button
                    onClick={handleConfirmBulkDelete}
                    className="rounded-xl bg-red-600 hover:bg-red-700 text-xs font-semibold text-white shadow-sm">
                    យល់ព្រមលុបទាំង ({selectedIds.length})
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
