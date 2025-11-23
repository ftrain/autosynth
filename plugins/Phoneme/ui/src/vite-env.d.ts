/// <reference types="vite/client" />

declare module '*.jsx' {
  import React from 'react';
  const Component: React.FC<any>;
  export default Component;
}
