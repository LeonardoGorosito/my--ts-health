import { X, BellRing, AlertTriangle, Syringe, Pill, CheckCircle2 } from 'lucide-react'
import { createPortal } from 'react-dom' // 1. Importamos createPortal
import { Link } from 'react-router-dom'
import type { Alert } from './Navbar'

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: Alert[];
}

export function NotificationsModal({ isOpen, onClose, alerts }: NotificationsModalProps) {
  if (!isOpen) return null;

  // 2. Envolvemos el return con createPortal y lo mandamos al document.body
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-bg-matte w-full max-w-3xl rounded-3xl shadow-2xl relative my-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <BellRing size={16} /> Notificaciones
            </h2>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="max-h-[70vh] overflow-y-auto pr-2">
            {alerts.length === 0 ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center gap-3">
                <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full text-emerald-600 dark:text-emerald-500">
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-400 text-sm">¡Todo al día!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500">Tus mascotas no tienen vacunas ni desparasitaciones pendientes.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map(alert => (
                  <Link 
                    key={alert.id}
                    to={`/app/pets/${alert.petId}`}
                    onClick={onClose}
                    className={`p-4 rounded-2xl border flex items-start gap-3 transition-all hover:scale-[1.02] cursor-pointer block ${
                      alert.status === 'OVERDUE' 
                        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/20' 
                        : 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/20'
                    }`}
                  >
                    <div className={`p-2 rounded-full mt-0.5 ${
                      alert.status === 'OVERDUE' 
                        ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-500' 
                        : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-500'
                    }`}>
                      {alert.status === 'OVERDUE' ? <AlertTriangle size={18} /> : (alert.type === 'VACCINE' ? <Syringe size={18} /> : <Pill size={18} />)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-gray-900 dark:text-gray-100">{alert.petName}</span>
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                          {alert.type === 'VACCINE' ? 'Vacuna' : 'Desparasitación'}
                        </span>
                      </div>
                      <p className={`text-sm font-medium mt-0.5 ${alert.status === 'OVERDUE' ? 'text-red-800 dark:text-red-400' : 'text-amber-800 dark:text-amber-400'}`}>
                         {alert.name} {alert.status === 'OVERDUE' ? 'está vencida' : 'vence pronto'}
                      </p>
                      <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1.5">
                        {alert.status === 'OVERDUE' 
                          ? `Venció hace ${Math.abs(alert.daysLeft)} día${Math.abs(alert.daysLeft) !== 1 ? 's' : ''}` 
                          : `Toca en ${alert.daysLeft} día${alert.daysLeft !== 1 ? 's' : ''}`
                        } ({alert.dueDate.toLocaleDateString()})
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body // ¡Esto es lo que saca al modal de la "cárcel" del Navbar!
  )
}