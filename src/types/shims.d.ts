// Ambient module declarations for packages without bundled types

declare module 'react-konva' {
  export const Stage: any;
  export const Layer: any;
  export const Line: any;
  export const Group: any;
  export const Rect: any;
  export const Text: any;
  export const Transformer: any;
}

declare module 'react-router-dom' {
  export const BrowserRouter: any;
  export { BrowserRouter as Router };
  export const Routes: any;
  export const Route: any;
}

declare module 'zustand' {
  export const create: any;
}

declare module 'zustand/middleware' {
  export const persist: any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}
