'use strict';

// Integration smoke tests. This script is intentionally restricted to DATABASE_URL_TEST.
// It never prints the connection string and only removes rows created by this run.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const TEST_URL = process.env.DATABASE_URL_TEST;
const PROD_URL = process.env.DATABASE_URL;
const PROD_HOST_MARKER = process.env.PROD_HOST_MARKER;

function refuse(message) {
  console.error('[ABORTADO] ' + message);
  process.exit(1);
}
if (!TEST_URL) refuse('Falta DATABASE_URL_TEST.');
let testUrl;
try { testUrl = new URL(TEST_URL); } catch { refuse('DATABASE_URL_TEST no es una URL válida.'); }
if (PROD_URL && TEST_URL === PROD_URL) refuse('DATABASE_URL_TEST coincide con DATABASE_URL.');
if (!testUrl.hostname) refuse('No se pudo identificar el host de DATABASE_URL_TEST.');
if (PROD_HOST_MARKER && testUrl.hostname.toLowerCase().includes(PROD_HOST_MARKER.toLowerCase())) {
  refuse('El host de pruebas coincide con PROD_HOST_MARKER.');
}
if (/prod(uction)?/i.test(testUrl.hostname) && !PROD_HOST_MARKER) {
  refuse('El host parece de producción; define PROD_HOST_MARKER para confirmar el bloqueo.');
}

process.env.DATABASE_URL = TEST_URL;
process.env.JWT_SECRET = process.env.JWT_SECRET || require('node:crypto').randomBytes(32).toString('hex');

const pool = new Pool({ connectionString: TEST_URL, ssl: { rejectUnauthorized: false }, max: 3 });
const api = require('../api/[...route].js');
const prefix = 'it_' + Date.now() + '_' + require('node:crypto').randomBytes(3).toString('hex');
const studentEmail = prefix + '@example.test';
const adminEmail = 'admin_' + prefix + '@example.test';
const supervisorEmail = 'super_' + prefix + '@example.test';
const studentPassword = 'Student-Test-123!';
const staffPassword = 'Staff-Test-123!';
const failures = [];
const passed = [];
let server;
let baseUrl;

async function check(name, fn) {
  try { await fn(); passed.push(name); console.log('✓ ' + name); }
  catch (error) { failures.push({ name, error: error.message }); console.error('✗ ' + name + ': ' + error.message); }
}
async function request(method, route, body, token) {
  const headers = { 'content-type': 'application/json' };
  if (token) headers.cookie = 'aula_session=' + encodeURIComponent(token);
  const response = await fetch(baseUrl + '/api/' + route, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  const setCookie = response.headers.get('set-cookie') || '';
  const match = setCookie.match(/aula_session=([^;]+)/);
  return { status: response.status, data, token: match ? decodeURIComponent(match[1]) : token };
}
function expectStatus(result, status) {
  assert.equal(result.status, status, 'HTTP esperado ' + status + ', recibido ' + result.status + ': ' + JSON.stringify(result.data));
}
async function seedStaff(email, name, role) {
  const hash = await bcrypt.hash(staffPassword, 4);
  await pool.query(
    'INSERT INTO usuarios_sistema(nombre_completo,email,password_hash,rol,activo) VALUES($1,$2,$3,$4,true)',
    [name, email, hash, role]
  );
}
async function cleanup() {
  // Restrict cleanup to unique emails created by this test execution.
  await pool.query('DELETE FROM certificados WHERE estudiante_id IN (SELECT id FROM estudiantes WHERE email=$1)', [studentEmail]);
  await pool.query('DELETE FROM progreso WHERE estudiante_id IN (SELECT id FROM estudiantes WHERE email=$1)', [studentEmail]);
  await pool.query('DELETE FROM estudiantes WHERE email=$1', [studentEmail]);
  await pool.query('DELETE FROM log_actividad WHERE usuario_sistema_id IN (SELECT id FROM usuarios_sistema WHERE email IN ($1,$2))', [adminEmail, supervisorEmail]);
  await pool.query('DELETE FROM usuarios_sistema WHERE email IN ($1,$2)', [adminEmail, supervisorEmail]);
}
async function run() {
  // The schema file is applied only to the guarded test connection.
  const schema = fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  await cleanup();
  server = http.createServer(async (req, res) => {
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const raw = Buffer.concat(chunks).toString();
      req.body = raw ? JSON.parse(raw) : {};
      const parsed = new URL(req.url, 'http://localhost');
      req.url = parsed.pathname + parsed.search;
      req.query = Object.fromEntries(parsed.searchParams.entries());
      res.status = code => { res.statusCode = code; return res; };
      res.json = value => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(value)); return res; };
      res.end = res.end.bind(res);
      await api(req, res);
    } catch (error) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: error.message }));
    }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = 'http://127.0.0.1:' + server.address().port;

  let studentToken, adminToken, supervisorToken;
  await check('Registro de estudiante', async () => {
    const r = await request('POST', 'auth/register-student', {
      nombre_completo: '<script>alert(1)</script> Estudiante', email: studentEmail,
      cedula: 'TEST-' + prefix, password: studentPassword
    });
    expectStatus(r, 201); studentToken = r.token;
    assert.equal(r.data.user.rol, 'estudiante');
    const count = await pool.query('SELECT count(*)::int AS n FROM usuarios_sistema WHERE email=$1', [studentEmail]);
    assert.equal(count.rows[0].n, 0, 'El estudiante no debe duplicarse en usuarios_sistema.');
  });
  await check('Login de estudiante y GET /auth/me', async () => {
    const login = await request('POST', 'auth/login', { email: studentEmail, password: studentPassword });
    expectStatus(login, 200); studentToken = login.token;
    assert.equal(login.data.user.rol, 'estudiante');
    const me = await request('GET', 'auth/me', undefined, studentToken);
    expectStatus(me, 200); assert.equal(me.data.estudiante.email, studentEmail);
  });
  await check('Crear cuentas de personal de prueba', async () => {
    await seedStaff(adminEmail, 'Admin de prueba', 'administrador');
    await seedStaff(supervisorEmail, 'Supervisor de prueba', 'supervisor');
  });
  await check('Login de administrador y supervisor', async () => {
    const a = await request('POST', 'auth/login', { email: adminEmail, password: staffPassword });
    const s = await request('POST', 'auth/login', { email: supervisorEmail, password: staffPassword });
    expectStatus(a, 200); expectStatus(s, 200);
    adminToken = a.token; supervisorToken = s.token;
    assert.equal(a.data.user.rol, 'administrador');
    assert.equal(s.data.user.rol, 'supervisor');
  });
  await check('Estudiante no puede acceder al panel de personal', async () => {
    expectStatus(await request('GET', 'admin/users', undefined, studentToken), 403);
  });
  await check('Supervisor es de solo lectura (crear usuario devuelve 403)', async () => {
    expectStatus(await request('POST', 'admin/users', {
      nombre_completo: 'No permitido', email: 'denied_' + prefix + '@example.test',
      password: staffPassword, rol: 'supervisor'
    }, supervisorToken), 403);
  });
  await check('Administrador crea y desactiva usuario', async () => {
    const email = 'created_' + prefix + '@example.test';
    const created = await request('POST', 'admin/users', {
      nombre_completo: 'Usuario temporal', email, password: staffPassword, rol: 'supervisor'
    }, adminToken);
    expectStatus(created, 201);
    const changed = await request('PATCH', 'admin/user-status', { email, activo: false }, adminToken);
    expectStatus(changed, 200); assert.equal(changed.data.activo, false);
    await pool.query('DELETE FROM usuarios_sistema WHERE email=$1', [email]);
  });
  await check('Dos intentos de test permitidos y tercero rechazado', async () => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await request('POST', 'progress', { unidad_id: 1, test_intentos: attempt, test_mejor_nota: 10 }, studentToken);
      expectStatus(r, 200);
    }
    const third = await request('POST', 'progress', { unidad_id: 1, test_intentos: 3 }, studentToken);
    assert.equal(third.status, 400, 'El tercer intento debe rechazarse; actualmente HTTP ' + third.status);
  });
  await check('Dos intentos de completar permitidos y tercero rechazado', async () => {
    for (let attempt = 1; attempt <= 2; attempt++) {
      const r = await request('POST', 'progress', { unidad_id: 2, completar_intentos: attempt, completar_mejor_nota: 10 }, studentToken);
      expectStatus(r, 200);
    }
    const third = await request('POST', 'progress', { unidad_id: 2, completar_intentos: 3 }, studentToken);
    assert.equal(third.status, 400, 'El tercer intento debe rechazarse; actualmente HTTP ' + third.status);
  });
  await check('Aprobar las nueve unidades', async () => {
    for (let unit = 1; unit <= 9; unit++) {
      const r = await request('POST', 'progress', {
        unidad_id: unit, guia_leida: true, test_intentos: 2, test_mejor_nota: 20,
        completar_intentos: 2, completar_mejor_nota: 20, aprobada: true
      }, studentToken);
      expectStatus(r, 200);
    }
    const count = await pool.query('SELECT count(*)::int AS n FROM progreso WHERE estudiante_id=(SELECT id FROM estudiantes WHERE email=$1) AND aprobada=true', [studentEmail]);
    assert.equal(count.rows[0].n, 9);
  });
  await check('Emitir certificado y evitar duplicados', async () => {
    const first = await request('POST', 'certificates', { promedio_final: 20 }, studentToken);
    expectStatus(first, 201);
    const second = await request('POST', 'certificates', { promedio_final: 20 }, studentToken);
    expectStatus(second, 201);
    assert.equal(first.data.codigo_certificado, second.data.codigo_certificado);
    const count = await pool.query('SELECT count(*)::int AS n FROM certificados WHERE estudiante_id=(SELECT id FROM estudiantes WHERE email=$1)', [studentEmail]);
    assert.equal(count.rows[0].n, 1);
  });
  await check('Verificación pública de certificado', async () => {
    const cert = await pool.query('SELECT codigo FROM certificados WHERE estudiante_id=(SELECT id FROM estudiantes WHERE email=$1)', [studentEmail]);
    const r = await request('GET', 'certificados/verificar?codigo=' + encodeURIComponent(cert.rows[0].codigo));
    expectStatus(r, 200);
    assert.deepEqual(Object.keys(r.data).sort(), ['estado', 'fecha', 'nombre'].sort());
  });
  await check('XSS se devuelve escapado en la salida de la API', async () => {
    const r = await request('GET', 'auth/me', undefined, studentToken);
    expectStatus(r, 200);
    assert.ok(!String(r.data.estudiante.nombre_completo).includes('<script>'), 'El contenido <script> llegó sin escapar.');
  });
}

(async () => {
  let fatal;
  try { await run(); }
  catch (error) { fatal = error; console.error('[ERROR DE EJECUCIÓN] ' + error.message); }
  try { if (server) await new Promise(resolve => server.close(resolve)); } catch (_) {}
  try { await cleanup(); } catch (error) { console.error('[ERROR DE LIMPIEZA] ' + error.message); fatal = fatal || error; }
  try { await pool.end(); } catch (_) {}
  console.log('\nResultado: ' + passed.length + ' pruebas aprobadas; ' + failures.length + ' fallidas.');
  if (failures.length) for (const item of failures) console.log('- ' + item.name + ': ' + item.error);
  if (fatal || failures.length) process.exitCode = 1;
})();
