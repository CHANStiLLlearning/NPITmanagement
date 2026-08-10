import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import Students from '@/pages/management/Students';
import Teachers from '@/pages/management/Teachers';
import UsersManager from '@/pages/management/UsersManager';
import SchoolSettings from '@/pages/management/SchoolSettings';
import AttendanceReports from '@/pages/attendance/AttendanceReports';
import FileManager from '@/pages/system/FileManager';
import SystemLogs from '@/pages/system/SystemLogs';
import ProfilePage from '@/pages/management/ProfilePage';
import Subjects from '@/pages/academic/Subjects';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { token, user } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      
      {/* 100% Fully Working System Modules */}
      <Route path="/settings" element={<ProtectedRoute><SchoolSettings /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersManager /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute allowedRoles={['super_admin', 'admin', 'principal', 'teacher']}><Subjects /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
      <Route path="/system-logs" element={<ProtectedRoute><SystemLogs /></ProtectedRoute>} />
      <Route path="/file-manager" element={<ProtectedRoute><FileManager /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
