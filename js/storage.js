const KEYS = {
  favorites: 'nightcap:v2:favorites',
  recent: 'nightcap:v2:recent',
  preferences: 'nightcap:v2:preferences',
};

export function loadFavorites() {
  return new Set(readArray(KEYS.favorites));
}

export function saveFavorites(set) {
  write(KEYS.favorites, [...set]);
}

export function loadRecent() {
  return readArray(KEYS.recent).slice(0, 24);
}

export function pushRecent(list, id) {
  const next = [id, ...list.filter((item) => item !== id)].slice(0, 24);
  write(KEYS.recent, next);
  return next;
}

export function loadPreferences() {
  const raw = read(KEYS.preferences, {});
  return {
    sort: raw.sort || 'name',
    density: raw.density === 'compact' ? 'compact' : 'comfortable',
  };
}

export function savePreferences(preferences) {
  write(KEYS.preferences, preferences);
}

function readArray(key) {
  const value = read(key, []);
  return Array.isArray(value) ? value : [];
}

function read(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage is an enhancement; the library remains usable without it.
  }
}
