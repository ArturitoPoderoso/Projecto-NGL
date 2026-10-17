-- ==============================================================================
-- SCRIPT DE LIMPIEZA / AUTODESTRUCCIÓN AUTOMÁTICA DE CONFESIONES (24 HORAS)
-- Copia y pega esto en el "SQL Editor" de tu proyecto de Supabase y dale a "RUN".
-- ==============================================================================

-- 1. Crear función que borra confesiones con más de 24 horas de antigüedad
CREATE OR REPLACE FUNCTION public.auto_eliminar_confesiones_24h()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM public.mensajes
    WHERE fecha_creacion < (timezone('utc'::text, now()) - INTERVAL '24 hours');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Crear Trigger que ejecuta la limpieza automáticamente cada vez que alguien envía una confesión
DROP TRIGGER IF EXISTS trigger_auto_eliminar_24h ON public.mensajes;
CREATE TRIGGER trigger_auto_eliminar_24h
AFTER INSERT ON public.mensajes
FOR EACH STATEMENT
EXECUTE FUNCTION public.auto_eliminar_confesiones_24h();

-- 3. Limpieza inmediata manual (por si ya tienes mensajes viejos en la base de datos)
DELETE FROM public.mensajes
WHERE fecha_creacion < (timezone('utc'::text, now()) - INTERVAL '24 hours');

-- 4. Opcional: Programar limpieza periódica de respaldo si tienes pg_cron activo
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
