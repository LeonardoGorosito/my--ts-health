import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Logo } from './brand/Logo';
import { LEGAL } from '../lib/legal';

const linkClass = 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-bg-matte border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Marca */}
          <div className="col-span-1 md:col-span-2">
            <Logo size="sm" />
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm max-w-sm leading-relaxed">
              Gestión integral para la salud de tus mascotas. Hecho para cuidar a los que siempre nos esperan.
            </p>
          </div>

          {/* Navegación */}
          <nav aria-label="Explorar">
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-300 mb-6">Explorar</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/app" className={linkClass}>Mis Mascotas</Link></li>
              <li><Link to="/perfil" className={linkClass}>Mi Perfil</Link></li>
              <li><Link to="/app/plan" className={linkClass}>Mi plan</Link></li>
            </ul>
          </nav>

          {/* Legal y contacto */}
          <nav aria-label="Legal y soporte">
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-300 mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/terminos" className={linkClass}>Términos y condiciones</Link></li>
              <li><Link to="/privacidad" className={linkClass}>Privacidad</Link></li>
              {LEGAL.email && (
                <li><a href={`mailto:${LEGAL.email}`} className={linkClass}>Contacto</a></li>
              )}
            </ul>
          </nav>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <p>&copy; {currentYear} PetHealth. Hecho con <Heart size={10} aria-label="amor" className="inline text-emerald-500 mx-1" /> en Santa Fe.</p>
          <span className="text-gray-300 dark:text-gray-700">v1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
