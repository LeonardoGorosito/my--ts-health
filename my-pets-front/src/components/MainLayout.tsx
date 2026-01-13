// src/components/MainLayout.tsx (o Layout.tsx)

import Navbar from './Navbar';
import Footer from './Footer';
import { Outlet } from 'react-router-dom';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      {/* El contenido específico de la ruta se renderiza aquí */}
      <main className="mx-auto max-w-6xl px-4 py-6 w-full flex">
        <Outlet /> 
      </main>
      <Footer />
    </div>
  );
}