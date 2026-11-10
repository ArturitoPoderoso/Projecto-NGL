-- ==============================================================================
-- BLINDAJE DEFINITIVO ANTI-BOTS POR API (BLOQUEO DE 24 HORAS)
-- ==============================================================================
-- INSTRUCCIONES:
-- 1. Ve a Supabase -> SQL Editor (https://supabase.com/dashboard).
-- 2. Copia y pega TODO este código.
-- 3. Presiona "RUN".
-- ==============================================================================

-- A) TABLA AUXILIAR PARA CONTROL DE TRÁFICO (RATE LIMITING)
CREATE TABLE IF NOT EXISTS public.registro_trafico_api (
    id serial PRIMARY KEY,
    fecha_intento timestamp with time zone DEFAULT timezone('utc'::text, now()),
    hash_mensaje text
);

-- B) TRIGGER INTELIGENTE EN SUPABASE CON CASTIGO DE 24 HORAS
CREATE OR REPLACE FUNCTION public.validar_insercion_estricta()
RETURNS trigger AS $$
DECLARE
    v_recientes_5s integer;
    v_duplicados_24h integer;
    v_longitud integer;
BEGIN
    v_longitud := length(TRIM(NEW.contenido));

    -- 1. REGLA DE LONGITUD REAL (Min 2 y Max 350 caracteres)
    IF v_longitud < 2 THEN
        RAISE EXCEPTION 'El mensaje es demasiado corto.';
    END IF;

    IF v_longitud > 350 THEN
        RAISE EXCEPTION 'El mensaje excede el límite permitido de 350 caracteres.';
    END IF;

    -- 2. REGLA DE CONTENIDO REAL (Rechaza solo emojis o solo signos)
    IF NEW.contenido !~ '[a-zA-ZáéíóúÁÉÍÓÚñÑ]' THEN
        RAISE EXCEPTION 'El mensaje debe contener palabras reales.';
    END IF;

    -- 3. REGLA ANTI-KEYBOARD-MASHING (Rechaza machacar teclado sin vocales: ej. asdasdasd / fghjkl)
    IF NEW.contenido ~* '[bcdfghjklmnpqrstvwxyz]{6,}' THEN
        RAISE EXCEPTION 'Mensaje rechazado por contener letras al azar.';
    END IF;

    -- 4. REGLA ANTI-CARACTERES REPETIDOS (ej. aaaaaaaa / jjjjjjj)
    IF NEW.contenido ~* '(.)\1{4,}' THEN
        RAISE EXCEPTION 'Mensaje rechazado por repetición excesiva de caracteres.';
    END IF;

    -- 5. ANTI-DUPLICADOS ESTRICTO: CASTIGO DE 24 HORAS 🚫
    -- Si el MISMO texto ya fue enviado en las últimas 24 HORAS, se rechaza de inmediato.
    SELECT COUNT(*) INTO v_duplicados_24h
    FROM public.mensajes
    WHERE TRIM(LOWER(contenido)) = TRIM(LOWER(NEW.contenido))
      AND fecha_creacion >= (timezone('utc'::text, now()) - INTERVAL '24 hours');

    IF v_duplicados_24h > 0 THEN
        RAISE EXCEPTION 'Este mensaje ya fue enviado en las últimas 24 horas. Bloqueado por spam.';
    END IF;

    -- 6. RATE LIMITING GLOBAL (Frena cualquier ataque de ráfaga por API de bots en Python)
    -- Si entran más de 3 mensajes globales en 5 segundos, la base de datos bloquea el exceso.
    SELECT COUNT(*) INTO v_recientes_5s
    FROM public.registro_trafico_api
    WHERE fecha_intento >= (timezone('utc'::text, now()) - INTERVAL '5 seconds');

    IF v_recientes_5s >= 3 THEN
        RAISE EXCEPTION 'Tráfico sospechoso detectado. Servidor en protección anti-bot.';
    END IF;

    -- Registrar el intento exitoso
    INSERT INTO public.registro_trafico_api (hash_mensaje) VALUES (md5(NEW.contenido));

    -- Auto-limpiar la tabla de tráfico (mantiene solo los últimos 5 minutos)
    DELETE FROM public.registro_trafico_api 
    WHERE fecha_intento < (timezone('utc'::text, now()) - INTERVAL '5 minutes');

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- C) ASIGNAR EL CANDADO DEFINITIVO ANTES DE INSERTAR
DROP TRIGGER IF EXISTS tr_validar_insercion_estricta ON public.mensajes;
CREATE TRIGGER tr_validar_insercion_estricta
BEFORE INSERT ON public.mensajes
FOR EACH ROW
EXECUTE FUNCTION public.validar_insercion_estricta();
