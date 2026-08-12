import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Lazy load all pages for optimal performance (Code Splitting)
const Login = lazy(() => import('@/pages/auth/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard'));
const Students = lazy(() => import('@/pages/management/Students'));
const Teachers = lazy(() => import('@/pages/management/Teachers'));
const UsersManager = lazy(() => import('@/pages/management/UsersManager'));
const SchoolSettings = lazy(() => import('@/pages/management/SchoolSettings'));
const AttendanceReports = lazy(() => import('@/pages/attendance/AttendanceReports'));
const FileManager = lazy(() => import('@/pages/system/FileManager'));
const SystemLogs = lazy(() => import('@/pages/system/SystemLogs'));
const ProfilePage = lazy(() => import('@/pages/management/ProfilePage'));
const Subjects = lazy(() => import('@/pages/academic/Subjects'));

// Global fast loader for suspense fallbacks
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"></div>
      <p className="text-sm font-medium text-slate-500 animate-pulse">Loading Application...</p>
    </div>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
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
