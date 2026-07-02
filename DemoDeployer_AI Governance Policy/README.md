# DemoDeployer — AI Governance Policy Builder

Carpeta **lista para desplegar** de la herramienta *AI Governance Policy
Builder* (bilingüe EN/ES). Es una **demo 100 % en el navegador**: no necesita
servidor ni base de datos. Todo el motor de reglas, el cuestionario, las
plantillas, la puntuación y la generación del paquete corren en el cliente, y
los datos (sesión, paquete generado, leads, ediciones de administración) se
guardan en el `localStorage` del visitante.

> ⚠️ **Es una demo, no la versión de producción y no es asesoramiento jurídico.**
> Genera materiales preliminares de gobernanza de IA con fines informativos. La
> versión de servidor completa (`src/server` del proyecto) es la que emite
> `.docx` nativo y guarda los leads en el servidor.

Funciona **idéntica en Vercel y en Cloudflare Pages** porque es un sitio
estático (HTML + JS + CSS con rutas relativas).

---

## Contenido de la carpeta

```
index.html                                  → punto de entrada (multi-archivo)
assets/                                      → JS + CSS compilados
vercel.json                                  → configuración estática para Vercel
_redirects                                   → fallback SPA para Cloudflare Pages
AI-Governance-Policy-Builder.standalone.html → TODO en un solo archivo (ver abajo)
README.md                                    → este archivo
```

No hay paso de compilación: se sube tal cual.

### Dos formas de usarlo

1. **Multi-archivo** (`index.html` + `assets/`): sube la carpeta completa. Es lo
   recomendado para Vercel / Cloudflare Pages.
2. **Un solo archivo** (`AI-Governance-Policy-Builder.standalone.html`): TODO el
   HTML, CSS y JS incrustados en un único fichero (~284 KB). Ábrelo con doble
   clic, súbelo suelto a cualquier hosting, o mándalo por email. No necesita la
   carpeta `assets/`. Ideal para una demo portátil.

---

## Opción A — Vercel

**Desde la web (arrastrar y soltar):**
1. Entra en https://vercel.com/new
2. Crea un proyecto y, cuando pida el *Framework Preset*, elige **Other**.
3. *Build Command*: (vacío). *Output Directory*: **`.`** (esta carpeta).
4. Sube/selecciona esta carpeta y pulsa **Deploy**.

**Desde la terminal (CLI):**
```bash
npm i -g vercel
cd "DemoDeployer_AI Governance Policy"
vercel deploy --prod
```
Cuando pregunte por configuración, acepta los valores por defecto (proyecto
estático, sin build). `vercel.json` ya deja las rutas correctas.

---

## Opción B — Cloudflare Pages

**Desde la web (arrastrar y soltar):**
1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Upload assets**.
2. Ponle un nombre al proyecto y **arrastra esta carpeta** (o su contenido).
3. **Deploy site**. El archivo `_redirects` ya incluye el fallback SPA.

**Desde la terminal (CLI con Wrangler):**
```bash
npm i -g wrangler
cd "DemoDeployer_AI Governance Policy"
wrangler pages deploy .
```

---

## Cómo se usa

1. Elige idioma (English / Español).
2. Acepta el aviso legal (obligatorio antes de generar nada).
3. Responde el cuestionario (categorías A–J).
4. Obtén la **puntuación de preparación** y el **paquete preliminar** (13
   secciones).
5. Exporta en **JSON**, **PDF** (vista lista para imprimir → «Guardar como PDF»)
   o **DOCX** (documento de Word; en la demo es un documento Word basado en HTML
   que abre en Word/LibreOffice — la versión de servidor emite `.docx` nativo).
6. Envía el formulario de contacto (los leads se guardan en `localStorage`).

**Área de administración:** token **`admin-demo`**. Permite editar preguntas,
plantillas, puntuación, traducciones y ver los leads (todo en `localStorage`).

Para reiniciar la demo: borra los datos del sitio en el navegador
(*localStorage*).

---

## Regenerar esta carpeta desde el código fuente

Desde la raíz del proyecto `ai-governance-policy-builder`:
```bash
npm install
npm run build:demo          # genera dist/demo (estático, sin backend)
# copia dist/demo dentro de esta carpeta y conserva vercel.json / _redirects / README.md
```
