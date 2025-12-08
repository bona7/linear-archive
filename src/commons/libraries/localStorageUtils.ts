export function setLocalStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") {
    console.warn("localStorage is not available in this environment.");
    return;
  }
  try {
    const serializedValue = JSON.stringify(value);
    window.localStorage.setItem(key, serializedValue);
  } catch (error) {
    console.error(`Error setting item "${key}" in localStorage:`, error);
  }
}

export function getLocalStorageItem<T>(key: string): T | null {
  if (typeof window === "undefined") {
    console.warn("localStorage is not available in this environment.");
    return null;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error(`Error getting item "${key}" from localStorage:`, error);
    return null;
  }
}
