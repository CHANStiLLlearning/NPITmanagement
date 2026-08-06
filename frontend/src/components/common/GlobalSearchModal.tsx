import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, GraduationCap, Users, UserCheck, CalendarCheck,
  FileText, Award, Layers, BookOpen, X, ArrowRight, CornerDownLeft
} from 'lucide-react';

interface SearchResultItem {
  id: number;
  title: string;
  subtitle: string;
  link: string;
  type: string;
}

interface GlobalSearchResponse {
  query: string;
  total_results: number;
  categories: {
    students: SearchResultItem[];
    teachers: SearchResultItem[];
    parents: SearchResultItem[];
    attendance: SearchResultItem[];
    teaching_reports: SearchResultItem[];
    scores: SearchResultItem[];
    classes: SearchResultItem[];
    subjects: SearchResultItem[];
  };
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  students:         { icon: GraduationCap, color: 'text-[#2269ff] bg-blue-50',  label: 'Students'          },
  teachers:         { icon: Users,         color: 'text-violet-600 bg-violet-50',  label: 'Teachers'          },
  parents:          { icon: UserCheck,     color: 'text-emerald-600 bg-emerald-50',label: 'Parents & Guardians'},
  attendance:       { icon: CalendarCheck, color: 'text-amber-600 bg-amber-50',    label: 'Attendance Records'},
  teaching_reports: { icon: FileText,      color: 'text-blue-600 bg-blue-50',      label: 'Teaching Reports'  },
  scores:           { icon: Award,         color: 'text-pink-600 bg-pink-50',      label: 'Scores & Cards'    },
  classes:          { icon: Layers,        color: 'text-cyan-600 bg-cyan-50',      label: 'Classes & Grades'  },
  subjects:         { icon: BookOpen,      color: 'text-orange-600 bg-orange-50',  label: 'Subjects'          },
};

export default function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery('');
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get('/search/', { params: { q: query.trim() } });
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (link: string) => {
    navigate(link);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 sm:pt-24">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Search Palette Box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 ">
        
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3 ">
          <Search className="mr-3 h-5 w-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search students, teachers, reports, scores, classes..."
            className="flex-1 bg-transparent text-base text-[#0a1f44] placeholder-slate-400 focus:outline-none "
          />
          {query && (
            <button onClick={() => setQuery('')} className="mr-2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 :bg-[#1c3a73]">
              <X className="h-4 w-4" />
            </button>
          )}
          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-400 ">ESC</span>
        </div>

        {/* Results Body */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {loading && (
            <div className="flex items-center justify-center py-8 text-sm text-slate-400">
              <span className="h-4 w-4 rounded-full border-2 border-[#2269ff] border-t-transparent animate-spin mr-2" />
              Searching system records…
            </div>
          )}

          {!loading && !query.trim() && (
            <div className="py-8 text-center text-xs text-slate-400">
              Type to search across <span className="font-semibold text-slate-600 ">Students, Teachers, Parents, Attendance, Reports, Scores, Classes &amp; Subjects</span>
            </div>
          )}

          {!loading && results && results.total_results === 0 && (
            <div className="py-8 text-center text-sm text-slate-400">
              No matches found for "<span className="font-semibold text-[#1c3a73] ">{query}</span>"
            </div>
          )}

          {!loading && results && results.total_results > 0 && (
            Object.entries(results.categories).map(([catKey, items]) => {
              if (!items || items.length === 0) return null;
              const catConfig = CATEGORY_ICONS[catKey] || { icon: Search, color: 'text-slate-600 bg-slate-50', label: catKey };
              const Icon = catConfig.icon;

              return (
                <div key={catKey} className="space-y-1">
                  <div className="flex items-center gap-1.5 px-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Icon className="h-3.5 w-3.5 text-[#2269ff]" />
                    <span>{catConfig.label}</span>
                    <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.2 text-[10px] text-slate-500 ">{items.length}</span>
                  </div>

                  <div className="space-y-1">
                    {items.map((item) => (
                      <div
                        key={`${catKey}-${item.id}`}
                        onClick={() => handleSelect(item.link)}
                        className="group flex items-center justify-between rounded-xl p-2.5 hover:bg-blue-50/70 transition-all cursor-pointer :bg-[#1c3a73]/60">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${catConfig.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[#0a1f44] truncate group-hover:text-[#2269ff]">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-[#2269ff] opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>Jump to</span>
                          <CornerDownLeft className="h-3.5 w-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2 text-[11px] text-slate-400 flex items-center justify-between ">
          <span>Global Search Engine</span>
          <span className="flex items-center gap-1">Press <kbd className="rounded bg-slate-200 px-1 font-mono text-[10px] text-slate-600 ">Ctrl + K</kbd> anytime to open</span>
        </div>
      </motion.div>
    </div>
  );
}
