import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';
import { HeartPulse, Shield, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../context/AuthContext';
import { ChangePasswordCard } from '../components/ChangePasswordCard';

const schema = z.object({
  name: z.string().trim().min(2, 'El nombre es muy corto'),
  lastname: z.string().trim().min(2, 'El apellido es muy corto'),
  phone: z.string().max(30, 'Máximo 30 caracteres'),
  address: z.string().max(200, 'Máximo 200 caracteres'),
  vetName: z.string().max(100, 'Máximo 100 caracteres'),
  vetPhone: z.string().max(30, 'Máximo 30 caracteres'),
  emergencyPhone: z.string().max(30, 'Máximo 30 caracteres'),
});

type FormData = z.infer<typeof schema>;

// Convierte el usuario del contexto en valores del formulario (null -> '')
const toFormValues = (user: User | null): FormData => ({
  name: user?.name ?? '',
  lastname: user?.lastname ?? '',
  phone: user?.phone ?? '',
  address: user?.address ?? '',
  vetName: user?.vetName ?? '',
  vetPhone: user?.vetPhone ?? '',
  emergencyPhone: user?.emergencyPhone ?? '',
});

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all';
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-red-500 text-xs mt-1">{message}</p> : null;

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: toFormValues(user),
  });

  // Si el usuario cambia (ej: terminó de cargar /auth/me), rellenamos el formulario
  useEffect(() => {
    reset(toFormValues(user));
  }, [user, reset]);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await updateProfile(data);
      toast.success('Perfil actualizado');
    } catch (e) {
      const message = isAxiosError(e) ? e.response?.data?.message : undefined;
      toast.error(message || 'No se pudo guardar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const initial = watch('name')?.trim()?.[0]?.toUpperCase() || 'U';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Gestiona tu información personal y contactos de emergencia.
        </p>
      </div>

      {/* Sección 1: Información Personal */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Información Personal</h2>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar con la inicial */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
              {initial}
            </div>
          </div>

          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="profile-name" className={labelClass}>Nombre</label>
              <input id="profile-name" type="text" {...register('name')} className={inputClass} placeholder="Tu nombre" />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <label htmlFor="profile-lastname" className={labelClass}>Apellido</label>
              <input id="profile-lastname" type="text" {...register('lastname')} className={inputClass} placeholder="Tu apellido" />
              <FieldError message={errors.lastname?.message} />
            </div>
            <div>
              <label htmlFor="profile-phone" className={labelClass}>Teléfono</label>
              <input id="profile-phone" type="tel" {...register('phone')} className={inputClass} placeholder="Ej. +54 11 1234-5678" />
              <FieldError message={errors.phone?.message} />
            </div>
            <div>
              <label htmlFor="profile-address" className={labelClass}>Dirección</label>
              <input id="profile-address" type="text" {...register('address')} className={inputClass} placeholder="Calle, número, ciudad" />
              <FieldError message={errors.address?.message} />
            </div>
          </div>
        </div>
      </div>

      {/* Sección 2: Contactos de Emergencia */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-2">
          <HeartPulse className="text-rose-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Contactos de Emergencia</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Información rápida para casos de urgencia con tus mascotas.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="profile-vetName" className={labelClass}>Veterinaria de Cabecera (Nombre)</label>
            <input id="profile-vetName" type="text" {...register('vetName')} className={inputClass} placeholder="Ej. Clínica Veterinaria San Roque" />
            <FieldError message={errors.vetName?.message} />
          </div>
          <div>
            <label htmlFor="profile-vetPhone" className={labelClass}>Teléfono Veterinaria</label>
            <input id="profile-vetPhone" type="tel" {...register('vetPhone')} className={inputClass} placeholder="Teléfono de tu vete" />
            <FieldError message={errors.vetPhone?.message} />
          </div>
          <div>
            <label htmlFor="profile-emergencyPhone" className={labelClass}>Guardia 24hs</label>
            <input id="profile-emergencyPhone" type="tel" {...register('emergencyPhone')} className={inputClass} placeholder="Teléfono de urgencias" />
            <FieldError message={errors.emergencyPhone?.message} />
          </div>
        </div>
      </div>

      {/* Sección 3: Gestión de Cuenta */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="text-emerald-500" size={24} />
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Cuenta</h2>
        </div>

        <div>
          <label htmlFor="profile-email" className={labelClass}>Email</label>
          <input
            id="profile-email"
            type="email"
            disabled
            value={user?.email ?? ''}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Botón Principal (Guardar) */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={saving || !isDirty}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
        >
          <Save size={20} />
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>

    {/* Formulario aparte: no puede ir anidado dentro del form del perfil */}
    <ChangePasswordCard />
    </div>
  );
};

export default UserProfile;
