import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import Register from '@/pages/auth/Register';
import Dashboard from '@/pages/dashboard/Dashboard';
import Students from '@/pages/management/Students';
import Teachers from '@/pages/management/Teachers';
import ParentsManager from '@/pages/management/ParentsManager';
import UsersManager from '@/pages/management/UsersManager';
import SchoolSettings from '@/pages/management/SchoolSettings';
import Academic from '@/pages/academic/Academic';
import Scores from '@/pages/academic/Scores';
import TeachingReports from '@/pages/academic/TeachingReports';
import AttendanceReports from '@/pages/attendance/AttendanceReports';
import QRAttendance from '@/pages/attendance/QRAttendance';
import Analytics from '@/pages/system/Analytics';
import FileManager from '@/pages/system/FileManager';
import SystemLogs from '@/pages/system/SystemLogs';
import ReportsCenter from '@/pages/system/ReportsCenter';
import ProfilePage from '@/pages/management/ProfilePage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
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
      <Route path="/academic-year" element={<ProtectedRoute><Academic /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersManager /></ProtectedRoute>} />
      <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/parents" element={<ProtectedRoute><ParentsManager /></ProtectedRoute>} />
      <Route path="/classes" element={<ProtectedRoute><Academic /></ProtectedRoute>} />
      <Route path="/subjects" element={<ProtectedRoute><Academic /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceReports /></ProtectedRoute>} />
      <Route path="/qr-attendance" element={<ProtectedRoute><QRAttendance /></ProtectedRoute>} />
      <Route path="/teaching-reports" element={<ProtectedRoute><TeachingReports /></ProtectedRoute>} />
      <Route path="/timetable" element={<ProtectedRoute><Academic /></ProtectedRoute>} />
      <Route path="/scores" element={<ProtectedRoute><Scores /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportsCenter /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
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
