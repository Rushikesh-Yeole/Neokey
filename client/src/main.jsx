// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { HashRouter } from 'react-router-dom';  // Import HashRouter instead of BrowserRouter
import { AppContextProvider } from './context/AppContext.jsx';

createRoot(document.getElementById('root')).render(
  <HashRouter>  {/* Use HashRouter instead of BrowserRouter */}
    <AppContextProvider>
      <App />
    </AppContextProvider>
  </HashRouter>
);