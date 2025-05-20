# Front Calendarios - Panel de Gestión

Este proyecto es un frontend desarrollado con **React** y **TypeScript**, utilizando el **sistema de diseño Metronic 8** como base visual. Se conecta a un backend en FastAPI para gestionar entidades como `plantillas`, `procesos`, `clientes`, entre otras.

---

## 🚀 Comenzando (Linux)

### 🧱 Requisitos

- Node.js >= 18
- npm o yarn
- Acceso a la API (requiere cabecera `x_api_key`)
- Backend corriendo en red (ver `.env` o configuración en `axiosConfig.ts`)

### 📦 Instalación

```bash
# Instala las dependencias
npm install
# o con yarn
yarn install
```

### ▶️ Ejecutar en modo desarrollo

```bash
npm run start
# o
yarn start
```

> El frontend correrá en `http://localhost:3000` (o un puerto alternativo si está ocupado).

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── modules/               # CRUDs por entidad (plantillas, procesos...)
│   ├── routing/               # Rutas protegidas y públicas
│   ├── pages/                 # Componentes del dashboard y secciones
│   └── api/                   # Configuración de Axios global
├── _metronic/                # Plantilla base de Metronic 8 (diseño, helpers)
```

---

## ⚙️ Configuración de Axios (`src/app/api/axiosConfig.ts`)

```ts
import axios from 'axios'

const instance = axios.create({
  baseURL: 'http://10.150.22.15:8092',
  headers: {
    'x_api_key': 'clave_powerbi_123',  // Cabecera requerida por el backend
  }
})

export default instance
```

> Este archivo centraliza todas las llamadas HTTP y asegura que **la clave API** se envíe correctamente.

---

## 🧱 Cómo Crear un CRUD (entidad nueva)

1. **Crea una carpeta en `src/app/modules/<entidad>`**
2. Crea los componentes:
   - `<Entidad>List.tsx`: listado con tabla
   - `<Entidad>Form.tsx`: formulario crear/editar
   - `<Entidad>Detail.tsx`: vista detalle (opcional)
3. Crea un archivo `api.ts` con funciones axios (`getAll`, `create`, `update`, `delete`, etc.)
4. Registra las rutas en `PrivateRoutes.tsx`:

```tsx
<Route path='entidad' element={<EntidadList />} />
<Route path='entidad/crear' element={<EntidadForm />} />
<Route path='entidad/editar/:id' element={<EntidadForm />} />
<Route path='entidad/ver/:id' element={<EntidadDetail />} />
```

---

## 🛡️ Seguridad

Este frontend **usa cabeceras `x_api_key`** para autenticar contra el backend. Las llamadas HTTP están protegidas con dicha clave.

---

## 🎨 Metronic 8

El diseño visual y muchos componentes vienen de la plantilla **Metronic 8**. Para mantener consistencia:

- Usa `KTCard`, `KTCardBody`, `KTSVG` para UI
- Usa clases de Bootstrap 5 para márgenes y estilos (`mb-5`, `d-flex`, etc.)

---

## 🤖 Consejos para juniors

- Siempre revisa `F12 > Network` si una llamada falla.
- Asegúrate que estás enviando `x_api_key`.
- Si algo carga mal, revisa rutas y consola del navegador.
- Para añadir entidades nuevas, **sigue la estructura modular**.

---

## ✨ Mantenimiento

Este proyecto puede crecer, por eso:
- Agrupamos lógica por entidad
- Rutas están centralizadas
- Axios se configura solo una vez

---

## 📬 Autor

Equipo Atisa Developer 👊
