
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold text-blue-600 mb-4">Blue Team Alumnas</h3>
            <p className="text-gray-600 text-sm mb-4 max-w-xs">
              Plataforma educativa para potenciar tus habilidades y transformar tu carrera profesional.
            </p>
            <div className="flex space-x-4">
              {/* Social Icons Placeholder */}
              <a 
                href="https://blue7eam.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <span className="sr-only">Sitio Web</span>
                <svg 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
                  />
                </svg>
              </a>
              <a 
                  href="https://www.instagram.com/blue_7eam/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg 
                    className="h-6 w-6" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth={2}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      d="M12 18v4m0 0v-4m0 9a9 9 0 110-18 9 9 0 010 18z" 
                    />
                  </svg>
                </a>
              </div>
            </div>


          {/* Links Section 1 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Plataforma</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/courses" className="text-gray-600 hover:text-blue-600">Cursos</Link></li>
              <li>
                <a 
                  href="https://www.blue7eam.com/"  // <--- Aquí pones la URL completa
                  target="_blank"           // (Opcional) Abre en una pestaña nueva
                  rel="noopener noreferrer" // (Importante) Seguridad al usar target="_blank"
                  className="text-gray-600 hover:text-blue-600"
                >
                  Sobre Nosotros
                </a>
              </li>            </ul>
          </div>

          {/* Links Section 2 */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Soporte</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/contact" className="text-gray-600 hover:text-blue-600">Contacto</Link></li>
              <li><Link to="/terms" className="text-gray-600 hover:text-blue-600">Términos y Condiciones</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {currentYear} Blue Team Alumnas. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
