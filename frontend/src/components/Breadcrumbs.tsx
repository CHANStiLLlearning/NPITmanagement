import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAMES: Record<string, string> = {
  'dashboard': 'Dashboard',
  'students': 'Student Management',
  'teachers': 'Teacher Management',
  'qr-attendance': 'QR Attendance',
  'attendance': 'Attendance',
  'teaching-reports': 'Teaching Reports',
  'scores': 'Score Management',
  'reports': 'Attendance Reports',
  'academic-year': 'Academic Management',
  'classes': 'Academic Management',
  'subjects': 'Academic Management',
  'timetable': 'Academic Management',
  'analytics': 'Analytics',
  'file-manager': 'File Manager',
  'system-logs': 'Audit Logs',
  'users': 'User Management',
  'settings': 'School Settings',
};

export function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-[#2269ff] transition-colors">
        <Home className="h-3.5 w-3.5" />
        <span>Home</span>
      </Link>

      {pathnames.map((name, idx) => {
        const routeTo = `/${pathnames.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathnames.length - 1;
        const displayName = ROUTE_NAMES[name] || name.replace('-', ' ');

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="h-3 w-3 text-slate-300 " />
            {isLast ? (
              <span className="font-semibold text-[#1c3a73] capitalize">
                {displayName}
              </span>
            ) : (
              <Link to={routeTo} className="hover:text-[#2269ff] capitalize transition-colors">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
