# ProgWeb_Practica2_ProgWeb_Manuela_Grizoni

**Credenciales seed**
- **user**
  - user@example.com
  - user123
- **admin**
  - admin@example.com
  - admin123

Aplicación web completa desarrollada como práctica de **Programación Web**, que integra **autenticación con JWT**, **roles (admin/user)**, **productos**, **carrito**, **pedidos**, **GraphQL**, y **chat en tiempo real** con **Socket.IO**, con persistencia en **MongoDB**.

---

## 🚀 Tecnologías principales
- **Node.js + Express** — servidor y API.
- **MongoDB + Mongoose** — persistencia de usuarios, productos, pedidos y mensajes.
- **JWT (JSON Web Tokens)** — autenticación y autorización por roles.
- **GraphQL (Apollo Server)** — Queries/Mutations para productos y pedidos.
- **Socket.IO** — chat en tiempo real con validación de token.
- **HTML, CSS y JavaScript Vanilla** — interfaz de usuario.
- **bcryptjs / cors / cookie-parser / morgan / nodemon** — utilidades backend.

---

## 🔐 Funcionalidades principales

### 1) Autenticación y autorización (REST)
- Registro e inicio de sesión con hash seguro de contraseñas (`bcryptjs`).
- Emisión y validación de **tokens JWT**.
- **Middleware `authenticate`** protege rutas privadas.
- **Middleware `authorize('admin')`** restringe acciones de administrador.
- Logout limpiando `localStorage` (`token` y `user`).

---

### 2) Gestión de productos
- CRUD completo de productos:
  - Usuarios autenticados → pueden ver productos y añadir al carrito.
  - Administradores → pueden crear, editar y eliminar.
- Búsqueda y filtrado por nombre/descripción y rango de precios.
- Interfaz responsive con tabla, formularios y botones de acción.
- **Lectura de productos vía GraphQL** (Query `products`).

---

### 3) Panel de administrador ampliado

#### ✅ Gestión de usuarios (Admin)
- Listar todos los usuarios registrados.
- Cambiar rol **user ↔ admin**.
- Eliminar usuarios.

#### ✅ Gestión de pedidos (Admin)
- Listado de todos los pedidos de la plataforma.
- Filtro por estado:
  - `pending` (En curso)
  - `completed` (Comprado)
- Ver detalle del pedido:
  - usuario que compró
  - lista de productos + cantidades + total
- **Lectura y detalle de pedidos vía GraphQL** (Queries `orders`, `order`).

---

### 4) Carrito de compra (Usuario)
- Botón **“Añadir al carrito”** en el listado de productos.
- Vista del carrito:
  - productos
  - cantidades editables
  - subtotal por línea
  - total
- Persistencia del carrito en **LocalStorage** (se mantiene al recargar y al volver a entrar).
- Badge en el header con número de ítems.

---

### 5) Simulación de compra
- Botón **“Finalizar compra”**:
  - convierte el carrito en un **Order** en MongoDB
  - guarda snapshot de items (name/price/quantity)
  - calcula total
- Al comprar:
  - el carrito **se vacía automáticamente**
- **Creación de pedido vía GraphQL** (Mutation `createOrder`).

---

### 6) Chat en tiempo real
- Integrado con **Socket.IO**.
- Solo usuarios autenticados pueden conectarse (token requerido).
- Mensajes con usuario y hora.
- Indicador “usuario escribiendo…”.
- Notificación de usuarios entrando/saliendo.
- (Opcional) persistencia de historial en MongoDB.

---

## 🧩 Variables de entorno (.env)

``env
PORT=3000
MONGO_URI=mongodb://localhost:27017/tienda
JWT_SECRET=super-secreto-cambialo
JWT_EXPIRES=2d


## ▶️ Cómo arrancar

1. Asegúrate de tener **MongoDB** corriendo (MongoDB Compass o servicio de MongoDB).
2. Instala dependencias:
```bash
npm install
