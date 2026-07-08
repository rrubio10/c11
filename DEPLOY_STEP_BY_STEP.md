# Publicar C1 Practice Lab en GitHub, Neon y Vercel

Ruta recomendada:

- GitHub almacena el código.
- Neon aloja PostgreSQL.
- Vercel ejecuta la aplicación Next.js.

GitHub Pages no sirve para esta aplicación porque necesita servidor, autenticación, API y base de datos.

## 1. Probar el proyecto localmente

Requisitos: Node.js 20.19 o posterior y npm.

### Windows PowerShell

```powershell
Copy-Item .env.example .env -Force
notepad .env
npm install
npm run db:setup
npm run dev
```

### macOS o Linux

```bash
cp .env.example .env
nano .env
npm install
npm run db:setup
npm run dev
```

Abre `http://localhost:3000`.

## 2. Subirlo a GitHub

Crea un repositorio vacío en GitHub, sin README, licencia ni `.gitignore`. Después, desde la carpeta del proyecto:

```bash
git init
git add .
git commit -m "Initial C1 platform"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/c1-practice-lab.git
git push -u origin main
```

También puedes utilizar GitHub Desktop y elegir **Add local repository**, **Create a repository here** y **Publish repository**.

## 3. Crear PostgreSQL en Neon

1. Crea un proyecto en Neon.
2. En **Connect**, copia dos cadenas:
   - Direct connection: para migraciones e importación.
   - Pooled connection: para Vercel; el host contiene `-pooler`.
3. No compartas estas cadenas ni las subas a GitHub.

## 4. Inicializar Neon con los ejercicios

Copia `.env.production.example` a `.env` y usa temporalmente la conexión directa:

```env
DATABASE_URL="CONEXION_DIRECTA_DE_NEON"
SESSION_COOKIE_NAME="c1_session"
SESSION_TTL_DAYS="30"
ADMIN_EMAIL="tu-correo@example.com"
ADMIN_PASSWORD="una-contraseña-larga-y-unica"
NEXT_PUBLIC_APP_NAME="C1 Practice Lab"
```

Ejecuta:

```bash
npm install
npm run prisma:generate:pg
npm run db:migrate:pg
npm run db:seed
npm run db:import
npm run db:validate
```

La validación debe indicar 50 conjuntos y 423 preguntas.

## 5. Desplegar en Vercel

1. En Vercel, crea un proyecto e importa el repositorio de GitHub.
2. Framework: Next.js.
3. Build command:

```bash
npm run prisma:generate:pg && npm run build
```

4. Añade estas variables antes de pulsar **Deploy**:

```text
DATABASE_URL = conexión POOLED de Neon
SESSION_COOKIE_NAME = c1_session
SESSION_TTL_DAYS = 30
ADMIN_EMAIL = el mismo correo usado al ejecutar db:seed
ADMIN_PASSWORD = la misma contraseña segura
NEXT_PUBLIC_APP_NAME = C1 Practice Lab
```

5. Pulsa **Deploy**.

## 6. Comprobación final

En la URL de Vercel:

1. Inicia sesión con el administrador.
2. Comprueba que aparecen los ejercicios.
3. Inicia un intento y guarda una respuesta.
4. Recarga para comprobar el guardado automático.
5. Entrega y abre la revisión.
6. Comprueba que `/admin` solo funciona con la cuenta administradora.

## Actualizaciones posteriores

Después de modificar código:

```bash
git add .
git commit -m "Describe el cambio"
git push
```

Vercel desplegará automáticamente el nuevo commit.

Si modificas el esquema de la base de datos, aplica primero la migración usando la conexión directa de Neon.
