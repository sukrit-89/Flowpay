import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './test-addresses'; // Test address conversions
import { validateConfig } from './lib/config';

// Validate configuration on app load
try {
    validateConfig();
} catch (error) {
    console.error('❌ Configuration validation failed:', error);
    // Show error to user
    document.body.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1a1a1a; color: #ff4444; font-family: monospace; padding: 20px; text-align: center;">
            <div>
                <h1>⚠️ Configuration Error</h1>
                <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
                <p style="color: #888; margin-top: 20px;">Check your .env file and ensure all required values are set.</p>
            </div>
        </div>
    `;
    throw error;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
