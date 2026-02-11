# My Pets Front

Proyecto frontend de My Pets Health: una aplicación web para gestionar información de mascotas (registro, autenticación, listado y administración de mascotas). Esta interfaz consume una API (backend) para operaciones de usuario y mascotas.

## Objetivo

Proveer una UI limpia y responsiva donde los usuarios pueden:
- Registrarse, iniciar sesión y recuperar contraseña.
- Añadir, listar y gestionar sus mascotas.
- Ver y editar perfil de usuario.

## Tecnologías

- Vite + React
- TypeScript
- CSS (archivo `index.css`) — proyecto ligero y personalizable
- Axios (cliente HTTP) en `src/lib/axios.ts`
- Enrutado y componentes propias para páginas y UI

> Nota: revisa `package.json` para dependencias exactas.

## Estructura del proyecto

Raíz (archivos importantes):

- `index.html` — entrada HTML
- `vite.config.ts` — configuración de Vite
- `package.json` — scripts y dependencias
- `tsconfig.json`, `tsconfig.app.json` — configuraciones TypeScript

Carpeta `src/` (frontend principal):

- `main.tsx` — punto de entrada de la app
- `App.tsx` — componente raíz
- `index.css` — estilos globales

- `components/` — componentes UI reutilizables
  - `Navbar.tsx` — navegación principal
  - `Footer.tsx` — pie de página
  - `Button.tsx`, `Input.tsx`, `Card.tsx` — elementos UI base
  - `PetCard.tsx`, `AddPetModal.tsx` — UI relacionada a mascotas
  - `ProfileDropdown.tsx`, `ProtectedRoute.tsx` — utilidades de navegación y seguridad

- `pages/` — vistas / páginas de la aplicación
  - `Login.tsx`, `Register.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`
  - `pets/PetList.tsx` — listado de mascotas (página de mascotas)

- `context/`
  - `AuthContext.tsx` — estado y helpers de autenticación

- `hooks/`
  - `useDarkMode.ts` — hook para modo oscuro

- `lib/`
  - `axios.ts` — instancia configurada de Axios para llamadas a la API

- `routes/`
  - `Router.tsx` — definición de rutas de la aplicación

## Comandos útiles

Usa npm o yarn según prefieras.

Instalar dependencias:

```
npm install
```

Ejecutar en desarrollo (Vite):

```
npm run dev
```

Construir para producción:

```
npm run build
```

Previsualizar la build (si está configurado):

```
npm run preview
```

## Variables de entorno

- Si el proyecto consume una API, añade la variable para la URL base, p. ej. `VITE_API_BASE_URL` en un archivo `.env` o en la plataforma de despliegue.

Ejemplo `.env`:

```
VITE_API_BASE_URL=https://api.my-pets.example
```

## Despliegue

- Recomendado: Vercel (configuración por defecto para proyectos Vite/React). Asegúrate de establecer las variables de entorno en el dashboard de Vercel.
- Alternativa: Netlify, o servir la carpeta `dist/` desde cualquier host estático.

## Contribuciones

- Abrir issues para bugs o mejoras.
- Para PRs: crear rama con prefijo `feature/` o `fix/`, describir cambios y probar localmente.

## Archivos a revisar al empezar a desarrollar

- `src/pages/pets/PetList.tsx` — revisar lógica de listado y paginación
- `src/context/AuthContext.tsx` — revisar flujo de autenticación y tokens
- `src/lib/axios.ts` — configurar interceptores y baseURL

## Licencia

Licencia por definir. Añade un archivo `LICENSE` si se requiere.

---

Si quieres, puedo:
- Añadir sección de testing (Jest/React Testing Library).
- Añadir guía de estilo y convenciones de commits.
- Generar README en inglés también.
