import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Register (auth disabled) - informational page
 */
export default function Register() {
  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">Registration Disabled</h1>
        <p className="auth-subtitle">
          The application is running in mock mode. Account registration is not required.
        </p>
      </div>
    </div>
  );
}
