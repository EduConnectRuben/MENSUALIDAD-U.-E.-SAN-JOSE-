// Simple wrapper around IndexedDB for offline queueing

const DB_NAME = 'MensualidadDB';
const STORE_NAME = 'syncQueue';

let db;

const request = indexedDB.open(DB_NAME, 1);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { autoIncrement: true });
    }
};

request.onsuccess = (e) => {
    db = e.target.result;
    
    // Attempt to sync when DB opens (usually on page load)
    if (navigator.onLine) {
        syncData();
    }
};

window.addEventListener('online', syncData);

async function saveToSyncQueue(reciboData) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.add(reciboData);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

async function syncData() {
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = async () => {
        const items = request.result;
        if (items.length === 0) return;

        try {
            const res = await fetchWithAuth('/api/sync/recibos', {
                method: 'POST',
                body: JSON.stringify(items)
            });

            if (res.ok) {
                // Clear the queue
                const clearTx = db.transaction(STORE_NAME, 'readwrite');
                clearTx.objectStore(STORE_NAME).clear();
                console.log(`Synchronized ${items.length} offline receipts.`);
                alert(`Sincronización Completada: Se subieron ${items.length} recibos guardados offline.`);
            }
        } catch (error) {
            console.error("Failed to sync offline data", error);
        }
    };
}
