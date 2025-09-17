import { io } from 'socket.io-client';

export const initSocket = async () => {
  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: ['websocket'],
  };
  const baseUrl = import.meta?.env?.VITE_SOCKET_SERVER_URL || 'http://localhost:5000';
  return io(baseUrl, options);
};
