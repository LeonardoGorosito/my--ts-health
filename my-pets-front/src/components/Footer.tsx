import { Link } from 'react-router-dom';
import { Cat, Heart } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-bg-matte border-t border-gray-100 dark:border-gray-800 transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Sección de Marca */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
               <Cat className="text-emerald-600" size={28} />
               <span className="font-black text-xl tracking-tighter text-gray-900 dark:text-white uppercase">
                 Pet<span className="text-emerald-600">Health</span>
               </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm leading-relaxed">
              Gestión integral para la salud de tus mascotas. Hecho para cuidar a los que siempre nos esperan.
            </p>
          </div>

          {/* Links de Navegación */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-300 mb-6">Explorar</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/pets" className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">Mis Mascotas</Link></li>
              <li><Link to="/account" className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">Mi Perfil</Link></li>
            </ul>
          </div>

          {/* Soporte */}
          <div>
            <h4 className="font-black text-xs uppercase tracking-widest text-gray-900 dark:text-gray-300 mb-6">Soporte</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">Privacidad</Link></li>
              <li><a href="mailto:soporte@pethealth.com" className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          <p>&copy; {currentYear} Pet Health. Hecho con <Heart size={10} className="inline text-emerald-500 mx-1" /> en Santa Fe.</p>
          <div className="flex gap-6">
            <span className="text-gray-300 dark:text-gray-700">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}