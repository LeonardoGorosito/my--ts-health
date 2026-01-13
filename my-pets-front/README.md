# Blue Team Alumns Platform

Plataforma educativa y de gestión de alumnas (CRM) construida con tecnologías modernas de React.

## 🚀 Descripción

Este proyecto es una aplicación web frontend diseñada para gestionar la venta y acceso a cursos (Masters), así como proporcionar herramientas administrativas para el seguimiento de alumnas y ventas.

La aplicación cuenta con dos áreas principales:
- **Portal de Alumnas:** Donde las usuarias pueden registrarse, ver cursos, realizar compras y acceder a su contenido.
- **Panel de Administración (CRM):** Donde los administradores pueden ver el historial de ventas y gestionar la base de datos de alumnas.

## 🛠️ Tech Stack

El proyecto utiliza un stack moderno y optimizado para rendimiento y experiencia de desarrollador:

- **Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool:** [Vite 7](https://vitejs.dev/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Enrutamiento:** [React Router 7](https://reactrouter.com/)
- **Estado & Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query/latest)
- **Formularios:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) (Validación)
- **HTTP Client:** [Axios](https://axios-http.com/)
- **Notificaciones:** [Sonner](https://sonner.emilkowal.ski/)

## 📂 Estructura del Proyecto

```
src/
├── components/      # Componentes reutilizables (Button, Card, Input, Navbar, etc.)
├── context/         # Contextos de React (ej. AuthContext para autenticación)
├── lib/             # Configuraciones y utilidades (axios, utils)
├── pages/           # Vistas principales de la aplicación
│   ├── AdminOrders.tsx    # Panel de Ventas (Admin)
│   ├── AdminStudents.tsx  # CRM de Alumnas (Admin)
│   ├── Courses.tsx        # Catálogo de cursos
│   ├── CourseDetails.tsx  # Detalle de curso
│   ├── Checkout.tsx       # Proceso de pago
│   ├── Login.tsx / Register.tsx
│   └── ...
├── routes/          # Configuración de rutas (Router.tsx)
└── main.tsx         # Punto de entrada
```

## ⚡ Instalación y Uso

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd blue-7eam-alumns
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar variables de entorno:**
    Crea un archivo `.env` en la raíz del proyecto (basado en `.env.example` si existe) con la URL de tu backend:
    ```env
    VITE_API_URL=http://localhost:3000/api
    ```

4.  **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

## 📜 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación para producción.
- `npm run preview`: Vista previa de la build de producción.
- `npm run lint`: Ejecuta el linter (ESLint) para encontrar errores.

## 🔐 Autenticación y Roles

El sistema maneja dos roles principales:
- **STUDENT:** Acceso a cursos comprados y perfil.
- **ADMIN:** Acceso total + Panel de Administración (Ventas y Alumnas).

La protección de rutas se maneja en `src/routes/Router.tsx` mediante el componente `ProtectedRoute`.
