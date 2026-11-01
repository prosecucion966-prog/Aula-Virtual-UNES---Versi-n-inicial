// Adaptador de autenticación para el backend Neon. Se carga después de app.js.
(function () {
  const api = async (path, options = {}) => {
    const response = await fetch('/api/' + path, {
      method: options.method || 'GET',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || 'No se pudo completar la solicitud.');
    return payload;
  };

  window.NeonAPI = api;
  DB.loginUsuarioSistema = async (email, password) => {
    const result = await api('auth/login', { method: 'POST', body: { email, password } });
    return result.user;
  };
  DB.buscarEstudiante = async email => {
    const session = await api('auth/me');
    if (session.user.rol !== 'estudiante' || session.user.email.toLowerCase() !== email.toLowerCase()) return null;
    return session.estudiante;
  };
  DB.registrarEstudiante = async datos => {
    return api('auth/register-student', { method: 'POST', body: {
      nombre: datos.nombre_completo,
      email: datos.email,
      cedula: datos.cedula,
      password: datos.password
    }});
  };
  DB.listarUsuariosSistema = () => api('admin/users');
  DB.crearUsuarioSistema = datos => api('admin/users', { method: 'POST', body: {
    nombre: datos.nombre_completo, email: datos.email, password: datos.password_hash, rol: datos.rol
  }});
  DB.listarTodosEstudiantes = () => api('students');
  DB.obtenerProgreso = async () => api('progress');
  DB.listarProgresoDeEstudiante = async () => api('progress');
  DB.registrarLog = async () => {};

  window.registrarEstudiante = async function (event) {
    event.preventDefault();
    const datos = {
      nombre_completo: document.getElementById('regNombre').value.trim(),
      email: document.getElementById('regEmail').value.trim().toLowerCase(),
      cedula: document.getElementById('regCedula').value.trim(),
      password: document.getElementById('regPassword').value
    };
    try {
      const result = await DB.registrarEstudiante(datos);
      estudianteActual = { ...result.estudiante, nombre_completo: result.estudiante.nombre };
      usuarioSistema = null;
      localStorage.setItem('unes_email', datos.email);
      localStorage.removeItem('staff_email');
      cerrarModal('modalRegistro');
      actualizarUIRol();
      await recargarProgreso();
      alert('Matrícula y cuenta creadas correctamente.');
      event.target.reset();
    } catch (error) { alert(error.message); }
  };

  window.loginEstudiante = async function (event) {
    event.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const password = document.getElementById('loginPassword').value;
    try {
      const result = await api('auth/login', { method: 'POST', body: { email, password } });
      if (result.user.rol !== 'estudiante') {
        await api('auth/logout', { method: 'POST' });
        throw new Error('Esta cuenta no corresponde al perfil de estudiante.');
      }
      const session = await api('auth/me');
      estudianteActual = session.estudiante;
      usuarioSistema = null;
      localStorage.setItem('unes_email', email);
      localStorage.removeItem('staff_email');
      cerrarModal('modalLogin');
      actualizarUIRol();
      await recargarProgreso();
    } catch (error) { alert(error.message); }
  };

  window.loginStaff = async function (event) {
    event.preventDefault();
    const email = document.getElementById('staffEmail').value.trim().toLowerCase();
    const password = document.getElementById('staffPassword').value;
    try {
      const result = await api('auth/login', { method: 'POST', body: { email, password } });
      if (!['docente', 'administrador'].includes(result.user.rol)) {
        await api('auth/logout', { method: 'POST' });
        throw new Error('Esta cuenta no tiene permisos de personal.');
      }
      usuarioSistema = result.user;
      estudianteActual = null;
      localStorage.removeItem('unes_email');
      localStorage.setItem('staff_email', email);
      cerrarModal('modalStaff');
      actualizarUIRol();
      await mostrarPanelSegunRol();
    } catch (error) { alert(error.message); }
  };

  window.crearUsuarioSistema = async function (event) {
    event.preventDefault();
    const datos = {
      nombre_completo: document.getElementById('nuNombre').value.trim(),
      email: document.getElementById('nuEmail').value.trim().toLowerCase(),
      password_hash: document.getElementById('nuPassword').value,
      rol: document.getElementById('nuRol').value
    };
    try {
      await DB.crearUsuarioSistema(datos);
      alert('Cuenta creada correctamente.');
      cerrarModal('modalCrearUsuario');
      event.target.reset();
      await cargarPanelAdmin();
    } catch (error) { alert(error.message); }
  };

  window.mostrarPanelSegunRol = async function () {
    if (!usuarioSistema) return;
    if (usuarioSistema.rol === 'administrador') {
      mostrarVista('admin');
      await cargarPanelAdmin();
    } else if (usuarioSistema.rol === 'docente') {
      mostrarVista('supervisor');
      await cargarPanelSupervisor();
    }
  };

  window.restaurarSesiones = async function () {
    try {
      const session = await api('auth/me');
      if (session.user.rol === 'estudiante') {
        estudianteActual = session.estudiante;
        usuarioSistema = null;
        actualizarUIRol();
        await recargarProgreso();
      } else {
        usuarioSistema = session.user;
        estudianteActual = null;
        actualizarUIRol();
        await mostrarPanelSegunRol();
      }
    } catch (_) {
      localStorage.removeItem('unes_email');
      localStorage.removeItem('staff_email');
    }
  };

  window.cerrarSesion = async function () {
    try { await api('auth/logout', { method: 'POST' }); } catch (_) {}
    localStorage.removeItem('unes_email');
    localStorage.removeItem('staff_email');
    location.reload();
  };
})();
