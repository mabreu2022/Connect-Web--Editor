const rooms = {};

// Configura o servidor de sinalização WebRTC via Socket.IO
function setupWebRTCSignaling(io) {
  io.on('connection', (socket) => {
    console.log('[WebRTC Signaling] Novo cliente conectado:', socket.id);

    // Entrar numa sala de chamada
    socket.on('join-room', ({ roomId, role }) => {
      if (!rooms[roomId]) {
        rooms[roomId] = { caller: null, callee: null, createdAt: Date.now() };
      }

      const room = rooms[roomId];

      if (role === 'caller') {
        room.caller = socket.id;
        console.log(`[WebRTC] Caller entrou na sala ${roomId}`);
      } else if (role === 'callee') {
        room.callee = socket.id;
        console.log(`[WebRTC] Callee (atendente) entrou na sala ${roomId}`);

        // Notifica o caller que o atendente entrou
        if (room.caller) {
          io.to(room.caller).emit('callee-joined', { roomId });
        }
      }

      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.role = role;
    });

    // Relay do SDP Offer (caller → callee)
    socket.on('offer', ({ roomId, offer }) => {
      const room = rooms[roomId];
      if (room && room.callee) {
        console.log(`[WebRTC] Relay offer sala ${roomId}`);
        io.to(room.callee).emit('offer', { offer });
      }
    });

    // Relay do SDP Answer (callee → caller)
    socket.on('answer', ({ roomId, answer }) => {
      const room = rooms[roomId];
      if (room && room.caller) {
        console.log(`[WebRTC] Relay answer sala ${roomId}`);
        io.to(room.caller).emit('answer', { answer });
      }
    });

    // Relay dos ICE Candidates (ambos os lados)
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      const room = rooms[roomId];
      if (!room) return;

      const targetId = socket.data.role === 'caller' ? room.callee : room.caller;
      if (targetId) {
        io.to(targetId).emit('ice-candidate', { candidate });
      }
    });

    // Encerrar chamada
    socket.on('leave-room', ({ roomId }) => {
      const room = rooms[roomId];
      if (room) {
        // Notifica o outro peer
        socket.to(roomId).emit('peer-left');
        delete rooms[roomId];
        console.log(`[WebRTC] Sala ${roomId} encerrada.`);
      }
      socket.leave(roomId);
    });

    // Desconexão inesperada
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId && rooms[roomId]) {
        socket.to(roomId).emit('peer-left');
        delete rooms[roomId];
        console.log(`[WebRTC] Cliente desconectado. Sala ${roomId} encerrada.`);
      }
    });
  });

  // Limpa salas antigas a cada 30 minutos
  setInterval(() => {
    const now = Date.now();
    Object.keys(rooms).forEach(roomId => {
      if (now - rooms[roomId].createdAt > 30 * 60 * 1000) {
        delete rooms[roomId];
        console.log(`[WebRTC] Sala antiga removida: ${roomId}`);
      }
    });
  }, 30 * 60 * 1000);
}

module.exports = { setupWebRTCSignaling };
