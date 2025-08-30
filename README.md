# Docutrack
DocuTrack es un prototipo de aplicación web que permite a los ciudadanos solicitar, dar seguimiento y descargar certificados oficiales, mientras que los administradores pueden 

Estado del proyecto
- El proyecto está en proceso de despliegue completo.
- Actualmente solo el frontend está desplegado en Vercel.
- El backend quedará desplegado cuando se defina el hosting de la base de datos PostgreSQL.
- Para desarrollo local, sigue los pasos de instalación y configuración a continuación.

----------------------------------------
Planificación del proyecto
----------------------------------------
Objetivo
- Construir un MVP que permita a usuarios solicitar certificados, a administradores validarlos y emitirlos, y a ambos descargar/verificar documentos con confianza.

Alcance del MVP
- Autenticación: Registro, login y control de acceso por roles (ADMIN/USER).
- Solicitudes: Creación, listado, actualización de estado y notas.
- Administración: Panel para validar, rechazar y emitir certificados.
- Descargas: Acceso a archivos originales y certificados PDF.
- Certificado PDF: Generación server-side (PDFKit), estilo sobrio y legible.

Hitos
- H1: Setup de stack, auth y rutas base.
- H2: CRUD de solicitudes + panel admin.
- H3: Generación de certificado PDF y descargas.
- H4: Pulido de UI/UX (skeletons, estados vacíos, microinteracciones) y mapeo de estados UI → DB.

Gestión
- Kanban (Backlog, In progress, Review, Done). Priorización por impacto en MVP y riesgos técnicos (PDF y estados).

----------------------------------------
Tecnologías y por qué
----------------------------------------
Frontend: React + Vite + Tailwind CSS
- Vite para DX y builds rápidos.
- Tailwind para velocidad y consistencia de estilos en JSX.

Backend: Node.js + Express
- Express para APIs REST simples y mantenibles.
- PDFKit para generar certificados PDF con control de layout.

Base de datos: PostgreSQL
- Integridad con constraints CHECK y soporte JSON.

Autenticación: JWT + bcrypt
- Sesiones stateless y almacenamiento seguro de contraseñas.

Almacenamiento de archivos
- URLs públicas (Cloudinary/S3) para descargas confiables.

----------------------------------------
Requisitos previos
----------------------------------------
- Node.js 18+ (recomendado 20+)
- PostgreSQL 13+
- pgAdmin 4 (para ejecutar el script de base de datos)
- npm o pnpm

----------------------------------------
Instalación y ejecución: paso a paso
----------------------------------------
1) Clonar el repositorio
- git clone <URL_DEL_REPOSITORIO>
- cd <carpeta-del-repo>

2) Base de datos: ejecutar script-docutrack en pgAdmin
- Abre pgAdmin y conéctate a tu servidor PostgreSQL.
- Crea una base de datos (por ejemplo: docutrack).
  SQL rápido:
    CREATE DATABASE docutrack;
- Abre el archivo del repositorio: backend/script-docutrack.sql (o el archivo SQL que incluya el esquema).
  Si no existe el archivo, crea y ejecuta el siguiente esquema mínimo (ejemplo):
    -- Esquema mínimo (ajústalo según tu script real)
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER'
        CHECK (role IN ('USER', 'ADMIN')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      title TEXT NOT NULL DEFAULT 'Certificado Docutrack',
      file_url TEXT,
      status TEXT NOT NULL DEFAULT 'Pendiente'
        CHECK (status IN ('Pendiente', 'Emitido', 'Rechazado')),
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      details JSONB,
      status_note TEXT
    );

    -- Índices recomendados
    CREATE INDEX idx_requests_user_id ON requests(user_id);
    CREATE INDEX idx_requests_status ON requests(status);

- Ejecuta el script en la base docutrack hasta ver "Query returned successfully".

3) Configurar variables de entorno (backend)
- En backend/.env (ejemplo):
    PORT=4000
    DATABASE_URL=postgres://USER:PASS@HOST:5432/docutrack
    JWT_SECRET=tu_secreto_seguro
    NODE_ENV=development
- Reemplaza USER, PASS y HOST según tu entorno local.

4) Instalar y ejecutar backend
- cd backend
- npm install
- npm run dev
- La API debería estar disponible en http://localhost:4000

5) Configurar variables de entorno (frontend)
- En frontend/.env.development (ejemplo):
    VITE_API_URL=http://localhost:4000
    VITE_APP_NAME=DocuTrack
    VITE_CDN_IMAGE_DOCS=https://images.unsplash.com/photo-1521791055366-0d553872125f?q=80&w=1600&auto=format&fit=crop
    VITE_ENABLE_DEBUG_LOGS=true
    VITE_DEFAULT_PAGE_SIZE=10
    VITE_PASSWORD_MIN=6

6) Instalar y ejecutar frontend
- cd ../frontend
- npm install
- npm run dev
- Abre http://localhost:5173

----------------------------------------
Estructura de carpetas
----------------------------------------
Backend
- backend/
  - .env
  - package.json, package-lock.json
  - src/
    - config/cloudinary.js
    - middlewares/auth.js, upload.js
    - routes/adminRequests.js, auth.js, certificate.js, pdf.js, requests.js
    - app.js, index.js

Frontend
- frontend/
  - public/
  - src/
    - assets/
    - components/ (PrivateRoute.jsx)
    - context/ (auth-context.jsx)
    - layouts/ (SolicitudForm.jsx)
    - pages/ (admin-panel.jsx, login.jsx, register.jsx, user-panel.jsx)
    - App.jsx, main.jsx, App.css, index.css
  - vite.config.js, tailwind.config.js, postcss.config.js, package.json

----------------------------------------
Configuraciones clave y decisiones
----------------------------------------
1) Estados de solicitud (mapeo UI ↔ DB)
- DB permite: Pendiente, Emitido, Rechazado (CHECK).
- UI muestra “En revisión” cuando DB tiene “Pendiente”.
- Al actualizar desde la UI, “En revisión” se envía y en backend se normaliza a “Pendiente”.
- Beneficio: evita errores de CHECK (código 23514) y mantiene una UX clara.

2) Certificado PDF (PDFKit)
- Disponible solo cuando status = Emitido y el solicitante es ADMIN o dueño.
- Contiene: nombre, cédula, fecha, estado EMITIDO, firma autorizada.
- Estilo minimalista (Helvetica) y coordinadas seguras (sin NaN).

3) Autenticación
- Registro y login con JWT; bcrypt para hash de contraseñas.
- Rutas protegidas con requireAuth y control por roles en middleware.

4) Frontend
- React + Vite + Tailwind CSS con layouts limpios, skeleton loaders y estados vacíos.
- Variables de entorno via import.meta.env (VITE_*).
- Reemplazar cualquier URL hardcodeada por VITE_API_URL.

----------------------------------------
Comandos útiles
----------------------------------------
Backend
- npm run dev           -> Inicia servidor en desarrollo
- npm start             -> Inicio en producción (si aplica)
- npm run lint          -> Linter (si configurado)

Frontend
- npm run dev           -> Servidor de desarrollo Vite
- npm run build         -> Compilación producción
- npm run preview       -> Previsualización build

----------------------------------------
Solución de problemas comunes
----------------------------------------
- Error 23514 (CHECK) al cambiar estado:
  Asegura mapeo UI → DB (“En revisión” → “Pendiente”) en backend antes del UPDATE.
- 500 en certificado PDF:
  Verifica que requests.details tenga nombre/cedula. Si es string, parsea con JSON.parse try/catch.
- CORS:
  Si usas dominios distintos, habilita CORS para el dominio del frontend.

----------------------------------------
Decisiones de diseño y alcance (opcional)
----------------------------------------
- “En revisión” no está en la CHECK para simplificar. Se mapea a “Pendiente”.
- QR en PDF queda como mejora futura; se incluye URL de verificación legible.
- Subida directa firmada pendiente para siguiente iteración.
- Roles básicos: ADMIN y USER, escalable a más.

----------------------------------------
Despliegue (estado actual)
----------------------------------------
- Frontend: desplegado en Vercel (URL de preview/producción disponible en el panel de Vercel).
- Backend: pendiente de despliegue hasta definir host para la base de datos PostgreSQL.
- Para pruebas, utiliza la API local (http://localhost:4000) y el frontend local (http://localhost:5173).

----------------------------------------
Cómo contribuir
----------------------------------------
- Ramas: feature/* (nuevas), fix/* (correcciones).
- Commits: convenciones claras (feat, fix, refactor, chore).
- PRs: descripción, pasos de prueba, capturas si aplica.