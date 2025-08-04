// Global reference to store the dashboard refresh function
let globalRefreshFunction: (() => void) | undefined = undefined;

export const setGlobalRefreshFunction = (fn: (() => void) | undefined) => {
  console.log('🌍 Global: Setting refresh function, type:', typeof fn);
  globalRefreshFunction = fn;
};

export const getGlobalRefreshFunction = (): (() => void) | undefined => {
  console.log('🌍 Global: Getting refresh function, type:', typeof globalRefreshFunction);
  return globalRefreshFunction;
}; 