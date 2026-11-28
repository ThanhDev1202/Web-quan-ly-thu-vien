import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AIChatBot from './components/AIChatBot';

// Pages
import BookCatalog from './pages/BookCatalog';
import BookDetail from './pages/BookDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ManageBooks from './pages/ManageBooks';
import BorrowManagement from './pages/BorrowManagement';
import AuditLogs from './pages/AuditLogs';
import ChangePassword from './pages/ChangePassword';
import AdminUserManagement from './pages/AdminUserManagement';
import AIKnowledgeAdmin from './pages/AIKnowledgeAdmin';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px' }}>
        <h2>403 - Bạn không có quyền truy cập khu vực này</h2>
      </div>
    );
  }
  return children;
};

// Readers borrow here; staff are sent to the management page (avoid duplicate pages)
const MyBorrowsRoute = () => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin' || user?.role === 'librarian') {
    return <Navigate to="/manage-borrows" replace />;
  }
  return <BorrowManagement />;
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<BookCatalog />} />
          <Route path="/books/:id" element={<BookDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-borrows" element={<MyBorrowsRoute />} />
          <Route path="/change-password"element={
        <ProtectedRoute>
            <ChangePassword />
        </ProtectedRoute>
    }
/>
          <Route path="/manage-books" element={
            <ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <ManageBooks />
            </ProtectedRoute>
          } />
          <Route path="/manage-borrows" element={
            <ProtectedRoute allowedRoles={['admin', 'librarian']}>
              <BorrowManagement />
            </ProtectedRoute>
          } />
          <Route path="/audit-logs" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLogs />
            </ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminUserManagement />
            </ProtectedRoute>
          } />
          <Route path="/admin/ai" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AIKnowledgeAdmin />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <AIChatBot />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
