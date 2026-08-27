/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare module '*.svg' {
  import * as React from 'react';

  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement> & { title?: string }>;
  export default ReactComponent;
}
declare const VITE_APP_VERSION: string;
