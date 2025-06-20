import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { ChatProvider } from '../context/ChatContext.jsx';

const root = document.getElementById('root');

// ✅ iOS WebView keyboard scroll fix
if (typeof window !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  window.scrollTo(0, 0);
  document.body.addEventListener('focusin', () => {
    document.body.style.position = 'fixed';
  });
  document.body.addEventListener('focusout', () => {
    document.body.style.position = '';
  });
}

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatProvider>
          <App />
        </ChatProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);