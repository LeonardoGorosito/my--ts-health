import { Link } from 'react-router-dom';
import { Syringe, FileText, QrCode, Heart, Stethoscope, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans">
      {/* Header / Navbar */}
      <header className="px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Heart className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
          <span className="text-xl font-bold tracking-tight">Pet Health</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium px-4 py-2 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link 
            to="/register" 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            Comenzar gratis
          </Link>
        </nav>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Video */}
          <video src="/video/video_cat_dog.mp4" autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0" />
          
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60 z-10"></div>

          {/* Content */}
          <div className="relative z-20 px-6 py-24 md:py-36 max-w-7xl mx-auto text-center flex flex-col items-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl text-balance text-white">
              El historial médico de tu mascota, <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                siempre a mano
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-4 max-w-2xl text-balance">
              Gestioná vacunas, castraciones, historial clínico y creá un perfil público accesible mediante un código QR para su chapita.
            </p>
            <p className="text-md md:text-lg text-emerald-300 mb-10 max-w-3xl text-balance font-medium">
              La plataforma ideal para conectar a los dueños de mascotas en Santa Fe y alrededores con el mejor cuidado para sus animales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
              <Link 
                to="/register" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-lg font-semibold px-8 py-4 rounded-xl transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center"
              >
                Comenzar gratis
              </Link>
              <Link 
                to="/login" 
                className="bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 text-lg font-semibold px-8 py-4 rounded-xl transition-all flex items-center justify-center shadow-sm"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </section>


        {/* Features Section */}
        <section className="bg-white dark:bg-gray-900 py-24 border-y border-gray-200 dark:border-gray-800 shadow-lg relative z-10">
          <div className="px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
              Todo lo que necesitas para cuidarlos
            </h2>
            <div className="grid md:grid-cols-3 gap-12">
              {/* Feature 1 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <Syringe className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Control de Vacunas</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Llevá un registro exacto de las vacunas y desparasitaciones. Que nunca se te pase una fecha importante para su salud.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Historial Médico</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Guardá el registro de castraciones, cirugías y visitas al veterinario. Toda la información de tu mascota en un solo lugar.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="flex flex-col items-center text-center group">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <QrCode className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-3">Código QR para Chapitas</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  Generá un QR único. Si tu mascota se pierde, cualquiera puede escanearlo y ver su perfil público para contactarte.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo Funciona Section */}
        <section className="py-24 bg-gray-50 dark:bg-gray-950">
          <div className="px-6 max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 tracking-tight">
              ¿Cómo funciona?
            </h2>
            <div className="grid md:grid-cols-3 gap-8 md:gap-12 mt-10">
              <div className="bg-white dark:bg-gray-900 p-8 pt-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 text-center relative mt-6 md:mt-0">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-gray-50 dark:ring-gray-950">1</div>
                <h3 className="text-xl font-bold mb-3">Registrá a tu mascota</h3>
                <p className="text-gray-600 dark:text-gray-400">Creá una cuenta y añadí los datos básicos de tus perros o gatos en pocos segundos.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 pt-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 text-center relative mt-6 md:mt-0">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-gray-50 dark:ring-gray-950">2</div>
                <h3 className="text-xl font-bold mb-3">Completá su historial</h3>
                <p className="text-gray-600 dark:text-gray-400">Cargá sus vacunas, desparasitaciones y visitas al veterinario para tener todo al día.</p>
              </div>
              <div className="bg-white dark:bg-gray-900 p-8 pt-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 text-center relative mt-6 md:mt-0">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xl font-bold shadow-lg ring-4 ring-gray-50 dark:ring-gray-950">3</div>
                <h3 className="text-xl font-bold mb-3">Generá su código QR</h3>
                <p className="text-gray-600 dark:text-gray-400">Obtené el código para su chapita. Estará protegido y su información será de fácil acceso.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios / Casos de Uso Section */}
        <section className="bg-white dark:bg-gray-900 py-24 border-y border-gray-200 dark:border-gray-800 shadow-lg relative z-10">
          <div className="px-6 max-w-7xl mx-auto space-y-24">
            
            {/* Emergencias */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  Casos de emergencia
                </div>
                <h3 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 dark:text-white">Si tu mascota se pierde, <br/>cualquiera puede ayudarte</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  Al tener el código QR en su collar, cualquier persona con un celular puede escanearlo y acceder instantáneamente a un perfil público con tus datos de contacto y necesidades especiales de la mascota.
                </p>
                <ul className="space-y-4 pt-2">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium"><CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0"/> Contacto rápido y directo con el dueño</li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium"><CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0"/> Alertas médicas y de comportamiento visibles</li>
                </ul>
              </div>
              <div className="flex-1 w-full bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] aspect-[4/3] flex items-center justify-center shadow-inner overflow-hidden relative border border-gray-100 dark:border-gray-800">
                {/* Imagen del Gato con QR */}
                <img 
                  src="/img/cat_qr.jpg"  
                  alt="Gato con chapita QR" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

            {/* Visitas al Veterinario */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  <Stethoscope className="w-4 h-4" />
                  Visitas médicas
                </div>
                <h3 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900 dark:text-white">La historia clínica <br/>en tu bolsillo</h3>
                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                  No más libretas de vacunación perdidas. Llevá el registro completo de vacunas, desparasitaciones y consultas previas en tu celular para mostrárselo al veterinario en cada visita.
                </p>
                <ul className="space-y-4 pt-2">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium"><CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0"/> Todo ordenado cronológicamente</li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium"><CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0"/> Facilita diagnósticos rápidos para el profesional</li>
                </ul>
              </div>
              <div className="flex-1 w-full bg-gray-50 dark:bg-gray-800/50 rounded-[2rem] aspect-[4/3] flex items-center justify-center shadow-inner overflow-hidden relative border border-gray-100 dark:border-gray-800">
                {/* Imagen del Perro con Historia Clínica */}
                <img 
                  src="/img/dog_historial.jpg" 
                  alt="Perro con historia clínica" 
                  className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>

          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-950 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <span className="font-semibold">Pet Health</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Pet Health. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}