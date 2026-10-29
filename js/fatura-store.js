// Guarda a fatura (PDF + dados extraídos) para a página de resultado ler.
// IndexedDB porque o PDF pode ter até 10 MB, mais que o sessionStorage aguenta.
const faturaStore = (() => {
  const abrir = () => new Promise((resolve, reject) => {
    const req = indexedDB.open("clareia", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("fatura");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  async function salvar(arquivo, dados) {
    const db = await abrir();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("fatura", "readwrite");
      tx.objectStore("fatura").put({ arquivo, dados }, "atual");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function ler() {
    const db = await abrir();
    return new Promise((resolve, reject) => {
      const req = db.transaction("fatura").objectStore("fatura").get("atual");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async function apagar() {
    const db = await abrir();
    return new Promise((resolve, reject) => {
      const tx = db.transaction("fatura", "readwrite");
      tx.objectStore("fatura").delete("atual");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return { salvar, ler, apagar };
})();
