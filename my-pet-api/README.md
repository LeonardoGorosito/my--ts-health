# API Blue Team

Backend API for the Blue Team project, built with Fastify, TypeScript, and Prisma.

## Tech Stack

- **Framework:** Fastify
- **Language:** TypeScript
- **ORM:** Prisma
- **Validation:** Zod
- **Authentication:** JWT, bcrypt
- **File Uploads:** Cloudinary

## Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL

## Environment Variables

Create a `.env` file in the root directory with the following variables:


## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd api-blue-7eam
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

## Scripts

- `npm run dev`: Starts the development server with hot reload.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Starts the production server (requires build).
- `npm test`: Runs tests (currently not implemented).

# API Blue Team

Backend API del proyecto Blue Team, construido con Fastify, TypeScript y Prisma.

## Pila tecnológica

- Framework: Fastify
- Lenguaje: TypeScript
- ORM: Prisma
- Validación: Zod
- Autenticación: JWT, bcrypt
- Almacenamiento de archivos: Cloudinary

## Requisitos

- Node.js (recomendado v18+)
- PostgreSQL

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto con las variables necesarias (por ejemplo: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_URL`, etc.).

## Instalación rápida

1. Clona el repositorio:
   ```bash
   git clone <repository-url>
   cd my-pet-api
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Genera el cliente de Prisma:
   ```bash
   npx prisma generate
   ```

4. Ejecuta en desarrollo:
   ```bash
   npm run dev
   ```

## Scripts útiles

- `npm run dev`: Inicia el servidor en modo desarrollo (hot reload).
- `npm run build`: Compila TypeScript.
- `npm start`: Inicia el servidor en producción (usar después de `build`).

## Estructura del proyecto

La estructura actual del repositorio es:

```
package.json
prisma.config.d.ts
prisma.config.ts
README.md
tsconfig.json
vercel.json
api/
   [...all].ts
prisma/
   schema.prisma
   seed.d.ts
   seed.ts
src/
   cloudinary.ts
   db.d.ts
   db.ts
   dev-server.ts
   env.d.ts
   env.ts
   fastify.d.ts
   server.d.ts
   server.ts
   hooks/
      authenticate.ts
   lib/
      mailer.ts
   middlewares/
      auth.d.ts
      auth.ts
   routes/
      auth.d.ts
      auth.ts
      health.d.ts
      health.ts
      pets.ts
types/
   fastify-plugins.d.ts
uploads/

```

## Notas

- Revisa `prisma/schema.prisma` y ejecuta `npx prisma migrate` si necesitas aplicar migraciones.
- Configura las variables de entorno antes de ejecutar en producción.

Si querés que agregue ejemplos de uso de la API o documentación de endpoints, lo hago a continuación.
