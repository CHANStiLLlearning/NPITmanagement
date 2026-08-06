import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Settings,
  CalendarDays,
  Users,
  UserSquare2,
  GraduationCap,
  UsersRound,
  School,
  BookOpen,
  CheckSquare,
  QrCode,
  FileText,
  Clock,
  Award,
  BarChart3,
  PieChart,
  Activity,
  LogOut,
  UserCircle2,
} from 'lucide-react';
import { NPITLogo } from '@/components/common/NPITLogo';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Dashboard', khmer: 'ទំព័រដើម', href: '/dashboard', icon: LayoutDashboard, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'My Profile', khmer: 'គណនីរបស់ខ្ញុំ', href: '/profile', icon: UserCircle2, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'School Settings', khmer: 'ការកំណត់សាលា', href: '/settings', icon: Settings, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Users', khmer: 'អ្នកប្រើប្រាស់', href: '/users', icon: Users, allowedRoles: ['super_admin'] },
  { name: 'Teachers', khmer: 'លោកគ្រូ-អ្នកគ្រូ', href: '/teachers', icon: UserSquare2, allowedRoles: ['super_admin', 'admin', 'principal'] },
  { name: 'Students', khmer: 'សិស្សានុសិស្ស', href: '/students', icon: GraduationCap, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher'] },
  { name: 'Parents', khmer: 'អាណាព្យាបាល', href: '/parents', icon: UsersRound, allowedRoles: ['super_admin', 'admin'] },
  { name: 'Attendance', khmer: 'វត្តមានសិស្ស', href: '/attendance', icon: CheckSquare, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'QR Attendance', khmer: 'ស្កេន QR វត្តមាន', href: '/qr-attendance', icon: QrCode, allowedRoles: ['super_admin', 'admin', 'teacher', 'student'] },
  { name: 'Teaching Reports', khmer: 'របាយការណ៍បង្រៀន', href: '/teaching-reports', icon: FileText, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher'] },
  { name: 'Scores', khmer: 'ពិន្ទុ & និទ្ទេស', href: '/scores', icon: Award, allowedRoles: ['super_admin', 'admin', 'principal', 'teacher', 'student', 'parent'] },
  { name: 'Reports', khmer: 'របាយការណ៍សរុប', href: '/reports', icon: BarChart3, allowedRoles: ['super_admin', 'admin', 'principal', 'student', 'parent'] },
  { name: 'Analytics', khmer: 'វិភាគទិន្នន័យ', href: '/analytics', icon: PieChart, allowedRoles: ['super_admin', 'admin', 'principal'] },
  { name: 'System Logs', khmer: 'កំណត់ហេតុប្រព័ន្ធ', href: '/system-logs', icon: Activity, allowedRoles: ['super_admin'] },
];

export function Sidebar() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role || 'student';

  const filteredNavigation = navigation.filter(item => item.allowedRoles.includes(role));

  return (
    <div className="flex h-full w-72 flex-col bg-white border-r border-blue-100 shadow-sm">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3.5 px-5 py-4 border-b border-blue-100 border-t-4 border-t-[#ec171c] bg-white">
        <NPITLogo size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-[#2269ff] leading-tight truncate">វិទ្យាស្ថានជាតិ NPIT</h1>
          <p className="text-[11px] font-bold text-[#ec171c] tracking-wider uppercase truncate">TECHO SEN INSTITUTE</p>
        </div>
      </div>
      
      {/* Nav Menu - Regular Medium Reading Weight */}
      <div className="flex-1 overflow-y-auto py-4 bg-white">
        <nav className="space-y-1 px-3">
          {filteredNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? 'bg-blue-50 text-[#2269ff] font-bold border-r-4 border-[#2269ff]'
                    : 'text-[#1c3a73] hover:bg-blue-50/50 hover:text-[#2269ff]',
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all'
                )
              }
            >
              <div className="flex items-center">
                <item.icon
                  className="mr-3 h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110 text-[#2269ff]"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold">{item.khmer}</span>
              </div>
              <span className="text-xs text-slate-400 font-normal ml-1 hidden group-hover:inline">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-blue-100 p-4 bg-white">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-3 w-full rounded-xl p-2 hover:bg-blue-50 transition-colors group mb-2"
        >
          {user?.photo_url ? (
            <img
              src={`http://localhost:8000${user.photo_url}`}
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
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          ចាកចេញ (Sign out)
        </Button>
      </div>
    </div>
  );
}
