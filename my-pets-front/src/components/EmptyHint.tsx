// Estado vacío de las tarjetas del perfil: una frase que explica para qué sirve
// la sección y, si corresponde, el botón para cargar el primer registro.
export function EmptyHint({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
      <p className="max-w-sm text-sm text-gray-600 dark:text-gray-400 text-balance">{text}</p>
      {action && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
        >
          {action}
        </button>
      )}
    </div>
  )
}
