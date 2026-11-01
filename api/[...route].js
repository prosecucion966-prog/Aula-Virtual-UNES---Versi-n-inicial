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
    const result = claims.role === 'estudiante'
      ? await db().query('SELECT id,nombre_completo AS nombre,email,\'estudiante\'::text AS rol,activo FROM estudiantes WHERE id=$1 AND activo IS DISTINCT FROM false', [claims.sub])
      : await db().query('SELECT id,nombre_completo AS nombre,email,rol,activo FROM usuarios_sistema WHERE id=$1 AND activo IS DISTINCT FROM false', [claims.sub]);
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
      const { nombre, nombre_completo, email, password, cedula } = req.body || {};
      const fullName = String(nombre_completo || nombre || '').trim();
      const normalized = String(email || '').trim().toLowerCase();
      if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 10) return send(res, 400, { error: 'Indica nombre, correo válido y contraseña de al menos 10 caracteres.' });
      const client = await db().connect();
      try {
        await client.query('BEGIN');
        const exists = await client.query('SELECT 1 FROM usuarios_sistema WHERE lower(email)= $1 UNION SELECT 1 FROM estudiantes WHERE lower(email)=$1', [normalized]);
        if (exists.rowCount) { await client.query('ROLLBACK'); return send(res, 409, { error: 'Ese correo ya está registrado.' }); }
        const hash = await bcrypt.hash(password, 12);
        const student = await client.query('INSERT INTO estudiantes(nombre_completo,email,cedula,password_hash,activo) VALUES($1,$2,$3,$4,true) RETURNING id,nombre_completo,email,cedula,activo', [fullName, normalized, cedula || null, hash]);
        const account = { rows: [{ id: student.rows[0].id, nombre: student.rows[0].nombre_completo, email: normalized, rol: 'estudiante', activo: true }] };
        await client.query('COMMIT');
        setSession(res, account.rows[0]);
        return send(res, 201, { user: publicUser(account.rows[0]), estudiante: student.rows[0] });
      } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
    }
    if (route === 'auth/bootstrap-admin' && req.method === 'POST') {
      if (!process.env.BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] !== process.env.BOOTSTRAP_SECRET) return send(res, 403, { error: 'No autorizado.' });
      const count = await db().query("SELECT count(*)::int AS total FROM usuarios_sistema WHERE rol='administrador'");
      if (count.rows[0].total > 0) return send(res, 409, { error: 'Ya existe una cuenta administradora. Desactiva BOOTSTRAP_SECRET.' });
      const { nombre, nombre_completo, email, password } = req.body || {};
      const fullName = String(nombre_completo || nombre || '').trim();
      const normalized = String(email || '').trim().toLowerCase();
      if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 12) return send(res, 400, { error: 'Datos inválidos. La contraseña debe tener al menos 12 caracteres.' });
      const hash = await bcrypt.hash(password, 12);
      const created = await db().query("INSERT INTO usuarios_sistema(nombre_completo,email,password_hash,rol,activo) VALUES($1,$2,$3,'administrador',true) RETURNING id,nombre_completo AS nombre,email,rol,activo", [fullName, normalized, hash]);
      return send(res, 201, { user: publicUser(created.rows[0]), warning: 'Retira BOOTSTRAP_SECRET de Vercel inmediatamente.' });
    }
    if (route === 'auth/login' && req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      const password = req.body?.password;
      if (!email || typeof password !== 'string') return send(res, 400, { error: 'Correo y contraseña son obligatorios.' });
      const staffResult = await db().query('SELECT id,nombre_completo AS nombre,email,password_hash,rol,activo FROM usuarios_sistema WHERE lower(email)=$1 LIMIT 1', [email]);
      const studentResult = staffResult.rowCount ? { rows: [] } : await db().query("SELECT id,nombre_completo AS nombre,email,password_hash,'estudiante'::text AS rol,activo FROM estudiantes WHERE lower(email)=$1 LIMIT 1", [email]);
      const user = staffResult.rows[0] || studentResult.rows[0];
      if (!user || user.activo === false || !(await bcrypt.compare(password, user.password_hash))) return send(res, 401, { error: 'Correo o contraseña incorrectos.' });
      setSession(res, user);
      if (user.rol !== 'estudiante') await db().query('INSERT INTO log_actividad(usuario_sistema_id,actividad) VALUES($1,$2)', [user.id, 'Inicio de sesión']);
      return send(res, 200, { user: publicUser(user) });
    }
    if (route === 'auth/logout' && req.method === 'POST') { clearSession(res); return send(res, 200, { ok: true }); }
    if (route === 'auth/me' && req.method === 'GET') {
      const user = await auth(req);
      if (!user) return send(res, 401, { error: 'Sesión no válida.' });
      let estudiante = null;
      if (user.rol === 'estudiante') {
        const s = await db().query('SELECT id,nombre_completo,email,cedula,activo FROM estudiantes WHERE lower(email)=lower($1)', [user.email]);
        estudiante = s.rows[0] || null;
      }
      return send(res, 200, { user: publicUser(user), estudiante });
    }
    const user = await auth(req);
    if (!user) return send(res, 401, { error: 'Debes iniciar sesión.' });
    if (route === 'admin/users' && req.method === 'GET') {
      if (user.rol !== 'administrador') return send(res, 403, { error: 'Acceso exclusivo de administración.' });
      const rows = await db().query('SELECT id,nombre_completo,email,rol,activo,created_at FROM usuarios_sistema ORDER BY created_at DESC NULLS LAST');
      return send(res, 200, rows.rows);
    }
    if (route === 'admin/users' && req.method === 'POST') {
      if (user.rol !== 'administrador') return send(res, 403, { error: 'Acceso exclusivo de administración.' });
      const { nombre, nombre_completo, email, password, rol } = req.body || {};
      const fullName = String(nombre_completo || nombre || '').trim();
      const normalized = String(email || '').trim().toLowerCase();
      if (!nombre || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 10 || !['administrador','supervisor'].includes(rol)) return send(res, 400, { error: 'Datos inválidos. La contraseña debe tener al menos 10 caracteres.' });
      const hash = await bcrypt.hash(password, 12);
      const created = await db().query('INSERT INTO usuarios_sistema(nombre_completo,email,password_hash,rol,activo) VALUES($1,$2,$3,$4,true) RETURNING id,nombre_completo,email,rol,activo', [fullName, normalized, hash, rol]);
      await db().query('INSERT INTO log_actividad(usuario_sistema_id,actividad) VALUES($1,$2)', [user.id, 'Creó cuenta: ' + normalized]);
      return send(res, 201, created.rows[0]);
    }
    if (route === 'students' && req.method === 'GET') {
      if (!['administrador','supervisor'].includes(user.rol)) return send(res, 403, { error: 'Sin permisos.' });
      const rows = await db().query('SELECT id,nombre_completo,email,cedula,activo,created_at FROM estudiantes ORDER BY created_at DESC NULLS LAST');
      return send(res, 200, rows.rows);
    }
    if (route === 'progress' && req.method === 'GET') {
      if (user.rol === 'estudiante') {
        const student = await db().query('SELECT id FROM estudiantes WHERE lower(email)=lower($1)', [user.email]);
        if (!student.rowCount) return send(res, 200, []);
        const rows = await db().query('SELECT id,estudiante_id,unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,updated_at FROM progreso WHERE estudiante_id=$1 ORDER BY unidad_id', [student.rows[0].id]);
        return send(res, 200, rows.rows);
      }
      if (!['administrador','supervisor'].includes(user.rol)) return send(res, 403, { error: 'Sin permisos.' });
      const rows = await db().query('SELECT id,estudiante_id,unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,updated_at FROM progreso ORDER BY estudiante_id,unidad_id');
      return send(res, 200, rows.rows);
    }

    if (route === 'students/lookup' && req.method === 'GET') {
      if (!['administrador','supervisor'].includes(user.rol)) return send(res,403,{error:'Sin permisos.'});
      const email=String(req.query?.email || '').trim().toLowerCase();
      const row=await db().query('SELECT id,nombre_completo,email,cedula,activo FROM estudiantes WHERE lower(email)=lower($1)',[email]);
      return row.rowCount ? send(res,200,row.rows[0]) : send(res,404,{error:'Estudiante no encontrado.'});
    }
    if (route === 'progress' && req.method === 'POST') {
      if (user.rol !== 'estudiante') return send(res,403,{error:'Solo el estudiante puede registrar su progreso.'});
      const {unidad_id, ...values}=req.body || {};
      const unit=Number(unidad_id);
      if (!Number.isInteger(unit) || unit < 1 || unit > 9) return send(res,400,{error:'Unidad inválida.'});
      const student=await db().query('SELECT id FROM estudiantes WHERE lower(email)=lower($1)',[user.email]);
      if (!student.rowCount) return send(res,404,{error:'Estudiante no encontrado.'});
      const current=(await db().query('SELECT * FROM progreso WHERE estudiante_id=$1 AND unidad_id=$2 FOR UPDATE',[student.rows[0].id,unit])).rows[0] || {};
      const testAttempts=Number(values.test_intentos ?? current.test_intentos ?? 0);
      const completeAttempts=Number(values.completar_intentos ?? current.completar_intentos ?? 0);
      if (!Number.isInteger(testAttempts) || testAttempts < Number(current.test_intentos || 0) || testAttempts > 2) return send(res,400,{error:'Se permiten como máximo dos intentos del test.'});
      if (!Number.isInteger(completeAttempts) || completeAttempts < Number(current.completar_intentos || 0) || completeAttempts > 2) return send(res,400,{error:'Se permiten como máximo dos intentos para completar la unidad.'});
      const testScore=Number(values.test_mejor_nota ?? current.test_mejor_nota ?? 0);
      const completeScore=Number(values.completar_mejor_nota ?? current.completar_mejor_nota ?? 0);
      if (![testScore,completeScore].every(n=>Number.isFinite(n) && n>=0 && n<=20)) return send(res,400,{error:'La nota debe estar entre 0 y 20.'});
      const guideRead=Boolean(values.guia_leida ?? current.guia_leida ?? false);
      const approved=Boolean(current.aprobada) || (guideRead && testAttempts>0 && completeAttempts>0 && testScore>=14 && completeScore>=14);
      const vals=[student.rows[0].id,unit,guideRead,testAttempts,testScore,completeAttempts,completeScore,approved,approved];
      const saved=await db().query('INSERT INTO progreso(estudiante_id,unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(estudiante_id,unidad_id) DO UPDATE SET guia_leida=EXCLUDED.guia_leida,test_intentos=EXCLUDED.test_intentos,test_mejor_nota=GREATEST(progreso.test_mejor_nota,EXCLUDED.test_mejor_nota),completar_intentos=EXCLUDED.completar_intentos,completar_mejor_nota=GREATEST(progreso.completar_mejor_nota,EXCLUDED.completar_mejor_nota),aprobada=EXCLUDED.aprobada,completado=EXCLUDED.completado,updated_at=now() RETURNING id,estudiante_id,unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,updated_at',vals);
      return send(res,200,saved.rows[0]);
    }
    if (route === 'certificados/verificar' && req.method === 'GET') {
      const code=String(req.query?.codigo || '').trim();
      if (!code) return send(res,400,{error:'Código requerido.'});
      const found=await db().query('SELECT s.nombre_completo,c.fecha_emision FROM certificados c JOIN estudiantes s ON s.id=c.estudiante_id WHERE c.codigo=$1',[code]);
      if (!found.rowCount) return send(res,404,{error:'Certificado no encontrado.'});
      return send(res,200,{nombre:found.rows[0].nombre_completo,fecha:found.rows[0].fecha_emision,estado:'Válido'});
    }
    if (route === 'admin/user-status' && req.method === 'PATCH') {
      if(user.rol!=='administrador') return send(res,403,{error:'Acceso exclusivo de administración.'});
      const email=String(req.body?.email||'').trim().toLowerCase(), activo=Boolean(req.body?.activo);
      const changed=await db().query('UPDATE usuarios_sistema SET activo=$1 WHERE lower(email)=lower($2) AND id<>$3 RETURNING id,email,activo',[activo,email,user.id]);
      if(!changed.rowCount) return send(res,404,{error:'Usuario no encontrado o no modificable.'});
      await db().query('INSERT INTO log_actividad(usuario_sistema_id,actividad) VALUES($1,$2)',[user.id,(activo?'Activó ':'Desactivó ')+email]);
      return send(res,200,changed.rows[0]);
    }
    if (route === 'certificates' && req.method === 'GET') {
      if(user.rol==='estudiante') {
        const rows=await db().query('SELECT c.codigo AS codigo_certificado,c.fecha_emision,c.promedio_final,s.nombre_completo,s.cedula FROM certificados c JOIN estudiantes s ON s.id=c.estudiante_id WHERE s.id=(SELECT id FROM estudiantes WHERE lower(email)=lower($1))',[user.email]);
        return send(res,200,rows.rows[0]||null);
      }
      if(!['administrador','supervisor'].includes(user.rol)) return send(res,403,{error:'Sin permisos.'});
      const rows=await db().query('SELECT c.codigo AS codigo_certificado,c.fecha_emision,c.promedio_final,s.nombre_completo,s.email,s.cedula FROM certificados c JOIN estudiantes s ON s.id=c.estudiante_id ORDER BY c.fecha_emision DESC');
      return send(res,200,rows.rows);
    }
    if (route === 'certificates' && req.method === 'POST') {
      if(user.rol!=='estudiante') return send(res,403,{error:'Solo el estudiante puede emitir su certificado.'});
      const {codigo_certificado,promedio_final}=req.body||{};
      const student=await db().query('SELECT id,nombre_completo,cedula FROM estudiantes WHERE lower(email)=lower($1)',[user.email]);
      if(!student.rowCount) return send(res,404,{error:'Estudiante no encontrado.'});
      const summary=await db().query('SELECT count(*) FILTER (WHERE aprobada)::int AS aprobadas FROM progreso WHERE estudiante_id=$1',[student.rows[0].id]);
      if(summary.rows[0].aprobadas<9) return send(res,409,{error:'Debe aprobar las nueve unidades.'});
      const code=String(codigo_certificado||('UNES-'+require('node:crypto').randomBytes(8).toString('hex').toUpperCase()));\n      const average=Number.isFinite(Number(promedio_final)) ? Math.max(0,Math.min(20,Number(promedio_final))) : 0;\n      const created=await db().query('INSERT INTO certificados(estudiante_id,codigo,promedio_final) VALUES($1,$2,$3) ON CONFLICT(estudiante_id) DO NOTHING RETURNING codigo AS codigo_certificado,fecha_emision,promedio_final',[student.rows[0].id,code,average]);
      const cert=created.rows[0] || (await db().query('SELECT codigo AS codigo_certificado,fecha_emision,promedio_final FROM certificados WHERE estudiante_id=$1',[student.rows[0].id])).rows[0];
      return send(res,201,{...cert,nombre_completo:student.rows[0].nombre_completo,cedula:student.rows[0].cedula});
    }
    if (route === 'logs' && req.method === 'POST') {
      const activity=String(req.body?.actividad||'').slice(0,500);
      if(activity && user.rol !== 'estudiante') await db().query('INSERT INTO log_actividad(usuario_sistema_id,actividad) VALUES($1,$2)',[user.id,activity]);
      return send(res,201,{ok:true});
    }
    return send(res, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    console.error('API error:', error.message);
    if (error.code === '23505') return send(res, 409, { error: 'El correo ya existe.' });
    return send(res, 500, { error: 'Error interno del servidor.' });
  }
};
