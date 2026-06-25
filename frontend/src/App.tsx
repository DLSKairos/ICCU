import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IntroPage } from './pages/IntroPage';
import { MapaPage } from './pages/MapaPage';
import { ProvinciaPage } from './pages/ProvinciaPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminProvinciaPage from './pages/admin/AdminProvinciaPage';
import { PWAInstallBanner } from './components/PWAInstallBanner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <PWAInstallBanner />
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas — no modificar */}
          <Route path="/" element={<IntroPage />} />
          <Route path="/mapa" element={<MapaPage />} />
          <Route path="/provincia/:id" element={<ProvinciaPage />} />
          {/* Rutas admin */}
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute><AdminDashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin/provincia/:id" element={
            <ProtectedRoute><AdminProvinciaPage /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
