const STORE_KEY = 'ledger_json_db_v1';

function readStore() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return { version: 1, months: {} };

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { version: 1, months: {} };
    if (!parsed.months || typeof parsed.months !== 'object') {
      return { version: 1, months: {} };
    }

    return parsed;
  } catch {
    return { version: 1, months: {} };
  }
}

function writeStore(store) {
  localStorage.setItem(STORE_KEY, JSON.stringify(store));
}

function ensureMonthTransactions(store, monthKey) {
  if (!Array.isArray(store.months[monthKey])) {
    store.months[monthKey] = [];
  }
  return store.months[monthKey];
}

export function getMonthlyTransactions(monthKey) {
  const store = readStore();
  const monthTransactions = store.months[monthKey];
  if (!Array.isArray(monthTransactions)) return null;
  return monthTransactions;
}

export function saveMonthlyTransactions(monthKey, transactions) {
  const store = readStore();
  store.months[monthKey] = Array.isArray(transactions) ? transactions : [];
  writeStore(store);
}

export function createTransaction(monthKey, transaction) {
  const store = readStore();
  const monthTransactions = ensureMonthTransactions(store, monthKey);
  monthTransactions.push(transaction);
  writeStore(store);
  return transaction;
}

export function updateTransaction(monthKey, transaction) {
  const store = readStore();
  const monthTransactions = ensureMonthTransactions(store, monthKey);

  store.months[monthKey] = monthTransactions.map((item) =>
    item.id === transaction.id ? transaction : item
  );

  writeStore(store);
  return transaction;
}

export function deleteTransaction(monthKey, transactionId) {
  const store = readStore();
  const monthTransactions = ensureMonthTransactions(store, monthKey);

  store.months[monthKey] = monthTransactions.filter((item) => item.id !== transactionId);
  writeStore(store);
}
