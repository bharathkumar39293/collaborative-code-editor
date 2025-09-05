import { io } from 'socket.io-client';

export const initSocket = async () => {
    const options = {
        forceNew: true,
        reconnectionAttempts: Infinity,
        timeout: 10000,
        transports: ['websocket'],
    };
    // Use your actual backend address/port
    return io("https://collaborative-code-editor-server-t79n.onrender.com/", options);
};
