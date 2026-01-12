import express from 'express';
import http from 'http';
import morgan from 'morgan';
import { Server as SocketIOServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

import { PORT, MONGO_URI, JWT_SECRET } from './config.js';
import { seedAdmin } from './utils/seedAdmin.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, { cors: { origin: '*', methods: ['GET', 'POST'] } });

app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/chat', chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

app.get('/', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/health', (_req, res) => res.json({ ok: true }));

let onlineCount = 0;

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token requerido'));
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    socket.user = payload; // { id, username, role }
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const { username } = socket.user;
  const room = 'global';
  socket.join(room);

  onlineCount++;
  io.emit('user:count', { count: onlineCount });
  io.emit('userCount', onlineCount); // compat

  const joinMsg = { type: 'join', username, at: new Date().toISOString() };
  socket.to(room).emit('chat:system', joinMsg);
  socket.to(room).emit('system', { ...joinMsg, user: username }); // compat

  socket.on('chat:message', (text) => {
    if (!text || !text.trim()) return;
    const msg = {
      username,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      at: new Date().toISOString()
    };
    io.to(room).emit('chat:message', msg);
  });

  socket.on('chat:typing', (isTyping) => {
    socket.to(room).emit('chat:typing', { username, isTyping });
    if (isTyping) socket.to(room).emit('typing', username); // compat
  });

  socket.on('disconnect', () => {
    onlineCount = Math.max(0, onlineCount - 1);
    io.emit('user:count', { count: onlineCount });
    io.emit('userCount', onlineCount); // compat
    const leaveMsg = { type: 'leave', username, at: new Date().toISOString() };
    socket.to(room).emit('chat:system', leaveMsg);
    socket.to(room).emit('system', { ...leaveMsg, user: username }); // compat
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Error interno del servidor' });
});

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB conectado');
    await seedAdmin();
    server.listen(PORT, () => console.log(`Servidor escuchando en http://localhost:${PORT}/login.html`));
  } catch (err) {
    console.error('Error al conectar a MongoDB', err);
    process.exit(1);
  }
}
start();
