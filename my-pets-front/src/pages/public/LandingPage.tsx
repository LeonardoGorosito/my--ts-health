import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Syringe,
  FileText,
  QrCode,
  Siren,
  BellRing,
  Paperclip,
  Phone,
  Pill,
  Weight,
  Printer,
  ShieldCheck,
  CreditCard,
  Heart,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { Logo } from '../../components/brand/Logo';
import { ThemeToggle } from '../../components/ThemeToggle';
import { Placo } from '../../components/brand/Placo';
import { PricingTable } from '../../components/PricingTable';
import { TRIAL_DAYS } from '../../lib/plans';

// El video solo se carga en pantallas medianas o grandes y si el usuario
// no pidió reducir movimiento. En celulares se muestra la imagen estática (poster).
function shouldPlayHeroVideo() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return (
    window.matchMedia('(min-width: 768px)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

const NAV = [
  { href: '#funciones', label: 'Funciones' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#precios', label: 'Precios' },
  { href: '#preguntas', label: 'Preguntas' },
];

type Feature = { icon: typeof Syringe; title: string; text: string; pro?: boolean };

// Dos grupos: lo que ordena su salud y lo que lo trae de vuelta a casa
const HEALTH_FEATURES: Feature[] = [
  { icon: Syringe, title: 'Vacunas y desparasitaciones', text: 'Fechas aplicadas y próximas dosis, con aviso cuando algo está por vencer.' },
  { icon: FileText, title: 'Historia clínica', text: 'Consultas, cirugías y diagnósticos ordenados en una línea de tiempo.' },
  { icon: Pill, title: 'Tratamientos en curso', text: 'Qué toma, cuánto y hasta cuándo. Te avisamos antes de que termine.' },
  { icon: Weight, title: 'Peso', text: 'Cada pesada en un gráfico, para ver cómo evoluciona.' },
  { icon: BellRing, title: 'Recordatorios por email', text: 'Te avisamos antes de cada vencimiento para que no se te pase ninguna dosis.', pro: true },
  { icon: Paperclip, title: 'Estudios y recetas', text: 'Subí análisis, radiografías y recetas para tenerlos a mano en cada consulta.', pro: true },
];

const SAFETY_FEATURES: Feature[] = [
  { icon: QrCode, title: 'Placa QR para el collar', text: 'Quien la escanee ve su perfil y cómo contactarte. Vos elegís qué datos mostrar.' },
  { icon: Siren, title: 'Modo mascota perdida', text: 'Un toque y la placa muestra un aviso de búsqueda con botones para llamarte.' },
  { icon: Printer, title: 'Afiche “Se busca”', text: 'Un cartel listo para imprimir, con su foto y el QR.' },
];

function FeatureRow({ icon: Icon, title, text, pro, tone = 'health' }: Feature & { tone?: 'health' | 'safety' }) {
  return (
    <li className={`flex gap-4 border-b py-5 last:border-b-0 ${tone === 'safety' ? 'border-red-200/70 dark:border-red-900/40' : 'border-gray-200 dark:border-gray-800 sm:[&:nth-last-child(2)]:border-b-0'}`}>
      <Icon
        size={22}
        aria-hidden="true"
        className={`mt-0.5 flex-shrink-0 ${tone === 'safety' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
      />
      <div>
        <h4 className="flex flex-wrap items-center gap-2 font-bold text-gray-900 dark:text-white">
          {title}
          {pro && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">Pro</span>
          )}
        </h4>
        <p className="mt-1 text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </li>
  );
}

const STEPS = [
  { title: 'Creá tu cuenta', text: `Gratis por ${TRIAL_DAYS} días, sin tarjeta. Te lleva menos de un minuto.` },
  { title: 'Cargá a tu mascota', text: 'Foto, datos básicos, vacunas e historial. Podés completarlo de a poco.' },
  { title: 'Imprimí su placa QR', text: 'Descargala lista para el collar. Si se pierde, activás el modo perdida desde el celular.' },
];

const FAQ = [
  {
    q: '¿Necesito tarjeta para la prueba gratis?',
    a: `No. Te registrás y usás todo lo de Pro durante ${TRIAL_DAYS} días sin cargar ningún medio de pago.`,
  },
  {
    q: '¿Qué pasa cuando termina la prueba?',
    a: 'Elegís el plan Standard o Pro. Si no elegís ninguno, tu cuenta queda en modo lectura: ves todos tus datos, pero no podés editarlos. No perdés nada.',
  },
  {
    q: '¿La placa QR deja de funcionar si no pago?',
    a: 'No. La placa y el modo mascota perdida siguen funcionando siempre, tengas plan o no. Es la seguridad de tu mascota.',
  },
  {
    q: '¿Qué ve una persona que escanea la placa?',
    a: 'El nombre, la foto, si tiene alguna condición médica importante y tu forma de contacto. Tu teléfono y tu dirección se muestran solo si vos lo habilitás (el teléfono también se muestra mientras la mascota está marcada como perdida).',
  },
  {
    q: '¿Sirve para cualquier mascota?',
    a: 'Sí: perros, gatos, aves, conejos, roedores, hurones, reptiles, peces y caballos. Si tu mascota es de otra especie, la cargás como “Otra”. En Standard podés registrar hasta 2 mascotas y en Pro, todas las que quieras.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Es un pago mensual sin permanencia: dejás de pagar y tu cuenta pasa a modo lectura, con la placa funcionando.',
  },
];

// Vista previa de la placa pública en un celular: muestra lo que ve quien encuentra a la mascota.
function PhonePreview() {
  return (
    <div
      role="img"
      aria-label="Vista previa en un celular de la página que ve quien escanea la placa: aviso de mascota perdida con botones para llamar o escribir por WhatsApp"
      className="relative w-[260px] sm:w-[280px] rounded-[2.5rem] bg-gray-900 p-2.5 shadow-2xl shadow-emerald-900/30 ring-1 ring-black/10"
    >
      <div aria-hidden="true" className="overflow-hidden rounded-[2rem] bg-gray-50">
        <div className="bg-red-600 px-4 pt-6 pb-4 text-center text-white">
          <p className="flex items-center justify-center gap-1.5 text-base font-black uppercase tracking-wide">
            <Siren size={18} /> ¡Estoy perdida!
          </p>
          <p className="mt-1 text-[11px] text-red-50">Si me encontraste, avisale a mi familia.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <span className="flex items-center justify-center gap-1 rounded-lg bg-white py-2 text-[11px] font-black uppercase text-red-600">
              <Phone size={12} /> Llamar
            </span>
            <span className="rounded-lg bg-[#25D366] py-2 text-[11px] font-black uppercase text-white">WhatsApp</span>
          </div>
        </div>
        <div className="relative h-16 bg-gradient-to-b from-emerald-500 to-emerald-700">
          <img
            src="/img/cat_qr.webp"
            alt=""
            width={72}
            height={72}
            className="absolute -bottom-9 left-1/2 h-[72px] w-[72px] -translate-x-1/2 rounded-full border-4 border-white object-cover"
          />
        </div>
        <div className="px-4 pb-6 pt-11 text-center">
          <p className="text-xl font-black text-gray-900">Mora</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Mestiza · Hembra</p>
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-left">
            <p className="text-[10px] font-black uppercase tracking-wide text-red-700">Atención médica</p>
            <p className="mt-0.5 text-[11px] text-red-900">Toma medicación todos los días. Es asustadiza.</p>
          </div>
          <div className="mt-3 rounded-xl border border-gray-100 bg-white p-3 text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Familia</p>
            <p className="text-xs font-bold text-gray-900">Laura · 341 555-0123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ id, title, text }: { id: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 id={id} className="font-brand text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl text-balance">
        {title}
      </h2>
      {text && <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 text-balance">{text}</p>}
    </div>
  );
}

const ctaPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition-colors hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600';

export default function LandingPage() {
  const [playVideo] = useState(shouldPlayHeroVideo);
  const { hash } = useLocation();

  // Al llegar con un ancla (ej: /#precios desde otra página), bajamos hasta esa sección
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash]);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-white">
        Saltar al contenido
      </a>

      {/* ENCABEZADO: fijo arriba, con accesos a cada sección */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" aria-label="PetHealth, inicio">
            <Logo size="md" />
          </Link>
          <nav aria-label="Secciones" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              <ThemeToggle compact />
            </div>
            <Link to="/login" className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
              Iniciar sesión
            </Link>
            <Link to="/register" className="hidden rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-emerald-700 sm:inline-flex">
              Probar gratis
            </Link>
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-grow">
        {/* HERO: propuesta de valor + lo que ve quien encuentra a tu mascota */}
        <section aria-labelledby="hero-titulo" className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-0 h-[520px] w-[520px] rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-900/30" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-2 lg:gap-8">
            <div className="text-center lg:text-left">
              <h1 id="hero-titulo" className="font-brand text-4xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl text-balance">
                La salud de tu mascota y su placa QR, <span className="text-emerald-600 dark:text-emerald-400">en un solo lugar</span>
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-lg text-gray-600 dark:text-gray-400 lg:mx-0 text-balance">
                Vacunas, historia clínica y recordatorios siempre a mano. Y si alguna vez se pierde, quien la encuentre te contacta con solo escanear su collar.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <Link to="/register" className={ctaPrimary}>
                  Probar {TRIAL_DAYS} días gratis <ArrowRight size={18} aria-hidden="true" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center rounded-xl px-6 py-3.5 text-base font-bold text-gray-800 ring-1 ring-gray-300 transition-colors hover:bg-gray-50 dark:text-gray-100 dark:ring-gray-700 dark:hover:bg-gray-900"
                >
                  Ver cómo funciona
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-gray-600 dark:text-gray-400 lg:justify-start">
                <li className="flex items-center gap-1.5"><CheckCircle2 size={16} aria-hidden="true" className="text-emerald-600" /> Sin tarjeta</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={16} aria-hidden="true" className="text-emerald-600" /> Perros, gatos y más</li>
                <li className="flex items-center gap-1.5"><CheckCircle2 size={16} aria-hidden="true" className="text-emerald-600" /> Cancelás cuando quieras</li>
              </ul>
            </div>

            {/* Video/foto de fondo en una tarjeta + el celular con la placa encima */}
            <div className="relative mx-auto flex w-full max-w-xl justify-center lg:justify-end">
              <div className="absolute inset-y-8 left-0 right-10 hidden overflow-hidden rounded-[2rem] sm:block">
                {playVideo ? (
                  <video autoPlay loop muted playsInline poster="/img/hero-poster.jpg" aria-hidden="true" className="h-full w-full object-cover">
                    <source src="/video/hero.webm" type="video/webm" />
                    <source src="/video/hero.mp4" type="video/mp4" />
                  </video>
                ) : (
                  <picture>
                    <source srcSet="/img/hero-poster.webp" type="image/webp" />
                    <img src="/img/hero-poster.jpg" alt="" width={1280} height={720} fetchPriority="high" className="h-full w-full object-cover" />
                  </picture>
                )}
              </div>
              <div className="relative sm:mr-4 sm:py-0">
                <PhonePreview />
                <Placo size={92} className="absolute -bottom-6 -left-12 hidden drop-shadow-xl sm:block" title="Placo, la mascota de PetHealth" />
              </div>
            </div>
          </div>
        </section>

        {/* CONFIANZA: las tres dudas que más frenan a alguien antes de registrarse */}
        <section aria-label="Garantías" className="border-y border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
          <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
            {[
              { icon: CreditCard, title: `${TRIAL_DAYS} días gratis, sin tarjeta`, text: 'Probá todo antes de decidir.' },
              { icon: ShieldCheck, title: 'Vos decidís qué se ve', text: 'Teléfono y dirección, solo si los habilitás.' },
              { icon: Heart, title: 'La placa funciona siempre', text: 'Aunque no tengas un plan activo.' },
            ].map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="rounded-xl bg-white p-2.5 text-emerald-700 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:text-emerald-400 dark:ring-gray-700">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-bold text-gray-900 dark:text-white">{title}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* FUNCIONES */}
        <section id="funciones" aria-labelledby="funciones-titulo" className="scroll-mt-20 py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading
              id="funciones-titulo"
              title="Todo lo que necesitás para cuidarlos"
              text="Dejá la libreta de vacunación de papel: lo importante de cada mascota, ordenado y en tu celular."
            />
            <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-10">
              <div className="lg:pt-6">
                <h3 className="font-brand text-xl font-bold text-gray-900 dark:text-white">Su salud, ordenada</h3>
                <ul className="mt-2 grid sm:grid-cols-2 sm:gap-x-10">
                  {HEALTH_FEATURES.map((f) => (
                    <FeatureRow key={f.title} {...f} />
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-red-50 px-6 pb-2 pt-6 ring-1 ring-red-100 dark:bg-red-950/30 dark:ring-red-900/40">
                <h3 className="font-brand text-xl font-bold text-gray-900 dark:text-white">Y si se pierde, la trae de vuelta</h3>
                <ul className="mt-2">
                  {SAFETY_FEATURES.map((f) => (
                    <FeatureRow key={f.title} {...f} tone="safety" />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CASOS DE USO */}
        <section aria-label="Casos de uso" className="bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
          <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6">
            <article className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div>
                <h2 className="font-brand text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl text-balance">
                  Si se pierde, cualquiera que la encuentre puede ayudarte
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  No hace falta descargar nada: con la cámara del celular, quien escanee la placa ve un aviso de mascota perdida, sus cuidados especiales y un botón para llamarte o escribirte por WhatsApp.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Activás y desactivás el aviso con un toque', 'Mostrás un mensaje: dónde se perdió, si es asustadiza, recompensa', 'Alertas médicas visibles para quien la cuide mientras tanto'].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={22} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-emerald-600" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-[2rem] shadow-xl">
                <img src="/img/cat_qr.webp" alt="Gato con una placa QR en el collar" width={1024} height={559} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              </div>
            </article>

            <article className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
              <div className="md:order-2">
                <h2 className="font-brand text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl text-balance">
                  En el veterinario, su historia clínica está en tu bolsillo
                </h2>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Cada vacuna, desparasitación y consulta queda registrada. En la próxima visita le mostrás todo al veterinario desde el celular, aunque cambies de clínica.
                </p>
                <ul className="mt-6 space-y-3">
                  {['Línea de tiempo con cada consulta y diagnóstico', 'Próximas dosis con aviso de vencimiento', 'Su ficha completa en PDF, para imprimir o mandar por WhatsApp', 'Estudios y recetas adjuntos (Pro)'].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                      <CheckCircle2 size={22} aria-hidden="true" className="mt-0.5 flex-shrink-0 text-emerald-600" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="overflow-hidden rounded-[2rem] shadow-xl md:order-1">
                <img src="/img/dog_historial.webp" alt="Perro junto a su historia clínica" width={1024} height={559} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
              </div>
            </article>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section id="como-funciona" aria-labelledby="como-titulo" className="scroll-mt-20 py-20 md:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <SectionHeading id="como-titulo" title="Listo en tres pasos" />
            <div className="relative mt-14">
            <div aria-hidden="true" className="absolute left-[16%] right-[16%] top-6 hidden h-0.5 bg-emerald-200 dark:bg-emerald-900 md:block" />
            <ol className="relative grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li key={step.title} className="relative text-center">
                  <span className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 font-brand text-xl font-bold text-white ring-8 ring-white dark:ring-gray-950">
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-white">{step.title}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-gray-600 dark:text-gray-400">{step.text}</p>
                </li>
              ))}
            </ol>
            </div>
            <div className="mt-12 text-center">
              <Link to="/register" className={ctaPrimary}>
                Empezar ahora, es gratis <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* PRECIOS */}
        <section id="precios" aria-labelledby="precios-titulo" className="scroll-mt-20 bg-gray-50 py-20 dark:bg-gray-900 md:py-24">
          <div className="mx-auto max-w-5xl px-4">
            <div className="mb-12">
              <SectionHeading
                id="precios-titulo"
                title="Planes simples, precios bajos"
                text={`Empezá con ${TRIAL_DAYS} días gratis con todo incluido. Sin tarjeta, sin compromiso.`}
              />
            </div>
            <PricingTable
              renderAction={() => (
                <Link to="/register" className={`${ctaPrimary} w-full`}>
                  Empezar {TRIAL_DAYS} días gratis
                </Link>
              )}
            />
          </div>
        </section>

        {/* PREGUNTAS FRECUENTES */}
        <section id="preguntas" aria-labelledby="preguntas-titulo" className="scroll-mt-20 py-20 md:py-24">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <SectionHeading id="preguntas-titulo" title="Preguntas frecuentes" />
            <div className="mt-12 divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white dark:divide-gray-800 dark:border-gray-800 dark:bg-gray-900">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group px-5 py-4 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg py-1 font-semibold text-gray-900 dark:text-white">
                    {q}
                    <ChevronDown size={20} aria-hidden="true" className="flex-shrink-0 text-gray-500 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
                  </summary>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CIERRE */}
        <section aria-labelledby="cierre-titulo" className="px-4 pb-20 sm:px-6">
          <div className="relative mx-auto flex max-w-5xl flex-col items-center overflow-hidden rounded-[2rem] bg-emerald-700 px-6 py-14 text-center text-white md:flex-row md:gap-10 md:px-14 md:text-left">
            <Placo size={130} className="mb-6 flex-shrink-0 md:mb-0" title="Placo saludando" />
            <div className="flex-grow">
              <h2 id="cierre-titulo" className="font-brand text-3xl font-bold tracking-tight md:text-4xl text-balance">
                Que nunca le falte nada, y que siempre vuelva a casa
              </h2>
              <p className="mt-3 text-emerald-50">Creá tu cuenta en un minuto. Los primeros {TRIAL_DAYS} días van por nuestra cuenta.</p>
            </div>
            <Link
              to="/register"
              className="mt-8 inline-flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-emerald-800 transition-colors hover:bg-emerald-50 md:mt-0"
            >
              Probar gratis <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      {/* PIE */}
      <footer className="border-t border-gray-100 dark:border-gray-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Logo size="sm" />
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Historia clínica y placa QR para tus mascotas. Hecho en Santa Fe, Argentina.</p>
            <ThemeToggle className="mt-4" />
          </div>
          <nav aria-label="Pie de página" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
                {item.label}
              </a>
            ))}
            <Link to="/login" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Iniciar sesión</Link>
            <Link to="/register" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Crear cuenta</Link>
            <Link to="/register?next=%2Fveterinarias%2Fregistro" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Para veterinarias</Link>
            <Link to="/terminos" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Términos y condiciones</Link>
            <Link to="/privacidad" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Privacidad</Link>
            <Link to="/terminos#arrepentimiento" className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">Botón de arrepentimiento</Link>
          </nav>
        </div>
        <p className="border-t border-gray-100 py-5 text-center text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
          &copy; {new Date().getFullYear()} PetHealth. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
