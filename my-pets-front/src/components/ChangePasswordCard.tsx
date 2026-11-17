import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { isAxiosError } from 'axios'
import { KeyRound } from 'lucide-react'
import { api } from '../lib/axios'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Ingresá tu contraseña actual'),
    newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: 'La nueva contraseña tiene que ser distinta de la actual',
    path: ['newPassword'],
  })

type FormData = z.infer<typeof schema>

const inputClass =
  'w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all'
const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'

export function ChangePasswordCard() {
  const [saving, setSaving] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async ({ currentPassword, newPassword }: FormData) => {
    setSaving(true)
    try {
      await api.put('/auth/me/password', { currentPassword, newPassword })
      toast.success('Contraseña actualizada')
      reset()
    } catch (e) {
      const message = isAxiosError(e) ? e.response?.data?.message : undefined
      toast.error(message || 'No se pudo cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <KeyRound className="text-emerald-500" size={24} aria-hidden="true" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Cambiar Contraseña</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="pw-current" className={labelClass}>Contraseña actual</label>
          <input id="pw-current" type="password" autoComplete="current-password" {...register('currentPassword')} className={inputClass} />
          {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="pw-new" className={labelClass}>Nueva contraseña</label>
          <input id="pw-new" type="password" autoComplete="new-password" {...register('newPassword')} className={inputClass} />
          {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label htmlFor="pw-confirm" className={labelClass}>Repetir nueva contraseña</label>
          <input id="pw-confirm" type="password" autoComplete="new-password" {...register('confirmPassword')} className={inputClass} />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 rounded-xl border border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 disabled:opacity-50 font-medium transition-colors"
        >
          {saving ? 'Guardando...' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  )
}
