-- ========================================================
-- SCHEMA SQL PARA SUPABASE - CLON NGL (PREGUNTAS ANÓNIMAS)
-- ========================================================
-- Ejecuta este script en el "SQL Editor" de tu panel de Supabase.

-- 1. Crear la tabla de mensajes
CREATE TABLE IF NOT EXISTS public.mensajes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contenido TEXT NOT NULL CHECK (char_length(contenido) > 0 AND char_length(contenido) <= 1000),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar Row Level Security (RLS) para proteger la base de datos
ALTER TABLE public.mensajes ENABLE ROW LEVEL SECURITY;

-- 3. Política para el PROYECTO 1 (Público):
-- Permite que cualquier usuario anónimo (sin autenticar) pueda enviar (INSERT) mensajes.
CREATE POLICY "Permitir insertar mensajes publicos anonimos"
ON public.mensajes
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Política para el PROYECTO 2 (Dashboard Privado):
-- Permite que el Dashboard pueda leer (SELECT) los mensajes utilizando la anon key.
CREATE POLICY "Permitir leer mensajes anon"
ON public.mensajes
FOR SELECT
TO anon
USING (true);

-- 5. Política para eliminar mensajes desde el Dashboard (DELETE):
CREATE POLICY "Permitir eliminar mensajes anon"
ON public.mensajes
FOR DELETE
TO anon
USING (true);

-- 6. HABILITAR SUPABASE REALTIME (CRÍTICO)
-- Agrega la tabla a la publicación de realtime para que el Dashboard reciba eventos en vivo.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'mensajes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;
    END IF;
END $$;

-- 7. Crear índice para optimizar la consulta ordenada por fecha
CREATE INDEX IF NOT EXISTS idx_mensajes_fecha_creacion ON public.mensajes (fecha_creacion DESC);

-- ========================================================
-- 8. AUTODESTRUCCIÓN AUTOMÁTICA DE CONFESIONES (24 HORAS)
-- ========================================================
-- Función que elimina automáticamente los mensajes con más de 24 horas de antigüedad
CREATE OR REPLACE FUNCTION public.auto_eliminar_confesiones_24h()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.mensajes
    WHERE fecha_creacion < (timezone('utc'::text, now()) - INTERVAL '24 hours');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Disparador que ejecuta la limpieza automáticamente cada vez que se envía una confesión
DROP TRIGGER IF EXISTS trigger_auto_eliminar_24h ON public.mensajes;
CREATE TRIGGER trigger_auto_eliminar_24h
AFTER INSERT ON public.mensajes
FOR EACH STATEMENT
EXECUTE FUNCTION public.auto_eliminar_confesiones_24h();

-- Alternativa complementaria con pg_cron (ejecución periódica cada 30 minutos)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'limpieza_confesiones_24h',
            '*/30 * * * *',
            'DELETE FROM public.mensajes WHERE fecha_creacion < (timezone(''utc''::text, now()) - INTERVAL ''24 hours'');'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Mensaje de confirmación:
COMMENT ON TABLE public.mensajes IS 'Tabla de mensajes anónimos estilo NGL con autodestrucción a las 24 horas';

