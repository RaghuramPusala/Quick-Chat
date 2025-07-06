import { io } from 'socket.io-client';

const socket = io('https://quick-chat-backend-yceh.onrender.com', {
  transports: ['websocket'],
  autoConnect: false,
});

export default socket;
