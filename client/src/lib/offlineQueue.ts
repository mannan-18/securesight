export type OfflineQueueItem = { id: string; type: string; createdAt: string; status: "queued" | "syncing" | "synced" | "failed"; payload?: unknown; error?: string };

const DB_NAME = "securesight-field";
const STORE = "outbox";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function listOfflineQueue(): Promise<OfflineQueueItem[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve((request.result as OfflineQueueItem[]).sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueOffline(item: Omit<OfflineQueueItem, "id" | "status">): Promise<OfflineQueueItem> {
  const value: OfflineQueueItem = { ...item, id: crypto.randomUUID(), status: "queued" };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(value); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  return value;
}

export async function updateOffline(id: string, patch: Partial<OfflineQueueItem>) {
  const db = await openDb();
  const current = await new Promise<OfflineQueueItem>((resolve, reject) => { const request = db.transaction(STORE, "readonly").objectStore(STORE).get(id); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const value = { ...current, ...patch };
  await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(value); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
}

export async function syncOfflineQueue(sync: (item: OfflineQueueItem) => Promise<void>) {
  for (const item of await listOfflineQueue()) {
    if (item.status === "synced") continue;
    await updateOffline(item.id, { status: "syncing" });
    try { await sync(item); await updateOffline(item.id, { status: "synced", error: undefined }); }
    catch (error) { await updateOffline(item.id, { status: "failed", error: error instanceof Error ? error.message : "Sync failed" }); }
  }
}
