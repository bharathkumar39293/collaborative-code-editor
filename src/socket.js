import { io } from 'socket.io-client';

export const initSocket = async () => {
  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ['websocket'],  // Use only websocket transport
  };
  // Use secure WebSocket protocol for HTTPS backend
  return io("wss://collaborative-code-editor-server-t79n.onrender.com/", options);
};
