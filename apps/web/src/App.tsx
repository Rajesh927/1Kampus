import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext.js';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';

import { Navbar } from './components/common/Navbar.js';
import { Footer } from './components/common/Footer.js';

import { LandingPage } from './pages/LandingPage.js';
import { EventsPage } from './pages/EventsPage.js';
import { EventDetailPage } from './pages/EventDetailPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { OrganizerPage } from './pages/OrganizerPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { AuthPage } from './pages/AuthPage.js';
import { OrganizerAuthPage } from './pages/OrganizerAuthPage.js';
import { AdminLoginPage } from './pages/AdminLoginPage.js';

import { useAuth } from './context/AuthContext.js';

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  allowedRoles?: Array<'student' | 'organizer' | 'admin'>;
}> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.approval_status === 'pending' && allowedRoles.includes('organizer')) {
      return <>{children}</>;
    }
    return <Navigate to="/events" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark text-ink dark:text-ink-dark selection:bg-brand-100 selection:text-brand-900 transition-colors duration-250">
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:id" element={<EventDetailPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute allowedRoles={['student', 'organizer', 'admin']}>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/organizer"
                    element={
                      <ProtectedRoute allowedRoles={['organizer', 'admin']}>
                        <OrganizerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/login" element={<AuthPage initialMode="login" />} />
                  <Route path="/signup" element={<AuthPage initialMode="signup" />} />
                  <Route path="/organizer/login" element={<OrganizerAuthPage initialMode="login" />} />
                  <Route path="/organizer/register" element={<OrganizerAuthPage initialMode="register" />} />
                  <Route path="/organizer/apply" element={<Navigate to="/organizer/register" replace />} />
                  <Route path="/admin/login" element={<AdminLoginPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
