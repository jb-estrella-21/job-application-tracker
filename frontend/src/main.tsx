import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/source-serif-4'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './features/auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './features/settings/SettingsContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  </StrictMode>,
);
