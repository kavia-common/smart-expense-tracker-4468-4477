import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Login (auth disabled) - informational page
 */
export default function Login() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Authentication Disabled</h1>
        <p className="auth-subtitle">
          The application is running in mock mode. All routes are publicly accessible and do not require login.
        </p>
      </div>
    </div>
  );
}
