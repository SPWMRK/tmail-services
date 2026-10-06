// localStorage can be missing or throw (SSR, private mode, blocked storage).
// Everything stored here is a convenience; the app works without it.

export function loadString(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveString(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Not persisted.
  }
}

export function loadStringList(key: string): string[] {
  try {
    const value: unknown = JSON.parse(loadString(key) ?? "[]");
    return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function saveStringList(key: string, list: string[]) {
  saveString(key, JSON.stringify(list));
}
