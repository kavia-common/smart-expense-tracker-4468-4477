import React from 'react';

/**
 * ProtectedRoute (auth disabled): simple passthrough that renders children.
 */
export default function ProtectedRoute({ children }) {
  return <>{children}</>;
}
