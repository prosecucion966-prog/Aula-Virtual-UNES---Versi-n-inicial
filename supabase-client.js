// ==========================================
// CONEXIÓN A SUPABASE — Aula Virtual UNES
// Sistema multi-rol: estudiante, supervisor, administrador
// ==========================================

// ⚠️ REEMPLAZA ESTOS DOS VALORES CON LOS TUYOS DE SUPABASE:
const SUPABASE_URL = 'https://qgpcseyuqiwobbeiqskj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGNzZXl1cWl3b2JiZWlxc2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDk4NzAsImV4cCI6MjEwNTQyNTg3MH0.sbqnh9RsHLh6R2FA1qCb94GTY-CAA5HaW81aQalbDQ4';
// ==========================================
// CLIENTE DB
// ==========================================
const DB = {
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },

    // ==========================================
    // 👨‍🎓 ESTUDIANTES
    // ==========================================
    async registrarEstudiante(datos) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/estudiantes`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (err.code === '23505') throw new Error('Este email ya está registrado');
            throw new Error('Error al registrar estudiante');
        }
        return await res.json();
    },

    async buscarEstudiante(email) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/estudiantes?email=eq.${encodeURIComponent(email)}`,
            { headers: this.headers }
        );
        const data = await res.json();
        return data[0] || null;
    },

    async listarTodosEstudiantes() {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/estudiantes?order=created_at.desc`,
            { headers: this.headers }
        );
        return await res.json();
    },

    // ==========================================
    // 📊 PROGRESO
    // ==========================================
    async obtenerProgreso(email) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/progreso?estudiante_email=eq.${encodeURIComponent(email)}`,
            { headers: this.headers }
        );
        return await res.json();
    },

    async listarProgresoDeEstudiante(email) {
        return await this.obtenerProgreso(email);
    },

    async guardarProgreso(email, unidadId, campos) {
        // Buscar si ya existe
        const existente = await fetch(
            `${SUPABASE_URL}/rest/v1/progreso?estudiante_email=eq.${encodeURIComponent(email)}&unidad_id=eq.${unidadId}`,
            { headers: this.headers }
        ).then(r => r.json());

        if (existente.length > 0) {
            // Update
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/progreso?estudiante_email=eq.${encodeURIComponent(email)}&unidad_id=eq.${unidadId}`,
                {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify({ ...campos, updated_at: new Date().toISOString() })
                }
            );
            return await res.json();
        } else {
            // Insert
            const res = await fetch(`${SUPABASE_URL}/rest/v1/progreso`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    estudiante_email: email,
                    unidad_id: unidadId,
                    ...campos
                })
            });
            return await res.json();
        }
    },

    // ==========================================
    // 🎓 CERTIFICADOS
    // ==========================================
    async emitirCertificado(datos) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/certificados`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(datos)
        });
        return await res.json();
    },

    async obtenerCertificado(email) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/certificados?estudiante_email=eq.${encodeURIComponent(email)}`,
            { headers: this.headers }
        );
        const data = await res.json();
        return data[0] || null;
    },

    async listarTodosCertificados() {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/certificados?order=fecha_emision.desc`,
            { headers: this.headers }
        );
        return await res.json();
    },

    // ==========================================
    // 🔐 USUARIOS DEL SISTEMA (staff: supervisor/admin)
    // ==========================================
    async loginUsuarioSistema(email, password) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(email)}&activo=eq.true`,
            { headers: this.headers }
        );
        const data = await res.json();
        const user = data[0];
        if (!user) throw new Error('Usuario no encontrado o inactivo');
        if (user.password_hash !== password) throw new Error('Contraseña incorrecta');
        return user;
    },

    async listarUsuariosSistema() {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios_sistema?order=created_at.desc`,
            { headers: this.headers }
        );
        return await res.json();
    },

    async crearUsuarioSistema(datos) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/usuarios_sistema`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(datos)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            if (err.code === '23505') throw new Error('Este email ya existe');
            throw new Error('Error al crear usuario');
        }
        return await res.json();
    },

    async cambiarEstadoUsuario(email, activo) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(email)}`,
            {
                method: 'PATCH',
                headers: this.headers,
                body: JSON.stringify({ activo })
            }
        );
        return await res.json();
    },

    async eliminarUsuarioSistema(email) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/usuarios_sistema?email=eq.${encodeURIComponent(email)}`,
            { method: 'DELETE', headers: this.headers }
        );
        return res.ok;
    },

    // ==========================================
    // 📝 LOG DE ACTIVIDAD (auditoría)
    // ==========================================
    async registrarLog(email, accion, detalle = '') {
        try {
            await fetch(`${SUPABASE_URL}/rest/v1/log_actividad`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    usuario_email: email,
                    accion: accion,
                    detalle: detalle
                })
            });
        } catch (e) {
            // Silencioso, no queremos que un error de log rompa la app
            console.warn('Error al registrar log:', e);
        }
    },

    async listarLogActividad(limite = 100) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/log_actividad?order=created_at.desc&limit=${limite}`,
            { headers: this.headers }
        );
        return await res.json();
    }
};
