import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { IntroPage } from './pages/IntroPage';
import { MapaPage } from './pages/MapaPage';
import { ProvinciaPage } from './pages/ProvinciaPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/mapa" element={<MapaPage />} />
        <Route path="/provincia/:id" element={<ProvinciaPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
