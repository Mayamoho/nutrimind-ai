
// import React from 'react';
// import ReactDOM from 'react-dom/client';
// import App from './App';

// const rootElement = document.getElementById('root');
// if (!rootElement) {
//   throw new Error("Could not find root element to mount to");
// }

// const root = ReactDOM.createRoot(rootElement);
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

console.log('[index.tsx] Starting app initialization...');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log('[index.tsx] Root element found, creating React root...');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <React.Suspense fallback={<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontSize: '18px', color: '#666'}}>Loading...</div>}>
        <App />
      </React.Suspense>
    </ErrorBoundary>
  </React.StrictMode>
);

console.log('[index.tsx] App rendered successfully');
