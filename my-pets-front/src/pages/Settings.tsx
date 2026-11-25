import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { toast } from 'sonner';
import { BellRing, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Settings = () => {
  const { user, updatePreferences, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  // Eliminar cuenta (derecho de supresión, Ley 25.326)
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleting(true);
    try {
      await deleteAccount(password);
      toast.success('Tu cuenta y tus datos se eliminaron');
      navigate('/', { replace: true });
    } catch (err) {
      toast.error((isAxiosError(err) && err.response?.data?.message) || 'No se pudo eliminar la cuenta');
      setDeleting(false);
    }
  };

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

      {/* ZONA DE PELIGRO */}
      <section aria-labelledby="delete-account-title" className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-zinc-900">
        <div className="flex gap-3">
          <Trash2 className="mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" size={22} aria-hidden="true" />
          <div className="flex-1">
            <h2 id="delete-account-title" className="text-lg font-semibold text-gray-800 dark:text-white">Eliminar mi cuenta</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Borra tu cuenta, tus mascotas con todos sus registros y archivos, y los accesos que hayas compartido. Las mascotas que otras personas te compartieron siguen siendo de ellas. No se puede deshacer.
            </p>

            {!showDelete ? (
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="mt-4 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-300 transition-colors hover:bg-red-50 dark:text-red-400 dark:ring-red-900 dark:hover:bg-red-900/20"
              >
                Eliminar mi cuenta
              </button>
            ) : (
              <form onSubmit={handleDelete} className="mt-4 space-y-3 rounded-2xl bg-red-50 p-4 dark:bg-red-900/10">
                <label htmlFor="delete-password" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Para confirmar, ingresá tu contraseña
                </label>
                <input
                  id="delete-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl border border-red-200 bg-white px-4 py-2.5 text-gray-900 outline-none focus:border-red-500 dark:border-red-900/50 dark:bg-zinc-950 dark:text-white"
                />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="submit"
                    disabled={deleting || !password}
                    className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {deleting ? 'Eliminando...' : 'Eliminar todo definitivamente'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowDelete(false); setPassword(''); }}
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-white dark:text-gray-300 dark:hover:bg-zinc-800"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
