const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

let pool;
function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL no está configurada');
  if (!pool) pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 });
  return pool;
}
const send = (res, status, body) => res.status(status).json(body);
function cookie(req, name) {
  const raw = req.headers.cookie || '';
  const item = raw.split(';').map(x => x.trim()).find(x => x.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}
function setSession(res, user) {
  const token = jwt.sign({ sub: String(user.id), role: user.rol }, process.env.JWT_SECRET, { expiresIn: '8h', issuer: 'aula-virtual-unes' });
  res.setHeader('Set-Cookie', 'aula_session=' + encodeURIComponent(token) + '; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800');
}
function clearSession(res) {
  res.setHeader('Set-Cookie', 'aula_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
}
async function auth(req) {
  const token = cookie(req, 'aula_session');
  if (!token) return null;
  try {
    const claims = jwt.verify(token, process.env.JWT_SECRET, { issuer: 'aula-virtual-unes' });
    const result = await db().query('SELECT id,nombre,email,rol,activo FROM usuarios WHERE id=$1 AND activo IS DISTINCT FROM false', [claims.sub]);
    return result.rows[0] || null;
  } catch (_) { return null; }
}
const publicUser = u => ({ id: u.id, nombre: u.nombre, nombre_completo: u.nombre, email: u.email, rol: u.rol, activo: u.activo !== false });
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const route = (req.url || '').split('?')[0].replace(/^\/api\/?/, '').replace(/\/$/, '');
  try {
    if (route === 'health' && req.method === 'GET') {
      await db().query('SELECT 1');
      return send(res, 200, { ok: true, database: 'connected' });
    }
    if (route === 'auth/register-student' && req.method === 'POST') {
      const { nombre, email, password, cedula } = req.body || {};
      const normalized = String(email || '').trim().toLowerCase();
      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 10) return send(res, 400, { error: 'Indica nombre, correo válido y contraseña de al menos 10 caracteres.' });
      const client = await db().connect();
      try {
        await client.query('BEGIN');
        const exists = await client.query('SELECT 1 FROM usuarios WHERE lower(email)= $1 UNION SELECT 1 FROM estudiantes WHERE lower(email)=$1', [normalized]);
        if (exists.rowCount) { await client.query('ROLLBACK'); return send(res, 409, { error: 'Ese correo ya está registrado.' }); }
        const hash = await bcrypt.hash(password, 12);
        const student = await client.query('INSERT INTO estudiantes(nombre,email,cedula,activo) VALUES($1,$2,$3,true) RETURNING id,nombre,email,cedula,activo', [String(nombre).trim(), normalized, cedula || null]);
        const account = await client.query("INSERT INTO usuarios(nombre,email,password_hash,rol,activo) VALUES($1,$2,$3,'estudiante',true) RETURNING id,nombre,email,rol,activo", [String(nombre).trim(), normalized, hash]);
        await client.query('COMMIT');
        setSession(res, account.rows[0]);
        return send(res, 201, { user: publicUser(account.rows[0]), estudiante: student.rows[0] });
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
    if (route === 'auth/login' && req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = req.body?.password;
      if (!email || typeof password !== 'string') return send(res, 400, { error: 'Correo y contraseña son obligatorios.' });
      const result = await db().query('SELECT id,nombre,email,password_hash,rol,activo FROM usuarios WHERE lower(email)=$1 LIMIT 1', [email]);
      const user = result.rows[0];
      if (!user || user.activo === false || !(await bcrypt.compare(password, user.password_hash))) return send(res, 401, { error: 'Correo o contraseña incorrectos.' });
      setSession(res, user);
      await db().query('INSERT INTO log_actividad(usuario_id,actividad) VALUES($1,$2)', [user.id, 'Inicio de sesión']);
      return send(res, 200, { user: publicUser(user) });
    }
    if (route === 'auth/logout' && req.method === 'POST') { clearSession(res); return send(res, 200, { ok: true }); }
    if (route === 'auth/me' && req.method === 'GET') {
      const user = await auth(req);
      if (!user) return send(res, 401, { error: 'Sesión no válida.' });
      let estudiante = null;
      if (user.rol === 'estudiante') {
        const s = await db().query('SELECT id,nombre AS nombre_completo,email,cedula,activo FROM estudiantes WHERE lower(email)=lower($1)', [user.email]);
        estudiante = s.rows[0] || null;
      }
      return send(res, 200, { user: publicUser(user), estudiante });
    }
    const user = await auth(req);
    if (!user) return send(res, 401, { error: 'Debes iniciar sesión.' });
    if (route === 'admin/users' && req.method === 'GET') {
      if (user.rol !== 'administrador') return send(res, 403, { error: 'Acceso exclusivo de administración.' });
      const rows = await db().query('SELECT id,nombre AS nombre_completo,email,rol,activo,creado_en FROM usuarios ORDER BY creado_en DESC NULLS LAST');
      return send(res, 200, rows.rows);
    }
    if (route === 'admin/users' && req.method === 'POST') {
      if (user.rol !== 'administrador') return send(res, 403, { error: 'Acceso exclusivo de administración.' });
      const { nombre, email, password, rol } = req.body || {};
      const normalized = String(email || '').trim().toLowerCase();
      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 10 || !['administrador','docente','estudiante'].includes(rol)) return send(res, 400, { error: 'Datos inválidos. La contraseña debe tener al menos 10 caracteres.' });
      const hash = await bcrypt.hash(password, 12);
      const created = await db().query('INSERT INTO usuarios(nombre,email,password_hash,rol,activo) VALUES($1,$2,$3,$4,true) RETURNING id,nombre AS nombre_completo,email,rol,activo', [String(nombre).trim(), normalized, hash, rol]);
      await db().query('INSERT INTO log_actividad(usuario_id,actividad) VALUES($1,$2)', [user.id, 'Creó cuenta: ' + normalized]);
      return send(res, 201, created.rows[0]);
    }
    if (route === 'students' && req.method === 'GET') {
      if (!['administrador','docente'].includes(user.rol)) return send(res, 403, { error: 'Sin permisos.' });
      const rows = await db().query('SELECT id,nombre AS nombre_completo,email,cedula,activo,creado_en FROM estudiantes ORDER BY creado_en DESC NULLS LAST');
      return send(res, 200, rows.rows);
    }
    if (route === 'progress' && req.method === 'GET') {
      if (user.rol === 'estudiante') {
        const student = await db().query('SELECT id FROM estudiantes WHERE lower(email)=lower($1)', [user.email]);
        if (!student.rowCount) return send(res, 200, []);
        const rows = await db().query('SELECT id,estudiante_id,unidad AS unidad_id,completado,actualizado_en FROM progreso WHERE estudiante_id=$1 ORDER BY unidad', [student.rows[0].id]);
        return send(res, 200, rows.rows);
      }
      if (!['administrador','docente'].includes(user.rol)) return send(res, 403, { error: 'Sin permisos.' });
      const rows = await db().query('SELECT id,estudiante_id,unidad AS unidad_id,completado,actualizado_en FROM progreso ORDER BY estudiante_id,unidad');
      return send(res, 200, rows.rows);
    }
    return send(res, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    console.error('API error:', error.message);
    if (error.code === '23505') return send(res, 409, { error: 'El correo ya existe.' });
    return send(res, 500, { error: 'Error interno del servidor.' });
  }
};
