// ==========================================
// app.js — Aula Virtual UNES (sistema multi-rol)
// Roles: estudiante, supervisor, administrador
// ==========================================

let estudianteActual = null;
let usuarioSistema = null;
let progresoActual = [];
let filtroFase = 'todas';

// ============ INICIALIZACIÓN ============
document.addEventListener('DOMContentLoaded', async () => {
    renderizarUnidades();
    renderizarDestacadas();
    configurarEventos();
    await restaurarSesiones();
});

function configurarEventos() {
    document.querySelectorAll('.nav a').forEach(a => {
        a.addEventListener('click', () => mostrarVista(a.dataset.view));
    });
    document.querySelectorAll('.filtro').forEach(f => {
        f.addEventListener('click', () => {
            document.querySelectorAll('.filtro').forEach(x => x.classList.remove('active'));
            f.classList.add('active');
            filtroFase = f.dataset.fase;
            renderizarUnidades();
        });
    });
    document.getElementById('btnEstudiante')?.addEventListener('click', () => abrirModal('modalRolEstudiante'));
    document.getElementById('btnStaff')?.addEventListener('click', () => abrirModal('modalStaff'));
    document.getElementById('btnRegistroHero')?.addEventListener('click', () => abrirModal('modalRolEstudiante'));
    document.getElementById('formRegistro')?.addEventListener('submit', registrarEstudiante);
    document.getElementById('formLogin')?.addEventListener('submit', loginEstudiante);
    document.getElementById('formStaff')?.addEventListener('submit', loginStaff);
    document.getElementById('formCrearUsuario')?.addEventListener('submit', crearUsuarioSistema);
    document.getElementById('btnCertificado')?.addEventListener('click', mostrarCertificado);
    document.querySelectorAll('.modal').forEach(m => {
        m.addEventListener('click', e => { if (e.target === m) m.classList.remove('active'); });
    });
}

// ============ NAVEGACIÓN ============
function mostrarVista(nombre) {
    if (nombre === 'admin' && usuarioSistema?.rol !== 'administrador') {
        alert('⚠ Acceso restringido a administradores');
        return;
    }
    if (nombre === 'supervisor' && usuarioSistema?.rol !== 'supervisor') {
        alert('⚠ Acceso restringido a supervisores');
        return;
    }
    if (nombre === 'progreso' && !estudianteActual) {
        alert('⚠ Debes matricularte primero');
        abrirModal('modalRolEstudiante');
        return;
    }
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + nombre)?.classList.add('active');
    document.querySelectorAll('.nav a').forEach(a => {
        a.classList.toggle('active', a.dataset.view === nombre);
    });
    if (nombre === 'progreso') renderizarProgreso();
    if (nombre === 'admin') cargarPanelAdmin();
    if (nombre === 'supervisor') cargarPanelSupervisor();
}

function abrirModal(id) { document.getElementById(id)?.classList.add('active'); }
function cerrarModal(id) { document.getElementById(id)?.classList.remove('active'); }
window.mostrarVista = mostrarVista;
window.abrirModal = abrirModal;
window.cerrarModal = cerrarModal;

// ============ RESTAURAR SESIONES ============
async function restaurarSesiones() {
    const staffEmail = localStorage.getItem('staff_email');
    const estEmail = localStorage.getItem('unes_email');

    if (staffEmail) {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(staffEmail)}`,
                { headers: DB.headers }
            );
            const data = await res.json();
            if (data[0]?.activo) {
                usuarioSistema = data[0];
                actualizarUIRol();
                await mostrarPanelSegunRol();
                return;
            }
        } catch (e) { /* silencioso */ }
    }

    if (estEmail) {
        try {
            const est = await DB.buscarEstudiante(estEmail);
            if (est) {
                estudianteActual = est;
                await recargarProgreso();
                actualizarUIRol();
            }
        } catch (e) { /* silencioso */ }
    }
}

// ============ RENDERIZADO UNIDADES ============
function renderizarDestacadas() {
    const cont = document.getElementById('unidadesDestacadas');
    if (!cont) return;
    cont.innerHTML = UNIDADES.slice(0, 3).map(u => tarjetaUnidad(u)).join('');
}

function renderizarUnidades() {
    const cont = document.getElementById('listaUnidades');
    if (!cont) return;
    const filtradas = filtroFase === 'todas' ? UNIDADES : UNIDADES.filter(u => u.fase === filtroFase);
    cont.innerHTML = filtradas.map(u => tarjetaUnidad(u)).join('');
}

function tarjetaUnidad(u) {
    const prog = progresoActual.find(p => p.unidad_id === u.id);
    const aprobada = prog?.aprobada;
    const testOk = (prog?.test_mejor_nota || 0) >= 12;
    const compOk = (prog?.completar_mejor_nota || 0) >= 12;
    return `
        <div class="card" style="--card-color:${u.color}" onclick="abrirUnidad(${u.id})">
            <div class="card-icon" style="background:${u.color}20;color:${u.color}">${u.icono}</div>
            <span class="codigo">${u.codigo}</span>
            <h4>${u.nombre}</h4>
            <p class="desc">${u.descripcion}</p>
            <div class="card-meta">
                <span class="badge badge-horas">⏱ ${u.horas}h</span>
                <span class="badge badge-fase">${u.fase}</span>
                ${aprobada ? '<span class="badge badge-aprobada">✓ Aprobada</span>' : ''}
            </div>
            ${estudianteActual ? `
                <div class="card-progreso">
                    <div class="progreso-dot ${prog?.guia_leida ? 'ok' : ''}"></div>
                    <div class="progreso-dot ${testOk ? 'ok' : ''}"></div>
                    <div class="progreso-dot ${compOk ? 'ok' : ''}"></div>
                </div>
            ` : ''}
        </div>
    `;
}

// ============ DETALLE UNIDAD ============
function abrirUnidad(id) {
    if (!estudianteActual && !usuarioSistema) {
        alert('Debes matricularte para ver el contenido');
        abrirModal('modalRolEstudiante');
        return;
    }
    const u = UNIDADES.find(x => x.id === id);
    if (!u) return;
    const prog = progresoActual.find(p => p.unidad_id === id);
    const testOk = (prog?.test_mejor_nota || 0) >= 12;
    const compOk = (prog?.completar_mejor_nota || 0) >= 12;
    const html = `
        <div class="guia-header" style="background: linear-gradient(135deg, ${u.color} 0%, ${u.color}dd 100%)">
            <span class="codigo-big">${u.codigo}</span>
            <h2>${u.icono} ${u.nombre}</h2>
            <p>${u.descripcion}</p>
            <div class="meta">
                <span>⏱ ${u.horas} horas</span>
                <span>📍 ${u.fase}</span>
                <span>🎯 ${u.competencia}</span>
            </div>
        </div>
        <div class="guia-seccion"><h3>📖 Introducción</h3><p>${u.guia.introduccion}</p></div>
        <div class="guia-objetivos"><h4>🎯 Objetivos de aprendizaje</h4><ul>${u.guia.objetivos.map(o => `<li>${o}</li>`).join('')}</ul></div>
        ${u.guia.secciones.map(s => `<div class="guia-seccion"><h3>${s.titulo}</h3><p>${s.contenido}</p></div>`).join('')}
        <div class="glosario"><h4>📚 Glosario</h4><dl>${Object.entries(u.guia.glosario).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></div>
        ${estudianteActual ? `
            <div class="guia-acciones">
                <button class="btn-eval btn-eval-test" onclick="iniciarTest(${u.id})">
                    📝 Test Opción Múltiple
                    ${prog ? `<span class="eval-estado ${testOk ? 'ok' : 'pend'}">${prog.test_mejor_nota || 0}/20</span>` : ''}
                </button>
                <button class="btn-eval btn-eval-completar" onclick="iniciarCompletar(${u.id})">
                    ✏️ Completar Palabras
                    ${prog ? `<span class="eval-estado ${compOk ? 'ok' : 'pend'}">${prog.completar_mejor_nota || 0}/20</span>` : ''}
                </button>
            </div>
        ` : ''}
    `;
    document.getElementById('detalleUnidad').innerHTML = html;
    abrirModal('modalUnidad');
    if (estudianteActual && !prog?.guia_leida) {
        DB.guardarProgreso(estudianteActual.email, id, { guia_leida: true })
            .then(() => recargarProgreso());
    }
}
window.abrirUnidad = abrirUnidad;

// ============ REGISTRO ============
async function registrarEstudiante(e) {
    e.preventDefault();
    const datos = {
        email: document.getElementById('regEmail').value.trim().toLowerCase(),
        nombre_completo: document.getElementById('regNombre').value.trim(),
        cedula: document.getElementById('regCedula').value.trim(),
        telefono: document.getElementById('regTelefono').value.trim() || null,
        profesion: document.getElementById('regProfesion').value.trim() || null,
        institucion: document.getElementById('regInstitucion').value.trim() || null
    };
    try {
        await DB.registrarEstudiante(datos);
        localStorage.setItem('unes_email', datos.email);
        localStorage.removeItem('staff_email');
        estudianteActual = await DB.buscarEstudiante(datos.email);
        usuarioSistema = null;
        alert('✅ ¡Matriculado exitosamente!\n\nBienvenido/a, ' + datos.nombre_completo);
        cerrarModal('modalRegistro');
        actualizarUIRol();
        await recargarProgreso();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ============ LOGIN ESTUDIANTE ============
async function loginEstudiante(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const est = await DB.buscarEstudiante(email);
    if (!est) {
        alert('❌ No estás matriculado. Regístrate primero.');
        return;
    }
    estudianteActual = est;
    usuarioSistema = null;
    localStorage.setItem('unes_email', email);
    localStorage.removeItem('staff_email');
    cerrarModal('modalLogin');
    actualizarUIRol();
    await recargarProgreso();
    alert('👋 ¡Bienvenido/a de nuevo, ' + est.nombre_completo + '!');
}

// ============ LOGIN STAFF ============
async function loginStaff(e) {
    e.preventDefault();
    const email = document.getElementById('staffEmail').value.trim().toLowerCase();
    const pass = document.getElementById('staffPassword').value;
    try {
        const user = await DB.loginUsuarioSistema(email, pass);
        usuarioSistema = user;
        estudianteActual = null;
        localStorage.setItem('staff_email', email);
        localStorage.removeItem('unes_email');
        await DB.registrarLog(email, 'login', `Rol: ${user.rol}`);
        cerrarModal('modalStaff');
        actualizarUIRol();
        await mostrarPanelSegunRol();
        alert(`✅ Bienvenido/a, ${user.nombre_completo}`);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function mostrarPanelSegunRol() {
    if (!usuarioSistema) return;
    if (usuarioSistema.rol === 'administrador') {
        mostrarVista('admin');
        await cargarPanelAdmin();
    } else if (usuarioSistema.rol === 'supervisor') {
        mostrarVista('supervisor');
        await cargarPanelSupervisor();
    }
}

// ============ UI SEGÚN ROL ============
function actualizarUIRol() {
    const area = document.getElementById('userArea');
    const navProg = document.getElementById('navProgreso');
    const navAdmin = document.getElementById('navAdmin');
    const navSup = document.getElementById('navSupervisor');
    navProg.style.display = 'none';
    navAdmin.style.display = 'none';
    navSup.style.display = 'none';

    if (usuarioSistema) {
        const nombre = usuarioSistema.nombre_completo.split(' ')[0];
        const icono = usuarioSistema.rol === 'administrador' ? '👑' : '👨‍🏫';
        area.innerHTML = `
            <button class="btn-user">${icono} ${nombre} (${usuarioSistema.rol})</button>
            <button class="btn-primary" onclick="cerrarSesion()" style="margin-left:8px">Salir</button>
        `;
        if (usuarioSistema.rol === 'administrador') navAdmin.style.display = 'inline-block';
        if (usuarioSistema.rol === 'supervisor') navSup.style.display = 'inline-block';
    } else if (estudianteActual) {
        const nombre = estudianteActual.nombre_completo.split(' ')[0];
        navProg.style.display = 'inline-block';
        area.innerHTML = `
            <button class="btn-user" onclick="mostrarVista('progreso')">👤 ${nombre}</button>
            <button class="btn-primary" onclick="cerrarSesion()" style="margin-left:8px">Salir</button>
        `;
    } else {
        area.innerHTML = `
            <button class="btn-primary" id="btnEstudiante">Soy Estudiante</button>
            <button class="btn-user" id="btnStaff" style="margin-left:8px">Staff UNES</button>
        `;
        document.getElementById('btnEstudiante')?.addEventListener('click', () => abrirModal('modalRolEstudiante'));
        document.getElementById('btnStaff')?.addEventListener('click', () => abrirModal('modalStaff'));
    }
}

function cerrarSesion() {
    localStorage.removeItem('unes_email');
    localStorage.removeItem('staff_email');
    location.reload();
}
window.cerrarSesion = cerrarSesion;

// ============ PROGRESO ESTUDIANTE ============
async function recargarProgreso() {
    if (!estudianteActual) return;
    progresoActual = await DB.obtenerProgreso(estudianteActual.email);
    renderizarUnidades();
    renderizarDestacadas();
    if (document.getElementById('view-progreso')?.classList.contains('active')) {
        renderizarProgreso();
    }
}

function renderizarProgreso() {
    const cont = document.getElementById('progresoContenido');
    if (!cont) return;
    if (!estudianteActual) {
        cont.innerHTML = `<div class="progreso-card" style="text-align:center;padding:50px">
            <h3>🔒 Debes matricularte para ver tu progreso</h3>
            <p style="margin:16px 0;color:#64748b">Regístrate con tu correo para comenzar</p>
            <button class="btn-primary" onclick="abrirModal('modalRolEstudiante')">Matricularme ahora</button>
        </div>`;
        document.getElementById('btnCertificado').style.display = 'none';
        return;
    }
    let totalAprobadas = 0, sumaNotas = 0, unidadesConNota = 0;
    const filas = UNIDADES.map(u => {
        const p = progresoActual.find(x => x.unidad_id === u.id) || {};
        const testOk = (p.test_mejor_nota || 0) >= 12;
        const compOk = (p.completar_mejor_nota || 0) >= 12;
        const aprobada = p.aprobada;
        if (aprobada) totalAprobadas++;
        if ((p.test_mejor_nota || 0) > 0 || (p.completar_mejor_nota || 0) > 0) {
            sumaNotas += ((p.test_mejor_nota || 0) + (p.completar_mejor_nota || 0)) / 2;
            unidadesConNota++;
        }
        return `<tr>
            <td><b>${u.codigo}</b> · ${u.nombre}</td>
            <td>${p.guia_leida ? '✅' : '—'}</td>
            <td>${p.test_intentos || 0}/2 · <b>${p.test_mejor_nota || 0}</b></td>
            <td>${p.completar_intentos || 0}/2 · <b>${p.completar_mejor_nota || 0}</b></td>
            <td>${aprobada ? '✅ Aprobada' : (testOk && compOk ? '⚠ Falta promedio' : '⏳ Pendiente')}</td>
        </tr>`;
    }).join('');
    const porcentaje = Math.round((totalAprobadas / UNIDADES.length) * 100);
    const promedioGlobal = unidadesConNota > 0 ? (sumaNotas / unidadesConNota).toFixed(1) : '0.0';
    const puedeCertificar = totalAprobadas === UNIDADES.length;
    cont.innerHTML = `
        <div class="progreso-card">
            <h3>👤 ${estudianteActual.nombre_completo}</h3>
            <p style="color:#64748b;font-size:13px">📧 ${estudianteActual.email} · 🪪 ${estudianteActual.cedula}</p>
            <div style="margin-top:20px">
                <div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px">
                    <span><b>Progreso general</b></span>
                    <span>${totalAprobadas}/${UNIDADES.length} unidades · ${porcentaje}%</span>
                </div>
                <div class="progreso-global"><div class="progreso-global-fill" style="width:${porcentaje}%"></div></div>
            </div>
            <p style="margin-top:16px;font-size:15px"><b>Promedio general:</b> ${promedioGlobal} / 20</p>
        </div>
        <div class="progreso-card">
            <h3>📊 Detalle por unidad</h3>
            <table class="progreso-tabla">
                <thead><tr><th>Unidad</th><th>Guía</th><th>Test</th><th>Completar</th><th>Estado</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
        ${puedeCertificar ? `
            <div class="progreso-card" style="background:linear-gradient(135deg,#10b981,#059669);color:#fff;text-align:center">
                <h3 style="color:#fff">🎉 ¡Felicidades! Completaste todas las unidades</h3>
                <p style="margin:12px 0">Ya puedes descargar tu certificado</p>
                <button class="btn-hero" onclick="mostrarCertificado()">🎓 Ver Certificado</button>
            </div>
        ` : ''}
    `;
    document.getElementById('btnCertificado').style.display = puedeCertificar ? 'inline-block' : 'none';
}

// ============ EVALUACIÓN: TEST ============
function iniciarTest(unidadId) {
    if (!estudianteActual) {
        alert('Debes matricularte primero');
        abrirModal('modalRolEstudiante');
        return;
    }
    const u = UNIDADES.find(x => x.id === unidadId);
    const p = progresoActual.find(x => x.unidad_id === unidadId) || {};
    const intentos = p.test_intentos || 0;
    if (intentos >= 2) {
        alert('⚠ Ya usaste tus 2 intentos.\nMejor nota: ' + (p.test_mejor_nota || 0) + '/20');
        return;
    }
    cerrarModal('modalUnidad');
    const preguntas = u.evaluaciones.test.preguntas;
    const html = `
        <div class="eval-header">
            <h3>📝 Test: ${u.nombre}</h3>
            <div class="eval-info">
                <span>Intento <b>${intentos + 1}/2</b></span>
                <span>Preguntas: <b>${preguntas.length}</b></span>
                <span>Nota por pregunta: <b>${(20 / preguntas.length).toFixed(2)}</b></span>
            </div>
        </div>
        <form id="formTest">
            ${preguntas.map((q, i) => `
                <div class="pregunta">
                    <h4>${i + 1}. ${q.pregunta}</h4>
                    <div class="opciones">
                        ${q.opciones.map((op, j) => `
                            <label class="opcion">
                                <input type="radio" name="q${i}" value="${j}" required>
                                <span>${op}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
            <button type="submit" class="btn-primary btn-block" style="margin-top:20px">Enviar respuestas</button>
        </form>
        <div id="resultadoTest" style="display:none"></div>
    `;
    document.getElementById('contenidoEval').innerHTML = html;
    abrirModal('modalEval');
    document.getElementById('formTest').addEventListener('submit', async (e) => {
        e.preventDefault();
        await calificarTest(unidadId, preguntas, intentos);
    });
}

async function calificarTest(unidadId, preguntas, intentoActual) {
    let correctas = 0;
    preguntas.forEach((q, i) => {
        const sel = document.querySelector(`input[name="q${i}"]:checked`);
        const elegida = sel ? parseInt(sel.value) : -1;
        const opciones = document.querySelectorAll(`.pregunta:nth-child(${i + 1}) .opcion`);
        if (elegida === q.correcta) {
            correctas++;
            opciones[q.correcta]?.classList.add('correcta');
        } else {
            if (elegida >= 0) opciones[elegida]?.classList.add('incorrecta');
            opciones[q.correcta]?.classList.add('correcta');
        }
    });
    const nota = parseFloat(((correctas / preguntas.length) * 20).toFixed(2));
    const aprobado = nota >= 12;
    document.querySelectorAll('#formTest input').forEach(inp => inp.disabled = true);
    document.querySelector('#formTest button').style.display = 'none';
    const p = progresoActual.find(x => x.unidad_id === unidadId) || {};
    const nuevosIntentos = (p.test_intentos || 0) + 1;
    const mejorNota = Math.max(p.test_mejor_nota || 0, nota);
    const compOk = (p.completar_mejor_nota || 0) >= 12;
    const testOk = mejorNota >= 12;
    const promedio = (mejorNota + (p.completar_mejor_nota || 0)) / 2;
    const aprobadaUnidad = testOk && compOk && promedio >= 12;
    await DB.guardarProgreso(estudianteActual.email, unidadId, {
        test_intentos: nuevosIntentos,
        test_mejor_nota: mejorNota,
        aprobada: aprobadaUnidad
    });
    document.getElementById('resultadoTest').style.display = 'block';
    document.getElementById('resultadoTest').innerHTML = `
        <div class="resultado-final">
            <h3>${aprobado ? '✅ ¡Aprobado!' : '❌ No aprobado'}</h3>
            <div class="nota ${aprobado ? 'aprobado' : 'reprobado'}">${nota.toFixed(1)}</div>
            <p class="mensaje">Respondiste ${correctas} de ${preguntas.length} correctamente</p>
            <p class="mensaje">Intento ${nuevosIntentos}/2 · Mejor nota: ${mejorNota.toFixed(1)}/20</p>
            <button class="btn-primary" onclick="cerrarModal('modalEval'); recargarProgreso();">Cerrar</button>
        </div>
    `;
    await recargarProgreso();
}

// ============ EVALUACIÓN: COMPLETAR ============
function iniciarCompletar(unidadId) {
    if (!estudianteActual) {
        alert('Debes matricularte primero');
        abrirModal('modalRolEstudiante');
        return;
    }
    const u = UNIDADES.find(x => x.id === unidadId);
    const p = progresoActual.find(x => x.unidad_id === unidadId) || {};
    const intentos = p.completar_intentos || 0;
    if (intentos >= 2) {
        alert('⚠ Ya usaste tus 2 intentos.\nMejor nota: ' + (p.completar_mejor_nota || 0) + '/20');
        return;
    }
    cerrarModal('modalUnidad');
    const ejercicios = u.evaluaciones.completar.ejercicios;
    const html = `
        <div class="eval-header">
            <h3>✏️ Completar Palabras: ${u.nombre}</h3>
            <div class="eval-info">
                <span>Intento <b>${intentos + 1}/2</b></span>
                <span>Ejercicios: <b>${ejercicios.length}</b></span>
            </div>
        </div>
        <form id="formCompletar">
            ${ejercicios.map((e, i) => `
                <div class="ejercicio-completar" id="ej${i}">
                    <div class="pista">${i + 1}. ${e.pista}</div>
                    <input type="text" id="resp${i}" placeholder="Escribe tu respuesta..." required autocomplete="off">
                </div>
            `).join('')}
            <button type="submit" class="btn-primary btn-block" style="margin-top:20px">Enviar respuestas</button>
        </form>
        <div id="resultadoCompletar" style="display:none"></div>
    `;
    document.getElementById('contenidoEval').innerHTML = html;
    abrirModal('modalEval');
    document.getElementById('formCompletar').addEventListener('submit', async (e) => {
        e.preventDefault();
        await calificarCompletar(unidadId, ejercicios, intentos);
    });
}

async function calificarCompletar(unidadId, ejercicios, intentoActual) {
    let correctas = 0;
    ejercicios.forEach((e, i) => {
        const resp = document.getElementById('resp' + i).value.trim().toLowerCase();
        const correcta = e.respuesta.toLowerCase();
        const div = document.getElementById('ej' + i);
        if (resp === correcta) {
            correctas++;
            div.classList.add('correcto');
        } else {
            div.classList.add('incorrecto');
            div.innerHTML += `<p style="margin-top:8px;font-size:13px;color:#991b1b"><b>Respuesta correcta:</b> ${e.respuesta}</p>`;
        }
        document.getElementById('resp' + i).disabled = true;
    });
    const nota = parseFloat(((correctas / ejercicios.length) * 20).toFixed(2));
    const aprobado = nota >= 12;
    document.querySelector('#formCompletar button').style.display = 'none';
    const p = progresoActual.find(x => x.unidad_id === unidadId) || {};
    const nuevosIntentos = (p.completar_intentos || 0) + 1;
    const mejorNota = Math.max(p.completar_mejor_nota || 0, nota);
    const testOk = (p.test_mejor_nota || 0) >= 12;
    const compOk = mejorNota >= 12;
    const promedio = ((p.test_mejor_nota || 0) + mejorNota) / 2;
    const aprobadaUnidad = testOk && compOk && promedio >= 12;
    await DB.guardarProgreso(estudianteActual.email, unidadId, {
        completar_intentos: nuevosIntentos,
        completar_mejor_nota: mejorNota,
        aprobada: aprobadaUnidad
    });
    document.getElementById('resultadoCompletar').style.display = 'block';
    document.getElementById('resultadoCompletar').innerHTML = `
        <div class="resultado-final">
            <h3>${aprobado ? '✅ ¡Aprobado!' : '❌ No aprobado'}</h3>
            <div class="nota ${aprobado ? 'aprobado' : 'reprobado'}">${nota.toFixed(1)}</div>
            <p class="mensaje">${correctas} de ${ejercicios.length} correctas</p>
            <p class="mensaje">Intento ${nuevosIntentos}/2 · Mejor: ${mejorNota.toFixed(1)}/20</p>
            <button class="btn-primary" onclick="cerrarModal('modalEval'); recargarProgreso();">Cerrar</button>
        </div>
    `;
    await recargarProgreso();
}

// ============ CERTIFICADO ============
async function mostrarCertificado() {
    if (!estudianteActual) return;
    let cert = await DB.obtenerCertificado(estudianteActual.email);
    if (!cert) {
        let suma = 0, count = 0;
        progresoActual.forEach(p => {
            if (p.aprobada) {
                suma += ((p.test_mejor_nota || 0) + (p.completar_mejor_nota || 0)) / 2;
                count++;
            }
        });
        if (count < UNIDADES.length) {
            alert('⚠ Aún no apruebas todas las unidades');
            return;
        }
        const promedio = (suma / count).toFixed(2);
        const codigo = 'UNES-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
        cert = await DB.emitirCertificado({
            estudiante_email: estudianteActual.email,
            codigo_certificado: codigo,
            promedio_final: parseFloat(promedio),
            nombre_completo: estudianteActual.nombre_completo,
            cedula: estudianteActual.cedula
        });
        cert = Array.isArray(cert) ? cert[0] : cert;
    }
    const fecha = new Date(cert.fecha_emision).toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `
        <div class="certificado" id="certificadoImprimible">
            <img src="https://www.unes.com.ve/_next/static/media/Unes.ab4c127e.png" alt="Escudo UNES" class="cert-escudo">
            <div class="cert-unes">REPÚBLICA BOLIVARIANA DE VENEZUELA</div>
            <div class="cert-uni">UNIVERSIDAD NACIONAL EXPERIMENTAL DE LA SEGURIDAD</div>
            <div class="cert-titulo">CERTIFICADO</div>
            <div class="cert-sub">Se otorga el presente certificado a:</div>
            <div class="cert-nombre">${cert.nombre_completo}</div>
            <div class="cert-sub">C.I. ${cert.cedula}</div>
            <div class="cert-texto">
                Por haber culminado y aprobado satisfactoriamente el<br>
                <b>DIPLOMADO EN DOCENCIA UNIVERSITARIA</b><br>
                con una carga académica de <b>200 horas</b>, obteniendo un promedio final de
                <b>${parseFloat(cert.promedio_final).toFixed(1)} / 20 puntos</b>.
            </div>
            <div class="cert-firma">
                <div><div class="linea">Msc. Fabio Zavarse Pabón<br>Rector</div></div>
                <div><div class="linea">Cnel. Simón León<br>Vicerrector de Desarrollo Académico</div></div>
            </div>
            <div class="cert-codigo">
                Código de verificación: ${cert.codigo_certificado}<br>
                Emitido el ${fecha}
            </div>
        </div>
        <div class="cert-acciones">
            <button class="btn-primary" onclick="window.print()">🖨 Imprimir / Guardar PDF</button>
            <button class="btn-primary" style="background:#64748b" onclick="cerrarModal('modalCert')">Cerrar</button>
        </div>
    `;
    document.getElementById('contenidoCert').innerHTML = html;
    abrirModal('modalCert');
}
window.mostrarCertificado = mostrarCertificado;
window.iniciarTest = iniciarTest;
window.iniciarCompletar = iniciarCompletar;
window.recargarProgreso = recargarProgreso;

// ============ PANEL ADMIN ============
async function cargarPanelAdmin() {
    const [usuarios, estudiantes, certificados, todosProgresos] = await Promise.all([
        DB.listarUsuariosSistema(),
        DB.listarTodosEstudiantes(),
        DB.listarTodosCertificados(),
        fetch(`${SUPABASE_URL}/rest/v1/progreso`, { headers: DB.headers }).then(r => r.json())
    ]);
    document.getElementById('admTotalEst').textContent = estudiantes.length;
    document.getElementById('admTotalSup').textContent = usuarios.filter(u => u.rol === 'supervisor').length;
    document.getElementById('admTotalCert').textContent = certificados.length;
    const aprobados = estudiantes.filter(est => {
        const suyos = todosProgresos.filter(p => p.estudiante_email === est.email && p.aprobada);
        return suyos.length === 9;
    }).length;
    document.getElementById('admTotalAprob').textContent = aprobados;
    document.getElementById('tablaUsuarios').innerHTML = usuarios.map(u => `
        <tr>
            <td><b>${u.nombre_completo}</b></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.rol === 'administrador' ? 'badge-aprobada' : 'badge-fase'}">${u.rol}</span></td>
            <td>${u.activo ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>
                <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px;min-width:auto" 
                        onclick="toggleUsuario('${u.email}', ${!u.activo})">
                    ${u.activo ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin usuarios</td></tr>';
    document.getElementById('tablaEstudiantesAdmin').innerHTML = estudiantes.map(est => {
        const suyos = todosProgresos.filter(p => p.estudiante_email === est.email);
        const aprobadas = suyos.filter(p => p.aprobada).length;
        return `
            <tr>
                <td><b>${est.nombre_completo}</b></td>
                <td>${est.cedula}</td>
                <td>${est.email}</td>
                <td>
                    <div class="progreso-global" style="height:12px;margin:0">
                        <div class="progreso-global-fill" style="width:${Math.round(aprobadas / 9 * 100)}%"></div>
                    </div>
                    <small>${aprobadas}/9 unidades</small>
                </td>
                <td>
                    <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px;min-width:auto" 
                            onclick="verDetalleEstudiante('${est.email}')">
                        Ver detalle
                    </button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin estudiantes</td></tr>';
}

async function toggleUsuario(email, activo) {
    if (!confirm(`¿${activo ? 'Activar' : 'Desactivar'} este usuario?`)) return;
    await DB.cambiarEstadoUsuario(email, activo);
    await DB.registrarLog(usuarioSistema.email, 'toggle_usuario', `${email} → ${activo}`);
    await cargarPanelAdmin();
}

async function crearUsuarioSistema(e) {
    e.preventDefault();
    const datos = {
        nombre_completo: document.getElementById('nuNombre').value.trim(),
        email: document.getElementById('nuEmail').value.trim().toLowerCase(),
        cedula: document.getElementById('nuCedula').value.trim() || null,
        password_hash: document.getElementById('nuPassword').value,
        rol: document.getElementById('nuRol').value
    };
    try {
        await DB.crearUsuarioSistema(datos);
        await DB.registrarLog(usuarioSistema.email, 'crear_usuario', datos.email);
        alert('✅ Usuario creado');
        cerrarModal('modalCrearUsuario');
        e.target.reset();
        await cargarPanelAdmin();
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

// ============ PANEL SUPERVISOR ============
async function cargarPanelSupervisor() {
    const [estudiantes, certificados, todosProgresos] = await Promise.all([
        DB.listarTodosEstudiantes(),
        DB.listarTodosCertificados(),
        fetch(`${SUPABASE_URL}/rest/v1/progreso`, { headers: DB.headers }).then(r => r.json())
    ]);
    const datosEst = estudiantes.map(est => {
        const suyos = todosProgresos.filter(p => p.estudiante_email === est.email);
        const aprobadas = suyos.filter(p => p.aprobada).length;
        const notas = suyos.filter(p => p.test_mejor_nota > 0 || p.completar_mejor_nota > 0);
        const promedio = notas.length > 0
            ? (notas.reduce((a, p) => a + ((p.test_mejor_nota || 0) + (p.completar_mejor_nota || 0)) / 2, 0) / notas.length).toFixed(1)
            : '0.0';
        return { ...est, aprobadas, promedio: parseFloat(promedio) };
    });
    const aprobados = datosEst.filter(d => d.aprobadas === 9).length;
    const conNotas = datosEst.filter(d => d.promedio > 0);
    const promGlobal = conNotas.length > 0
        ? (conNotas.reduce((a, d) => a + d.promedio, 0) / conNotas.length).toFixed(1)
        : '0.0';
    document.getElementById('supTotalEst').textContent = estudiantes.length;
    document.getElementById('supTotalAprob').textContent = aprobados;
    document.getElementById('supPromedio').textContent = promGlobal;
    document.getElementById('supTotalCert').textContent = certificados.length;
    document.getElementById('tablaEstudiantesSupervisor').innerHTML = datosEst.map(d => {
        const estado = d.aprobadas === 9
            ? '<span class="badge badge-aprobada">✅ Certificado</span>'
            : d.aprobadas > 0
                ? '<span class="badge badge-pendiente">⏳ En curso</span>'
                : '<span class="badge">📝 Iniciando</span>';
        return `
            <tr>
                <td><b>${d.nombre_completo}</b><br><small style="color:#64748b">${d.email}</small></td>
                <td>${d.aprobadas}/9</td>
                <td><b style="color:${d.promedio >= 12 ? '#10b981' : '#f59e0b'}">${d.promedio.toFixed(1)}</b></td>
                <td>${estado}</td>
                <td>
                    <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px;min-width:auto" 
                            onclick="verDetalleEstudiante('${d.email}')">
                        Ver detalle
                    </button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin estudiantes</td></tr>';
}

// ============ VER DETALLE ESTUDIANTE ============
async function verDetalleEstudiante(email) {
    const [est, progreso, cert] = await Promise.all([
        DB.buscarEstudiante(email),
        DB.listarProgresoDeEstudiante(email),
        DB.obtenerCertificado(email)
    ]);
    const filas = UNIDADES.map(u => {
        const p = progreso.find(x => x.unidad_id === u.id) || {};
        return `
            <tr>
                <td>${u.codigo} · ${u.nombre}</td>
                <td>${p.guia_leida ? '✅' : '—'}</td>
                <td>${p.test_intentos || 0}/2 · <b>${p.test_mejor_nota || 0}</b></td>
                <td>${p.completar_intentos || 0}/2 · <b>${p.completar_mejor_nota || 0}</b></td>
                <td>${p.aprobada ? '✅' : '⏳'}</td>
            </tr>
        `;
    }).join('');
    const html = `
        <div class="progreso-card">
            <h3>👤 ${est.nombre_completo}</h3>
            <p style="color:#64748b;font-size:13px">📧 ${est.email} · 🪪 ${est.cedula}</p>
            ${est.telefono ? `<p style="color:#64748b;font-size:13px">📞 ${est.telefono}</p>` : ''}
            ${est.profesion ? `<p style="color:#64748b;font-size:13px">💼 ${est.profesion}</p>` : ''}
            ${est.institucion ? `<p style="color:#64748b;font-size:13px">🏢 ${est.institucion}</p>` : ''}
            ${cert ? `<p style="color:#10b981;font-weight:700;margin-top:10px">🎓 Certificado: ${cert.codigo_certificado} (${cert.promedio_final})</p>` : ''}
        </div>
        <div class="progreso-card">
            <h3>📊 Detalle por unidad</h3>
            <table class="progreso-tabla">
                <thead><tr><th>Unidad</th><th>Guía</th><th>Test</th><th>Completar</th><th>Estado</th></tr></thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
    document.getElementById('detalleUnidad').innerHTML = html;
    document.getElementById('modalUnidad').classList.add('active');
}

window.verDetalleEstudiante = verDetalleEstudiante;
window.toggleUsuario = toggleUsuario;
