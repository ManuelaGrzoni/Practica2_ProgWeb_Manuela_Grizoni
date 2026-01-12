# ProgWeb_Practica1

usuario
user@example.com
user123

admin
admin@example.com
admin123

Aplicación web completa desarrollada como práctica de **Programación Web**, que integra **autenticación con JWT**, **gestión de productos con roles**, **persistencia en MongoDB** y un **chat en tiempo real** usando **Socket.IO**.

---

## 🚀 Tecnologías principales
- **Node.js + Express** — servidor y API REST.
- **MongoDB + Mongoose** — persistencia de usuarios, productos y mensajes.
- **JWT (JSON Web Tokens)** — autenticación y autorización por roles.
- **Socket.IO** — chat en tiempo real con validación de token.
- **HTML, CSS y JavaScript Vanilla** — interfaz de usuario.
- **Nodemon / dotenv / bcryptjs / cors / cookie-parser / morgan** — utilidades backend.

---


---

## 🔐 Funcionalidades principales

### 1. Autenticación y autorización
- Registro e inicio de sesión con hash seguro de contraseñas (`bcryptjs`).
- Emisión y validación de **tokens JWT**.
- **Middleware `authenticate`** protege las rutas privadas.
- **Middleware `authorize('admin')`** restringe acciones de administrador.

### 2. Gestión de productos
- CRUD completo de productos:
  - Usuarios autenticados → pueden visualizar productos.
  - Administradores → pueden crear, editar y eliminar.
- Búsqueda y filtrado por nombre, rango de precios y descripción.
- Interfaz responsive con tabla, formularios y botones de acción.

### 3. Chat en tiempo real
- Integrado con **Socket.IO**.
- Solo usuarios autenticados pueden conectarse.
- Cada mensaje muestra nombre de usuario y hora.
- Indicador “usuario escribiendo…” en vivo.
- (Opcional) Persistencia del historial en MongoDB.

### 4. Persistencia
- **Usuarios y productos** almacenados en MongoDB.
- **Mensajes** del chat opcionalmente persistentes.
- Índices e integridad de datos gestionados por **Mongoose**.
- Variables de entorno configuradas en `.env`.

---

## 🧩 Variables de entorno (.env)

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/tienda
JWT_SECRET=super-secreto-cambialo
JWT_EXPIRES=2d
```

---
## Como arrancar 
- Conectar Compass MongoDB
- En la terminal de VS code usa **npm run dev**
- Abre http://localhost:3000/
