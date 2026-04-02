import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// If running in browser (not Electron), inject mock API
if (!(window as any).api) {
  import('./lib/mockApi').then(({ mockApi }) => {
    (window as any).api = mockApi;
    renderApp();
  });
} else {
  renderApp();
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
