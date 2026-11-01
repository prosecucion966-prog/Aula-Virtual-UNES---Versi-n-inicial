-- Migración Neon: campos de seguimiento académico y certificados.
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS guia_leida boolean NOT NULL DEFAULT false;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS test_intentos integer NOT NULL DEFAULT 0;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS test_mejor_nota numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS completar_intentos integer NOT NULL DEFAULT 0;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS completar_mejor_nota numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS aprobada boolean NOT NULL DEFAULT false;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS completado boolean NOT NULL DEFAULT false;
ALTER TABLE progreso ADD COLUMN IF NOT EXISTS actualizado_en timestamptz NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS progreso_estudiante_unidad_uidx ON progreso(estudiante_id, unidad);
ALTER TABLE certificados ADD COLUMN IF NOT EXISTS promedio_final numeric(5,2);
CREATE UNIQUE INDEX IF NOT EXISTS certificados_estudiante_uidx ON certificados(estudiante_id);
