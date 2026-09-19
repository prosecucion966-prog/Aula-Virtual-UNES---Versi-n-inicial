// ==========================================
// CONEXIÓN A SUPABASE — Aula Virtual UNES
// ==========================================

// ⚠️ REEMPLAZA ESTOS DOS VALORES CON LOS TUYOS DE SUPABASE:
const SUPABASE_URL = 'https://qgpcseyuqiwobbeiqskj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFncGNzZXl1cWl3b2JiZWlxc2tqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4NDk4NzAsImV4cCI6MjEwNTQyNTg3MH0.sbqnh9RsHLh6R2FA1qCb94GTY-CAA5HaW81aQalbDQ4';

// Cliente usando fetch (sin librería externa)
const DB = {
    headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    },

    // --- ESTUDIANTES ---
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

    // --- PROGRESO ---
    async obtenerProgreso(email) {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/progreso?estudiante_email=eq.${encodeURIComponent(email)}`,
            { headers: this.headers }
        );
        return await res.json();
    },

    async guardarProgreso(email, unidadId, campos) {
        const existente = await fetch(
            `${SUPABASE_URL}/rest/v1/progreso?estudiante_email=eq.${encodeURIComponent(email)}&unidad_id=eq.${unidadId}`,
            { headers: this.headers }
        ).then(r => r.json());

        if (existente.length > 0) {
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

    // --- CERTIFICADOS ---
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
    }
};