const TASKS_STORAGE_KEY = 'flo.tasks.v1';
const CONTACTS_STORAGE_KEY = 'flo.contacts.v1';

let storageNotice = '';

function pushStorageNotice(message) {
  if (!message) {
    return;
  }

  storageNotice = storageNotice ? `${storageNotice} ${message}` : message;
}

function getBrowserStorage() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

function parseStoredArray(rawValue) {
  if (rawValue === null) {
    return { value: [], invalid: false };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return { value: parsed, invalid: false };
    }
  } catch (error) {
    // Invalid JSON is handled by the fallback below.
  }

  return { value: [], invalid: true };
}

function readArray(storage, key, label) {
  const rawValue = storage.getItem(key);
  const parsed = parseStoredArray(rawValue);

  if (!parsed.invalid) {
    return parsed.value;
  }

  try {
    storage.setItem(key, '[]');
  } catch (error) {
    // Ignore reset failures and continue with in-memory fallback.
  }

  pushStorageNotice(`Stored ${label} data was invalid and has been reset locally.`);
  return [];
}

function saveArray(storage, key, nextValue) {
  if (!Array.isArray(nextValue)) {
    throw new Error('Local data payload must be an array.');
  }

  try {
    storage.setItem(key, JSON.stringify(nextValue));
  } catch (error) {
    throw new Error(
      'Could not save data locally. Check browser storage settings or available space.'
    );
  }
}

export async function loadAll() {
  const storage = getBrowserStorage();

  if (!storage) {
    pushStorageNotice('Local storage is unavailable. Data will not persist in this browser mode.');
    return {
      tasks: [],
      contacts: [],
    };
  }

  return {
    tasks: readArray(storage, TASKS_STORAGE_KEY, 'tasks'),
    contacts: readArray(storage, CONTACTS_STORAGE_KEY, 'contacts'),
  };
}

export async function saveTasks(nextTasks) {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error('Could not save tasks locally. Local storage is unavailable.');
  }

  saveArray(storage, TASKS_STORAGE_KEY, nextTasks);
}

export async function saveContacts(nextContacts) {
  const storage = getBrowserStorage();
  if (!storage) {
    throw new Error('Could not save contacts locally. Local storage is unavailable.');
  }

  saveArray(storage, CONTACTS_STORAGE_KEY, nextContacts);
}

export function consumeStorageNotice() {
  const currentNotice = storageNotice;
  storageNotice = '';
  return currentNotice;
}

export { CONTACTS_STORAGE_KEY, TASKS_STORAGE_KEY };
