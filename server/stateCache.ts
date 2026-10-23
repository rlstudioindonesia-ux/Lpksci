// Central state caching and versioning module
// Extracted to break circular dependencies between server.ts and domain handlers

let stateVersion = 1;
let cachedStateResponse: string | null = null;

export function getStateVersion(): number {
  return stateVersion;
}

export function getCachedStateResponse(): string | null {
  return cachedStateResponse;
}

export function setCachedStateResponse(resp: string | null): void {
  cachedStateResponse = resp;
}

export function invalidateStateCache(): void {
  stateVersion++;
  cachedStateResponse = null;
}
