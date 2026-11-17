import { Link } from 'react-router-dom'
import { Logo } from './brand/Logo'
import { ThemeToggle } from './ThemeToggle'

// Barra de las pantallas de acceso (login, registro, recuperar contraseña):
// logo para volver a la landing y selector de tema.
export function AuthTopBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 py-4 sm:px-6">
      <Link to="/" aria-label="PetHealth, volver al inicio">
        <Logo size="sm" />
      </Link>
      <ThemeToggle compact />
    </div>
  )
}
