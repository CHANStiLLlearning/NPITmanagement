import React, { useState, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { getMediaUrl } from '@/config/constants';
import {
  LayoutDashboard,
  Settings,
  CalendarDays,
  Users,
  UserSquare2,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Clock,
  Activity,
  LogOut,
  UserCircle2,
  GripVertical,
  RotateCcw,
} from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', khmer: 'ទំព័រដើម', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'My Profile', khmer: 'គណនីរបស់ខ្ញុំ', href: '/profile', icon: UserCircle2, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'School Settings', khmer: 'ការកំណត់សាលា', href: '/settings', icon: Settings, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Users', khmer: 'អ្នកប្រើប្រាស់', href: '/users', icon: Users, allowedRoles: ['super_admin'] },
  { name: 'Teachers', khmer: 'លោកគ្រូ-អ្នកគ្រូ', href: '/teachers', icon: UserSquare2, allowedRoles: ['super_admin', 'admin', 'principal'] },
  { name: 'Students', khmer: 'សិស្សទាំងអស់', href: '/students', icon: GraduationCap, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher'] },
  { name: 'Subjects', khmer: 'មុខវិជ្ជា', href: '/subjects', icon: BookOpen, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student'] },
  { name: 'Attendance', khmer: 'វត្តមានសិស្ស', href: '/attendance', icon: CheckSquare, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'System Logs', khmer: 'កំណត់ហេតុប្រព័ន្ធ', href: '/system-logs', icon: Activity, allowedRoles: ['super_admin'] },
];

interface SidebarProps {
  onItemClick?: () => void;
  className?: string;
}

export function Sidebar({ onItemClick, className }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';
  const storageKey = `sidebar_menu_order_${user?.id || 'default'}`;

  // Menu order state initialized from localStorage
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return navigation.map(item => item.href);
  });

  // Re-sync storage key when user changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMenuOrder(parsed);
          return;
        }
      }
    } catch {}
    setMenuOrder(navigation.map(item => item.href));
  }, [storageKey]);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filter & sort navigation list
  const filteredNavigation = useMemo(() => {
    const allowed = navigation.filter(item => item.allowedRoles.includes(role));
    return [...allowed].sort((a, b) => {
      const indexA = menuOrder.indexOf(a.href);
      const indexB = menuOrder.indexOf(b.href);
      if (indexA === -1 && indexB === -1) return 0;
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [role, menuOrder]);

  const isCustomized = useMemo(() => {
    const defaultAllowedHrefs = navigation.filter(i => i.allowedRoles.includes(role)).map(i => i.href);
    const currentHrefs = filteredNavigation.map(i => i.href);
    return JSON.stringify(defaultAllowedHrefs) !== JSON.stringify(currentHrefs);
  }, [role, filteredNavigation]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updatedList = [...filteredNavigation];
    const [draggedItem] = updatedList.splice(draggedIndex, 1);
    updatedList.splice(dropIndex, 0, draggedItem);

    const newOrder = updatedList.map(item => item.href);

    // Keep any menu items not visible to current role at the end to preserve full list order
    navigation.forEach(item => {
      if (!newOrder.includes(item.href)) {
        newOrder.push(item.href);
      }
    });

    setMenuOrder(newOrder);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
    } catch {}

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleResetOrder = () => {
    const defaultOrder = navigation.map(item => item.href);
    setMenuOrder(defaultOrder);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return (
    <div className={cn("flex h-full w-72 flex-col bg-white border-r border-blue-100 shadow-sm shrink-0 select-none", className)}>
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3.5 px-5 py-4 border-b border-blue-100 border-t-4 border-t-[#ec171c] bg-white">
        <NPITLogo size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-[#2269ff] leading-tight truncate">វិទ្យាស្ថានជាតិ NPIT</h1>
          <p className="text-[11px] font-bold text-[#ec171c] tracking-wider uppercase truncate">TECHO SEN INSTITUTE</p>
        </div>
      </div>
      
      {/* Nav Menu Header / Reset Bar */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
          Navigation Menu {isCustomized ? '(Customized)' : ''}
        </span>
        {isCustomized && (
          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1 text-[10px] font-bold text-[#2269ff] hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md transition-colors"
            title="Reset menu order to default"
          >
            <RotateCcw className="h-3 w-3" /> Reset Order
          </button>
        )}
      </div>

      {/* Nav Menu with Drag & Drop */}
      <div className="flex-1 overflow-y-auto py-2 bg-white">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item, index) => {
            const isDragging = draggedIndex === index;
            const isTarget = dragOverIndex === index;

            return (
              <div
                key={item.name}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'relative transition-all duration-150 rounded-xl',
                  isDragging && 'opacity-30 scale-95 border-2 border-dashed border-blue-400',
                  isTarget && !isDragging && 'border-t-2 border-t-[#2269ff] pt-1 bg-blue-50/40'
                )}
              >
                <NavLink
                  to={item.href}
                  onClick={onItemClick}
                  className={({ isActive }) =>
                    cn(
                      isActive
                        ? 'bg-blue-50 text-[#2269ff] font-bold border-r-4 border-[#2269ff]'
                        : 'text-[#1c3a73] hover:bg-blue-50/50 hover:text-[#2269ff]',
                      'group flex items-center rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all cursor-grab active:cursor-grabbing'
                    )
                  }
                >
                  <item.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 text-[#2269ff]"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold whitespace-nowrap">
                    {role === 'student' && item.href === '/attendance' ? 'វត្តមានរបស់ខ្ញុំ' : item.khmer}
                  </span>
                </NavLink>
              </div>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-blue-100 p-4 bg-white">
        <button
          onClick={() => { navigate('/profile'); onItemClick?.(); }}
          className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-blue-50 transition-colors group mb-2"
        >
          {user?.photo_url ? (
            <img
              src={getMediaUrl(user.photo_url)}
              alt="Profile"
              className="h-10 w-10 rounded-full object-cover border-2 border-blue-100 group-hover:border-[#2269ff] shrink-0 transition-all"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#2269ff] to-blue-700 text-sm font-bold text-white shrink-0">
              {user?.first_name?.[0] ?? user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="flex-1 truncate text-left">
            <p className="truncate text-sm font-bold text-[#0a1f44]">
              {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.email}
            </p>
            <p className="truncate text-xs font-semibold text-[#2269ff] uppercase tracking-wider">
              {user?.role?.replace('_', ' ')}
            </p>
          </div>
          <UserCircle2 className="h-4 w-4 text-slate-400 group-hover:text-[#2269ff] shrink-0 transition-colors" />
        </button>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start text-sm font-semibold text-[#ec171c] border-red-200 hover:text-red-700 hover:bg-red-50 py-2"
          onClick={() => { logout(); onItemClick?.(); }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ចាកចេញ (Sign out)
        </Button>
      </div>

      {/* Reset Order Confirmation Modal Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-blue-100 text-center select-none">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
              <RotateCcw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-[#0a1f44]">កំណត់លំដាប់ម៉ឺនុយឡើងវិញ?</h3>
            <p className="text-xs text-slate-500 font-medium mt-1.5 mb-5 leading-relaxed">
              Do you want to reset the menu order to default? Your customized menu layout will be restored.
            </p>
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl"
              >
                បោះបង់ (Cancel)
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleResetOrder();
                  setShowResetConfirm(false);
                }}
                className="flex-1 font-bold bg-[#ec171c] hover:bg-red-700 text-white rounded-xl shadow-sm"
              >
                កំណត់ឡើងវិញ (Confirm)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
