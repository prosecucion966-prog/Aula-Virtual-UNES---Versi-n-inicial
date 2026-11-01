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
    if (route === 'auth/bootstrap-admin' && req.method === 'POST') {
      if (!process.env.BOOTSTRAP_SECRET || req.headers['x-bootstrap-secret'] !== process.env.BOOTSTRAP_SECRET) return send(res, 403, { error: 'No autorizado.' });
      const count = await db().query("SELECT count(*)::int AS total FROM usuarios WHERE rol='administrador'");
      if (count.rows[0].total > 0) return send(res, 409, { error: 'Ya existe una cuenta administradora. Desactiva BOOTSTRAP_SECRET.' });
      const { nombre, email, password } = req.body || {};
      const normalized = String(email || '').trim().toLowerCase();
      if (!nombre || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(normalized) || typeof password !== 'string' || password.length < 12) return send(res, 400, { error: 'Datos inválidos. La contraseña debe tener al menos 12 caracteres.' });
      const hash = await bcrypt.hash(password, 12);
      const created = await db().query("INSERT INTO usuarios(nombre,email,password_hash,rol,activo) VALUES($1,$2,$3,'administrador',true) RETURNING id,nombre,email,rol,activo", [String(nombre).trim(), normalized, hash]);
      return send(res, 201, { user: publicUser(created.rows[0]), warning: 'Retira BOOTSTRAP_SECRET de Vercel inmediatamente.' });
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
        const rows = await db().query('SELECT id,estudiante_id,unidad AS unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,actualizado_en FROM progreso WHERE estudiante_id=$1 ORDER BY unidad', [student.rows[0].id]);
        return send(res, 200, rows.rows);
      }
      if (!['administrador','docente'].includes(user.rol)) return send(res, 403, { error: 'Sin permisos.' });
      const rows = await db().query('SELECT id,estudiante_id,unidad AS unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,actualizado_en FROM progreso ORDER BY estudiante_id,unidad');
      return send(res, 200, rows.rows);
    }

    if (route === 'students/lookup' && req.method === 'GET') {
      if (!['administrador','docente'].includes(user.rol)) return send(res,403,{error:'Sin permisos.'});
      const email=String(req.query?.email || '').trim().toLowerCase();
      const row=await db().query('SELECT id,nombre AS nombre_completo,email,cedula,activo FROM estudiantes WHERE lower(email)=lower($1)',[email]);
      return row.rowCount ? send(res,200,row.rows[0]) : send(res,404,{error:'Estudiante no encontrado.'});
    }
    if (route === 'progress' && req.method === 'POST') {
      if (user.rol !== 'estudiante') return send(res,403,{error:'Solo el estudiante puede registrar su progreso.'});
      const {unidad_id, ...values}=req.body || {};
      const unit=Number(unidad_id);
      if (!Number.isInteger(unit) || unit < 1 || unit > 100) return send(res,400,{error:'Unidad inválida.'});
      const allowed=['guia_leida','test_intentos','test_mejor_nota','completar_intentos','completar_mejor_nota','aprobada'];
      const keys=Object.keys(values).filter(k=>allowed.includes(k));
      if (!keys.length) return send(res,400,{error:'No hay datos de progreso válidos.'});
      const student=await db().query('SELECT id FROM estudiantes WHERE lower(email)=lower($1)',[user.email]);
      if (!student.rowCount) return send(res,404,{error:'Estudiante no encontrado.'});
      const cols=['estudiante_id','unidad',...keys,'completado'];
      const vals=[student.rows[0].id,unit,...keys.map(k=>values[k]),Boolean(values.aprobada)];
      const placeholders=vals.map((_,i)=>'
  } catch (error) {
    console.error('API error:', error.message);
    if (error.code === '23505') return send(res, 409, { error: 'El correo ya existe.' });
    return send(res, 500, { error: 'Error interno del servidor.' });
  }
};
+(i+1));
      const updates=keys.map(k=>k+'=EXCLUDED.'+k).concat(['completado=EXCLUDED.completado','actualizado_en=now()']);
      const sql='INSERT INTO progreso('+cols.join(',')+') VALUES('+placeholders.join(',')+') ON CONFLICT(estudiante_id,unidad) DO UPDATE SET '+updates.join(',')+' RETURNING id,estudiante_id,unidad AS unidad_id,guia_leida,test_intentos,test_mejor_nota,completar_intentos,completar_mejor_nota,aprobada,completado,actualizado_en';
      const saved=await db().query(sql,vals);
      return send(res,200,saved.rows[0]);
    }
    if (route === 'admin/user-status' && req.method === 'PATCH') {
      if(user.rol!=='administrador') return send(res,403,{error:'Acceso exclusivo de administración.'});
      const email=String(req.body?.email||'').trim().toLowerCase(), activo=Boolean(req.body?.activo);
      const changed=await db().query('UPDATE usuarios SET activo=$1 WHERE lower(email)=lower($2) AND id<>$3 RETURNING id,email,activo',[activo,email,user.id]);
      if(!changed.rowCount) return send(res,404,{error:'Usuario no encontrado o no modificable.'});
      await db().query('INSERT INTO log_actividad(usuario_id,actividad) VALUES($1,$2)',[user.id,(activo?'Activó ':'Desactivó ')+email]);
      return send(res,200,changed.rows[0]);
    }
    if (route === 'certificates' && req.method === 'GET') {
      if(user.rol==='estudiante') {
        const rows=await db().query('SELECT c.codigo AS codigo_certificado,c.fecha_emision,c.promedio_final,s.nombre AS nombre_completo,s.cedula FROM certificados c JOIN estudiantes s ON s.id=c.estudiante_id WHERE s.id=(SELECT id FROM estudiantes WHERE lower(email)=lower($1))',[user.email]);
        return send(res,200,rows.rows[0]||null);
      }
      if(!['administrador','docente'].includes(user.rol)) return send(res,403,{error:'Sin permisos.'});
      const rows=await db().query('SELECT c.codigo AS codigo_certificado,c.fecha_emision,c.promedio_final,s.nombre AS nombre_completo,s.email,s.cedula FROM certificados c JOIN estudiantes s ON s.id=c.estudiante_id ORDER BY c.fecha_emision DESC');
      return send(res,200,rows.rows);
    }
    if (route === 'certificates' && req.method === 'POST') {
      if(user.rol!=='estudiante') return send(res,403,{error:'Solo el estudiante puede emitir su certificado.'});
      const {codigo_certificado,promedio_final}=req.body||{};
      const student=await db().query('SELECT id,nombre,cedula FROM estudiantes WHERE lower(email)=lower($1)',[user.email]);
      if(!student.rowCount) return send(res,404,{error:'Estudiante no encontrado.'});
      const summary=await db().query('SELECT count(*) FILTER (WHERE aprobada)::int AS aprobadas FROM progreso WHERE estudiante_id=$1',[student.rows[0].id]);
      if(summary.rows[0].aprobadas<9) return send(res,409,{error:'Debe aprobar las nueve unidades.'});
      const created=await db().query('INSERT INTO certificados(estudiante_id,codigo,promedio_final) VALUES($1,$2,$3) ON CONFLICT(estudiante_id) DO NOTHING RETURNING codigo AS codigo_certificado,fecha_emision,promedio_final',[student.rows[0].id,String(codigo_certificado||''),Number(promedio_final)]);
      const cert=created.rows[0] || (await db().query('SELECT codigo AS codigo_certificado,fecha_emision,promedio_final FROM certificados WHERE estudiante_id=$1',[student.rows[0].id])).rows[0];
      return send(res,201,{...cert,nombre_completo:student.rows[0].nombre,cedula:student.rows[0].cedula});
    }
    if (route === 'logs' && req.method === 'POST') {
      const activity=String(req.body?.actividad||'').slice(0,500);
      if(activity) await db().query('INSERT INTO log_actividad(usuario_id,actividad) VALUES($1,$2)',[user.id,activity]);
      return send(res,201,{ok:true});
    }
    return send(res, 404, { error: 'Ruta no encontrada.' });
  } catch (error) {
    console.error('API error:', error.message);
    if (error.code === '23505') return send(res, 409, { error: 'El correo ya existe.' });
    return send(res, 500, { error: 'Error interno del servidor.' });
  }
};
