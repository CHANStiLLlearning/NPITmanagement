import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import Students from '@/pages/Students';
import Teachers from '@/pages/Teachers';
import QRAttendance from '@/pages/QRAttendance';
import TeachingReports from '@/pages/TeachingReports';
import Scores from '@/pages/Scores';
import AttendanceReports from '@/pages/AttendanceReports';
import Academic from '@/pages/Academic';
import Analytics from '@/pages/Analytics';
import FileManager from '@/pages/FileManager';
import SystemLogs from '@/pages/SystemLogs';
import ReportsCenter from '@/pages/ReportsCenter';
import SchoolSettings from '@/pages/SchoolSettings';
import UsersManager from '@/pages/UsersManager';
import ParentsManager from '@/pages/ParentsManager';

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
