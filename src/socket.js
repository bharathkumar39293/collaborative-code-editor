import { io } from 'socket.io-client';

export const initSocket = async () => {
  const resolveBaseUrl = () => {
    // 1) Explicit env override always wins
    const envUrl = import.meta?.env?.VITE_SOCKET_SERVER_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }

    // 2) If running Vite dev on :5173, default to backend on :5000
    if (typeof window !== 'undefined') {
      const { origin, port, hostname, protocol } = window.location;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        if (port === '5173') return 'http://localhost:5000';
        // If app is served by the same server (no 5173), reuse origin
        return origin;
      }
      // Non-localhost: assume same origin in production
      return origin || `${protocol}//${hostname}`;
    }

    // 3) Fallback
    return 'http://localhost:5000';
  };

  const options = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    // Allow fallback to polling when native WS is restricted
    transports: ['websocket', 'polling'],
  };
  const baseUrl = resolveBaseUrl();
  return io(baseUrl, options);
};
