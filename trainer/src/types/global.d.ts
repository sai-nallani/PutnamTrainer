declare global {
  interface Window {
    __PUTNAM_MACROS?: Record<string, string>;
    MathJax: {
      typesetPromise?: () => Promise<void>;
      [key: string]: any;
    };
  }
}
export {};

declare global {
  interface Window {
    MathJax: {
      typesetPromise?: () => Promise<void>;
      /* eslint-disable @typescript-eslint/no-explicit-any */
      [key: string]: any;
    };
  }
}
