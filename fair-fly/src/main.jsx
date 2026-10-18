import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ToastProvider from './components/UI/toast/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LightboxProvider } from './components/UI/ImageLightbox/ImageLightbox';
import { PdfModalProvider } from './components/Shared/PdfDocument/PdfDocumentView';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        <NotificationProvider>
          <LightboxProvider>
            <PdfModalProvider>
              <App />
            </PdfModalProvider>
          </LightboxProvider>
        </NotificationProvider>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
)
