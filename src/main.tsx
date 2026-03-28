import React from 'react';
import ReactDOM from 'react-dom/client';
import { validateFirebaseEnv } from '@/lib/env';
import { SetupMissingConfig } from '@/components/SetupMissingConfig';
import App from './App';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeModeProvider } from '@/context/ThemeModeContext';
import './index.css';

const envValidation = validateFirebaseEnv();

if (!envValidation.ok) {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <SetupMissingConfig missing={envValidation.missing} />
    </React.StrictMode>
  );
} else {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeModeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeModeProvider>
    </React.StrictMode>
  );
}
