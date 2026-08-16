import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Components fire real API calls on mount (audits, data fetches). Stub fetch
// globally so smoke tests stay hermetic and don't spam errors for relative
// URLs jsdom can't resolve.
if (typeof globalThis.fetch !== 'function' || !(globalThis.fetch as any).__isSmokeTestStub) {
  const stub = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    } as Response),
  );
  (stub as any).__isSmokeTestStub = true;
  globalThis.fetch = stub as any;
}

// jsdom doesn't implement scrollIntoView / matchMedia used throughout the app.
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || (() => {});
  window.scrollTo = (() => {}) as typeof window.scrollTo;
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  } as any));
}
