# Configuración backend Neon — Aula Virtual UNES

## Variables privadas en Vercel
Configurar en **Production, Preview y Development**:
- `DATABASE_URL`: cadena PostgreSQL de Neon (usar la cadena pooled).
- `JWT_SECRET`: secreto aleatorio de al menos 32 bytes. Generar localmente con `openssl rand -base64 48`. No reutilizar la contraseña de Neon.

No colocar secretos en el repositorio ni compartirlos por chat.

## Dependencias
`npm install` instala `pg`, `bcryptjs` y `jsonwebtoken`.

## API inicial
- `GET /api/health`: prueba de conexión.
- `POST /api/auth/register-student`: matrícula y cuenta de estudiante en una transacción; contraseña bcrypt.
- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.
- `GET/POST /api/admin/users`: administración de cuentas solo para administrador.
- `GET /api/students`, `GET /api/progress`: restringidos a personal autorizado o al propio estudiante.

## Compatibilidad con el esquema existente
Se utilizan las tablas y columnas existentes. El progreso actual solo contiene `unidad` y `completado`; notas, intentos y evaluación requieren una migración adicional antes de persistirse. El perfil docente sustituye el antiguo rol supervisor.

## Importante
No crear cuentas iniciales con contraseñas de demostración. Crear la primera cuenta administradora mediante un procedimiento de bootstrap protegido y de un solo uso, o directamente en un entorno controlado usando bcrypt.
