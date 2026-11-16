import { useState } from 'react';
import { toast } from 'sonner';
import { BellRing } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user, updatePreferences } = useAuth();
  const [saving, setSaving] = useState(false);

  // Por defecto los recordatorios están activados
  const remindersOn = user?.emailReminders ?? true;

  const toggleReminders = async () => {
    setSaving(true);
    try {
      await updatePreferences({ emailReminders: !remindersOn });
      toast.success(!remindersOn ? 'Recordatorios activados' : 'Recordatorios desactivados');
    } catch {
      toast.error('No se pudo guardar la preferencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuración</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Preferencias de la aplicación.</p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="flex gap-3">
            <BellRing className="text-emerald-500 flex-shrink-0 mt-0.5" size={22} aria-hidden="true" />
            <div>
              <h2 id="reminders-label" className="text-lg font-semibold text-gray-800 dark:text-white">
                Recordatorios por email
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Te avisamos por email cuando una vacuna o desparasitación de tus mascotas vence en los próximos 7 días.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={remindersOn}
            aria-labelledby="reminders-label"
            disabled={saving}
            onClick={toggleReminders}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 ${
              remindersOn ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                remindersOn ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
