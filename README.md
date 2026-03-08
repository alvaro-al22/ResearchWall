# Research Wall — Tablero de Investigación Visual

Aplicación web para gestionar casos de investigación de forma visual. Permite crear fichas de sujetos, definir relaciones entre ellos, organizarlos en un canvas interactivo y contar con un asistente de IA que rellena la información automáticamente.

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Una cuenta en [Supabase](https://supabase.com/) (gratuita)
- Una API Key de un proveedor de IA compatible (ver sección Watson)

---

## 1. Clonar e instalar dependencias

```bash
git clone <url-del-repositorio>
cd ResearchWall
npm install
```

---

## 2. Configurar Supabase

### 2.1 Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com/) y crea un nuevo proyecto.
2. Una vez creado, ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key

### 2.2 Crear las tablas

En el **SQL Editor** de Supabase, ejecuta el contenido del archivo `supabase-schema.sql` incluido en el repositorio. Esto creará las tablas `projects`, `characters` y `relationships`.

Si ya tienes la tabla `characters` creada previamente sin la columna de etiquetas, ejecuta también:

```sql
ALTER TABLE characters ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
```

### 2.3 Variables de entorno

Crea un archivo `.env.local` en la raíz del proyecto con el siguiente contenido:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_publica
VITE_AI_API_KEY=tu_api_key_de_ia
```

> La variable `VITE_AI_API_KEY` es necesaria para el asistente Watson. Sin ella, el chat seguirá visible pero mostrará un aviso y no enviará mensajes.

---

## 3. Arrancar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

---

## Cómo funciona

### Casos

La pantalla principal muestra todos tus casos de investigación. Puedes crear uno nuevo con el botón **+ Nuevo Caso**, abrirlo haciendo clic, o eliminarlo con el icono de papelera.

### Tablero

Cada caso abre un canvas interactivo con:

| Acción | Resultado |
|---|---|
| Clic sobre una tarjeta | Voltea la tarjeta y muestra detalles del sujeto |
| Doble clic sobre una tarjeta | Abre el formulario de edición |
| Arrastrar una tarjeta | La mueve en el canvas (posición guardada automáticamente) |
| Clic derecho + arrastrar | Mueve el lienzo (pan) |
| Rueda del ratón | Zoom |
| Arrastrar desde el punto superior de una tarjeta | Crea una conexión entre sujetos |
| Clic sobre una relación | Edita la relación |
| Tecla `Supr` sobre selección | Elimina nodos o relaciones seleccionados |

### Fichas de sujetos

El formulario de edición de un sujeto está organizado en 6 pestañas:

- **🪪 ID** — Nombre, alias, edad, estado vital, nacionalidad, rol, etiquetas, color
- **🧠 Psicología** — Personalidad, miedos, motivaciones, objetivos, secretos
- **📍 Localización** — Lugar de nacimiento, país, residencia, clase social
- **💼 Historial** — Familia, profesión, estudios, trabajo actual, experiencia / antecedentes
- **🩺 Físico** — Altura, complexión, rasgos distintivos
- **📋 Expediente** — Notas libres

Los campos de país utilizan datos de una API pública. Los campos de ciudad ofrecen autocompletado mediante búsqueda geográfica.

### Relaciones

Al conectar dos sujetos se abre un formulario para definir el tipo de relación (familiar, profesional, enemigos, amor, secreta, desconocida), una etiqueta descriptiva, la intensidad (1–5) y si es bidireccional. Cada relación se muestra en el canvas como una línea con un post-it flotante.

### Expediente del caso

Desde la barra lateral puedes abrir el **Expediente del Caso**: un área de texto libre para apuntar la narrativa, línea de tiempo o contexto general de la investigación.

### Agrupación y organización

El panel lateral permite reagrupar los nodos del canvas automáticamente por residencia, profesión o estado vital.

### Importar / Exportar

Los sujetos se pueden exportar a un archivo JSON y volver a importarse en cualquier caso.

---

## Watson — Asistente de IA

Watson es el asistente integrado, accesible desde el botón **🕵️ Watson AI** en la esquina inferior derecha del tablero.

Puedes contarle información sobre el caso o los sujetos en lenguaje natural. Watson analizará el texto y propondrá:

- **Actualizar fichas** de sujetos existentes con los datos detectados
- **Crear nuevas relaciones** entre sujetos
- **Actualizar el expediente** del caso con información relevante

Antes de aplicar cualquier cambio, se muestra un diálogo de confirmación donde puedes revisar y seleccionar exactamente qué cambios quieres aplicar. Ningún dato se modifica sin tu aprobación.

### Configurar la API de IA

Watson utiliza una API de inteligencia artificial externa. Para activarlo:

1. Obtén una API Key del proveedor que uses.
2. Añádela a tu `.env.local`:
   ```env
   VITE_AI_API_KEY=tu_api_key
   ```
3. Reinicia el servidor de desarrollo (`npm run dev`).

---

## Stack tecnológico

- **React 18 + Vite + TypeScript**
- **Tailwind CSS v4**
- **@xyflow/react** — canvas de nodos interactivo
- **Supabase** — base de datos y autenticación
