const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const config = {
  api: {
    baseUrl: API_URL,
    timeout: 30000,
    retries: 3,
  },
  socket: {
    url: WS_URL,
    options: {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    },
  },
  pagination: {
    defaultLimit: 20,
    maxLimit: 100,
  },
  storage: {
    prefix: 'croma_',
    keys: {
      authToken: 'auth_token',
      user: 'user',
      cart: 'cart',
      wizardProgress: 'wizard_progress',
    },
  },
  upload: {
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedFormats: ['pdf', 'ai', 'jpg', 'jpeg', 'png', 'svg', 'doc', 'docx'],
  },
};

export type Config = typeof config;
