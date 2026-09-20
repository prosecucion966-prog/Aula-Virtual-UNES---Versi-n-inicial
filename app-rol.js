// app-rol.js — Sistema multi-rol (estudiante, supervisor, administrador)

let usuarioSistema = null; // supervisor o admin logueado

// ============ EVENTOS DE ACCESO ============
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnEstudiante')?.addEventListener('click', () => abrirModal('modalRolEstudiante'));
    document.getElementById('btnStaff')?.addEventListener('click', () => abrirModal('modalStaff'));
    document.getElementById('formStaff')?.addEventListener('submit', loginStaff);
    document.getElementById('formCrearUsuario')?.addEventListener('submit', crearUsuarioSistema);

    // Restaurar sesión de staff
    const staffEmail = localStorage.getItem('staff_email');
    if (staffEmail) restaurarSesionStaff(staffEmail);

    // Restaurar sesión de estudiante
    const email = localStorage.getItem('unes_email');
    if (email) cargarSesionEstudiante(email);
});

// ============ LOGIN STAFF ============
async function loginStaff(e) {
    e.preventDefault();
    const email = document.getElementById('staffEmail').value.trim().toLowerCase();
    const pass = document.getElementById('staffPassword').value;
    try {
        const user = await DB.loginUsuarioSistema(email, pass);
        usuarioSistema = user;
        localStorage.setItem('staff_email', email);
        await DB.registrarLog(email, 'login', `Rol: ${user.rol}`);
        cerrarModal('modalStaff');
        actualizarUIStaff();
        await mostrarPanelSegunRol();
        alert(`✅ Bienvenido/a, ${user.nombre_completo}`);
    } catch (err) {
        alert('❌ ' + err.message);
    }
}

async function restaurarSesionStaff(email) {
    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(email)}`,
            { headers: DB.headers }
        );
        const data = await res.json();
        if (data[0]?.activo) {
            usuarioSistema = data[0];
            actualizarUIStaff();
        }
    } catch (e) { /* silencioso */ }
}

function actualizarUIStaff() {
    const area = document.getElementById('userArea');
    if (usuarioSistema) {
        const nombre = usuarioSistema.nombre_completo.split(' ')[0];
        const icono = usuarioSistema.rol === 'administrador' ? '👑' : '👨‍🏫';
        area.innerHTML = `
            <button class="btn-user">${icono} ${nombre} (${usuarioSistema.rol})</button>
            <button class="btn-primary" onclick="cerrarSesion()" style="margin-left:8px">Salir</button>
        `;
        // Mostrar nav según rol
        document.getElementById('navProgreso').style.display = 'none';
        if (usuarioSistema.rol === 'administrador') {
            document.getElementById('navAdmin').style.display = 'inline-block';
            document.getElementById('navSupervisor').style.display = 'none';
        } else if (usuarioSistema.rol === 'supervisor') {
            document.getElementById('navSupervisor').style.display = 'inline-block';
            document.getElementById('navAdmin').style.display = 'none';
        }
    }
}

async function mostrarPanelSegunRol() {
    if (usuarioSistema.rol === 'administrador') {
        mostrarVista('admin');
        await cargarPanelAdmin();
    } else if (usuarioSistema.rol === 'supervisor') {
        mostrarVista('supervisor');
        await cargarPanelSupervisor();
    }
}

// ============ LOGIN ESTUDIANTE (override del existente) ============
async function cargarSesionEstudiante(email) {
    try {
        const est = await DB.buscarEstudiante(email);
        if (est && !usuarioSistema) {
            estudianteActual = est;
            await recargarProgreso();
            actualizarUIEstudiante();
        }
    } catch (e) { /* silencioso */ }
}

function actualizarUIEstudiante() {
    if (usuarioSistema) return; // Si hay staff logueado, no tocar
    if (estudianteActual) {
        const area = document.getElementById('userArea');
        const nombre = estudianteActual.nombre_completo.split(' ')[0];
        document.getElementById('navProgreso').style.display = 'inline-block';
        document.getElementById('navAdmin').style.display = 'none';
        document.getElementById('navSupervisor').style.display = 'none';
        area.innerHTML = `
            <button class="btn-user" onclick="mostrarVista('progreso')">👤 ${nombre}</button>
            <button class="btn-primary" onclick="cerrarSesion()" style="margin-left:8px">Salir</button>
        `;
    }
}

// ============ PANEL ADMIN ============
async function cargarPanelAdmin() {
    const [usuarios, estudiantes, certificados, todosProgresos] = await Promise.all([
        DB.listarUsuariosSistema(),
        DB.listarTodosEstudiantes(),
        DB.listarTodosCertificados(),
        fetch(`${SUPABASE_URL}/rest/v1/progreso`, { headers: DB.headers }).then(r => r.json())
    ]);

    // Stats
    document.getElementById('admTotalEst').textContent = estudiantes.length;
    document.getElementById('admTotalSup').textContent = usuarios.filter(u => u.rol === 'supervisor').length;
    document.getElementById('admTotalCert').textContent = certificados.length;
    
    // Aprobados: estudiantes con las 9 unidades aprobadas
    const aprobados = estudiantes.filter(est => {
        const suyos = todosProgresos.filter(p => p.estudiante_email === est.email && p.aprobada);
        return suyos.length === 9;
    }).length;
    document.getElementById('admTotalAprob').textContent = aprobados;

    // Tabla usuarios
    document.getElementById('tablaUsuarios').innerHTML = usuarios.map(u => `
        <tr>
            <td><b>${u.nombre_completo}</b></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.rol === 'administrador' ? 'badge-aprobada' : 'badge-fase'}">${u.rol}</span></td>
            <td>${u.activo ? '✅ Activo' : '❌ Inactivo'}</td>
            <td>
                <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px" 
                        onclick="toggleUsuario('${u.email}', ${!u.activo})">
                    ${u.activo ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin usuarios</td></tr>';

    // Tabla estudiantes
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
                        <div class="progreso-global-fill" style="width:${Math.round(aprobadas/9*100)}%"></div>
                    </div>
                    <small>${aprobadas}/9 unidades</small>
                </td>
                <td>
                    <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px" 
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

    // Calcular datos por estudiante
    const datosEst = estudiantes.map(est => {
        const suyos = todosProgresos.filter(p => p.estudiante_email === est.email);
        const aprobadas = suyos.filter(p => p.aprobada).length;
        const notas = suyos.filter(p => p.test_mejor_nota > 0 || p.completar_mejor_nota > 0);
        const promedio = notas.length > 0
            ? (notas.reduce((a, p) => a + ((p.test_mejor_nota || 0) + (p.completar_mejor_nota || 0)) / 2, 0) / notas.length).toFixed(1)
            : '0.0';
        return { ...est, aprobadas, promedio: parseFloat(promedio), total: suyos.length };
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
                    <button class="btn-eval btn-eval-test" style="padding:6px 12px;font-size:12px" 
                            onclick="verDetalleEstudiante('${d.email}')">
                        Ver detalle
                    </button>
                </td>
            </tr>
        `;
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748b;">Sin estudiantes</td></tr>';
}

// ============ VER DETALLE DE ESTUDIANTE (compartido) ============
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
            ${cert ? `<p style="color:#10b981;font-weight:700;margin-top:10px">🎓 Certificado emitido: ${cert.codigo_certificado} (Promedio: ${cert.promedio_final})</p>` : ''}
        </div>
        <div class="progreso-card">
            <h3>📊 Detalle por unidad</h3>
            <table class="progreso-tabla">
                <thead>
                    <tr><th>Unidad</th><th>Guía</th><th>Test</th><th>Completar</th><th>Estado</th></tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;

    document.getElementById('detalleUnidad').innerHTML = html;
    document.getElementById('modalUnidad').classList.add('active');
}

// ============ CERRAR SESIÓN (override) ============
function cerrarSesion() {
    localStorage.removeItem('unes_email');
    localStorage.removeItem('staff_email');
    location.reload();
}

window.verDetalleEstudiante = verDetalleEstudiante;
window.toggleUsuario = toggleUsuario;
window.cerrarSesion = cerrarSesion;
