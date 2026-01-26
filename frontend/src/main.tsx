import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './style.css'

const rootElement = document.getElementById('app');

if (!rootElement) {
  console.error('Root element #app not found!');
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    console.log('React app mounted successfully');
  } catch (err) {
    console.error('Failed to mount React app:', err);
  }
}
