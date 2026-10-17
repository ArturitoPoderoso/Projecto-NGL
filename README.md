# 💌 NGL Clone - Preguntas Anónimas en Tiempo Real (2 Proyectos Independientes)

Este repositorio contiene la solución completa de un clon moderno de **NGL** (mensajes anónimos), dividido en **dos proyectos independientes** conectados a la misma base de datos en **Supabase** y listos para desplegar en **Vercel** sin necesidad de subdominios.

---

## 📁 Estructura del Repositorio

```text
NGL PROJECT/
├── supabase_schema.sql         # Script SQL con tabla, políticas RLS y Realtime para Supabase
├── README.md                   # Esta guía detallada
│
├── ngl-public/                 # PROYECTO 1: Interfaz Pública (Para enviar mensajes)
│   ├── .env.example            # Ejemplo de variables de entorno
│   ├── index.html              # HTML con meta tags y viewport Mobile-First
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vercel.json             # Configuración de rewrite para Vercel
│   └── src/
│       ├── App.jsx             # Tarjeta estilo Instagram/NGL, avatar, dados aleatorios y éxito
│       ├── index.css           # Estilos Tailwind y gradiente mesh
│       └── lib/supabase.js     # Cliente Supabase (solo INSERT)
│
└── ngl-dashboard/              # PROYECTO 2: Dashboard Privado (Para recibir mensajes)
    ├── .env.example            # Ejemplo de variables de entorno (con VITE_ADMIN_PIN)
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── vercel.json             # Configuración de rewrite para Vercel
    └── src/
        ├── App.jsx             # Lock screen con PIN, Realtime instantáneo, Grid responsivo y sonido
        ├── index.css           # Estilos oscuros y custom scrollbar
        ├── lib/supabase.js     # Cliente Supabase con suscripción Realtime
        └── utils/timeAgo.js    # Formato de tiempo relativo ("Hace 5 min", "Ayer")
```

---

## 🗄️ Paso 1: Configurar Supabase

1. Ve a tu panel de control en [Supabase](https://supabase.com/) y abre tu proyecto (o crea uno nuevo gratuito).
2. En la barra lateral izquierda, entra al **SQL Editor**.
3. Haz clic en **New Query**, pega el contenido del archivo `supabase_schema.sql` (o `supabase_limpieza_24h.sql` si ya tenías la tabla creada) y presiona **Run**:
   - Crea la tabla `mensajes` con columnas `id`, `contenido`, `fecha_creacion`.
   - Activa **Row Level Security (RLS)**.
   - Crea las políticas de seguridad para permitir `INSERT` público anónimo y `SELECT`/`DELETE` en el Dashboard.
   - Habilita la publicación de **Supabase Realtime** (`ALTER PUBLICATION supabase_realtime ADD TABLE public.mensajes;`).
   - Configura la **Autodestrucción Automática de Confesiones a las 24 horas** (Trigger + función `auto_eliminar_confesiones_24h`) para mantener la base de datos libre de saturación.
4. Ve a **Project Settings** -> **API** y copia:
   - **Project URL** (ej: `https://abcdefg.supabase.co`)
   - **anon / public key** (ej: `eyJhbGciOi...`)

---

## 🚀 Paso 2: Ejecución Local

### Proyecto 1: `ngl-public` (Enviar)
```bash
cd ngl-public
npm install
# Crea o edita el archivo .env con tus credenciales de Supabase:
# VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
# VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
npm run dev
```
Abre en tu navegador: `http://localhost:5173`

### Proyecto 2: `ngl-dashboard` (Recibir)
```bash
cd ngl-dashboard
npm install
# Crea o edita el archivo .env:
# VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
# VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
# VITE_ADMIN_PIN=1234
npm run dev
```
Abre en tu navegador: `http://localhost:5174`
- Ingresa el PIN (por defecto: `1234`) y verás la bandeja de entrada.
- ¡Envía un mensaje desde la pestaña del Proyecto 1 y observa cómo aparece al instante en el Proyecto 2 con sonido de notificación y sin recargar la página!

---

## 🌐 Paso 3: Despliegue en Vercel (2 Proyectos Independientes)

Para desplegarlos de forma independiente en Vercel sin subdominios:

### Desplegar `ngl-public`:
1. Sube tu código a GitHub.
2. En Vercel, haz clic en **Add New...** -> **Project**.
3. Selecciona tu repositorio.
4. En **Root Directory**, haz clic en **Edit** y selecciona la carpeta: `ngl-public`.
5. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Tu Anon Key de Supabase.
6. Haz clic en **Deploy**. Obtendrás un dominio como: `ngl-tu-usuario.vercel.app` (este es el enlace que pondrás en Instagram / WhatsApp).

### Desplegar `ngl-dashboard`:
1. En Vercel, haz clic en **Add New...** -> **Project** con el mismo repositorio.
2. En **Root Directory**, haz clic en **Edit** y selecciona la carpeta: `ngl-dashboard`.
3. En **Environment Variables**, añade:
   - `VITE_SUPABASE_URL`: Tu URL de Supabase (la misma).
   - `VITE_SUPABASE_ANON_KEY`: Tu Anon Key de Supabase (la misma).
   - `VITE_ADMIN_PIN`: Tu PIN secreto personal (ej: `5829`).
4. Haz clic en **Deploy**. Obtendrás un dominio independiente como: `ngl-inbox-privado.vercel.app`.

---

## ✨ Características Principales

| Característica | Proyecto 1 (`ngl-public`) | Proyecto 2 (`ngl-dashboard`) |
| :--- | :--- | :--- |
| **Diseño** | 100% Mobile-First (estilo NGL/Instagram) | Modo oscuro refinado (Dark Mode) |
| **Layout PC** | Tarjeta centrada con glassmorphism | Grid responsivo de 3-4 columnas |
| **Interacción** | Generador de preguntas con dados (🎲) | Búsqueda por texto, copiar y borrar |
| **Seguridad** | Total anonimato (solo hace `INSERT`) | Pantalla de bloqueo por PIN |
| **Tiempo Real** | Disparo de confeti al enviar | Suscripción Realtime + audio chime |
