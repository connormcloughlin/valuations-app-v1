export const logNavigation = (pageName: string) => {
  console.log(`NAVIGATION: ${pageName} screen loaded - ${new Date().toISOString()}`);
};

// Utility to reduce excessive logging
let logCount = 0;
const MAX_LOGS_PER_MINUTE = 50;

export const logOnce = (message: string, key: string = 'default') => {
  const now = Date.now();
  const logKey = `${key}_${Math.floor(now / 60000)}`; // Group by minute
  
  if (!logCount || logCount < MAX_LOGS_PER_MINUTE) {
    console.log(message);
    logCount++;
  }
  
  // Reset counter every minute
  setTimeout(() => {
    logCount = 0;
  }, 60000);
}; 