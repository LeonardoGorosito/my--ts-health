import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { AlertTriangle, BadgeCheck, Clock } from 'lucide-react'
import { useActiveClinic, LICENSE_LABEL, canClinical, canManage } from '../../lib/clinic'
import type { Membership } from '../../lib/clinic'
import { Loader } from '../../components/Loader'

// ==========================================================
// MARCO DE LA SECCIÓN CLÍNICA (/clinica/*)
// Encabezado con la clínica, estado de la matrícula y pestañas.
// Las páginas de adentro reciben la membresía por el contexto del Outlet.
// ==========================================================

export type ClinicOutlet = { membership: Membership }

export function ClinicShell() {
  const { membership, isLoading } = useActiveClinic()
  if (isLoading) return <Loader text="Cargando la clínica..." />
  if (!membership) return <Navigate to="/veterinarias/registro" replace />

  const { clinic, role, licenseStatus, licenseNote } = membership
  const tabs = [
    { to: '/clinica', label: 'Inicio', end: true },
    { to: '/clinica/clientes', label: 'Clientes', end: false },
    { to: '/clinica/equipo', label: 'Equipo', end: false },
    ...(canManage(role) ? [{ to: '/clinica/datos', label: 'Datos', end: false }] : canClinical(role) ? [{ to: '/clinica/datos', label: 'Mi matrícula', end: false }] : []),
  ]

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-center gap-4">
        {clinic.logoUrl ? (
          <img src={clinic.logoUrl} alt="" className="h-14 w-14 rounded-2xl object-cover ring-1 ring-gray-200 dark:ring-zinc-800" />
        ) : (
          <div aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 font-brand text-2xl font-bold text-white">
            {clinic.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-brand text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{clinic.name}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">{clinic.city}, {clinic.province}</p>
        </div>
        {licenseStatus && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              licenseStatus === 'APPROVED'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200'
                : licenseStatus === 'PENDING'
                  ? 'bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}
          >
            {licenseStatus === 'APPROVED' ? <BadgeCheck size={14} aria-hidden="true" /> : licenseStatus === 'PENDING' ? <Clock size={14} aria-hidden="true" /> : <AlertTriangle size={14} aria-hidden="true" />}
            {LICENSE_LABEL[licenseStatus]}
          </span>
        )}
      </header>

      {licenseStatus === 'REJECTED' && (
        <div role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-100">
          <strong>No pudimos aprobar tu matrícula.</strong> {licenseNote}{' '}
          <NavLink to="/clinica/datos" className="font-semibold underline">Revisá los datos y volvé a enviarla</NavLink>.
        </div>
      )}

      <nav aria-label="Secciones de la clínica" className="mb-8 flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-zinc-800">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `whitespace-nowrap border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors ${
                isActive ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400' : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ membership } satisfies ClinicOutlet} />
    </div>
  )
}
