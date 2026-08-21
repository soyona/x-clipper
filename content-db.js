(function registerContentDatabase() {
  const DATABASE_NAME = "x-clipper-content";
  const DATABASE_VERSION = 1;
  const MIGRATION_KEY = "legacy-v1-imported";

  function requestResult(request) {
    return new Promise((resolve, reject) => {
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error || new Error("本地数据库操作失败。")), { once: true });
    });
  }

  function transactionDone(transaction) {
    return new Promise((resolve, reject) => {
      transaction.addEventListener("complete", () => resolve(), { once: true });
      transaction.addEventListener("abort", () => reject(transaction.error || new Error("本地数据库事务已取消。")), { once: true });
      transaction.addEventListener("error", () => reject(transaction.error || new Error("本地数据库事务失败。")), { once: true });
    });
  }

  function ensureIndex(store, name, keyPath, options = {}) {
    if (!store.indexNames.contains(name)) store.createIndex(name, keyPath, options);
  }

  function upgradeDatabase(database) {
    const items = database.objectStoreNames.contains("items")
      ? null
      : database.createObjectStore("items", { keyPath: "id" });
    if (items) {
      ensureIndex(items, "sourceUrl", "sourceUrl", { unique: true });
      ensureIndex(items, "readState", "readState");
      ensureIndex(items, "materialState", "materialState");
      ensureIndex(items, "capturedAt", "capturedAt");
    }
    if (!database.objectStoreNames.contains("authors")) database.createObjectStore("authors", { keyPath: "handle" });
    if (!database.objectStoreNames.contains("images")) database.createObjectStore("images", { keyPath: "id" });
    if (!database.objectStoreNames.contains("meta")) database.createObjectStore("meta", { keyPath: "key" });
  }

  function openDatabase() {
    if (!globalThis.indexedDB) return Promise.reject(new Error("当前浏览器不支持本地内容数据库。"));
    return new Promise((resolve, reject) => {
      const request = globalThis.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.addEventListener("upgradeneeded", () => upgradeDatabase(request.result), { once: true });
      request.addEventListener("success", () => resolve(request.result), { once: true });
      request.addEventListener("error", () => reject(request.error || new Error("无法打开本地内容数据库。")), { once: true });
      request.addEventListener("blocked", () => reject(new Error("本地内容数据库升级被其他扩展页面阻止。")), { once: true });
    });
  }

  async function readState() {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["items", "authors"], "readonly");
      const itemsRequest = transaction.objectStore("items").getAll();
      const authorsRequest = transaction.objectStore("authors").getAll();
      const [items, authors] = await Promise.all([requestResult(itemsRequest), requestResult(authorsRequest)]);
      await transactionDone(transaction);
      return globalThis.XClipperContentStore.currentState({ schemaVersion: 2, items, authors });
    } finally {
      database.close();
    }
  }

  async function readBackupData() {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["items", "authors", "images"], "readonly");
      const requests = ["items", "authors", "images"].map((name) => requestResult(transaction.objectStore(name).getAll()));
      const [items, authors, images] = await Promise.all(requests);
      await transactionDone(transaction);
      return { schemaVersion: 2, items, authors, images };
    } finally {
      database.close();
    }
  }

  async function mergeBackupData(backupValue) {
    const backup = globalThis.XClipperContentStore.currentState(backupValue);
    if (backupValue?.schemaVersion !== 2 || !Array.isArray(backupValue?.images)) throw new Error("备份文件格式无效。" );
    const images = backupValue.images.filter((image) => image?.id && image?.blob instanceof Blob);
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["items", "authors", "images"], "readwrite");
      const itemStore = transaction.objectStore("items");
      const authorStore = transaction.objectStore("authors");
      const imageStore = transaction.objectStore("images");
      const [currentItems, currentAuthors, currentImages] = await Promise.all([
        requestResult(itemStore.getAll()),
        requestResult(authorStore.getAll()),
        requestResult(imageStore.getAll()),
      ]);
      const itemIds = new Set(currentItems.map((item) => item.id));
      const authorHandles = new Set(currentAuthors.map((author) => author.handle));
      const imageIds = new Set(currentImages.map((image) => image.id));
      const added = { items: 0, authors: 0, images: 0 };
      for (const item of backup.items) if (!itemIds.has(item.id)) { itemStore.add(item); added.items += 1; }
      for (const author of backup.authors) if (!authorHandles.has(author.handle)) { authorStore.add(author); added.authors += 1; }
      for (const image of images) if (!imageIds.has(image.id)) { imageStore.add(image); added.images += 1; }
      await transactionDone(transaction);
      return added;
    } finally {
      database.close();
    }
  }

  async function getItem(itemId) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("items", "readonly");
      const item = await requestResult(transaction.objectStore("items").get(String(itemId || "")));
      await transactionDone(transaction);
      return item ? globalThis.XClipperContentStore.currentState({ schemaVersion: 2, items: [item], authors: [] }).items[0] : null;
    } finally {
      database.close();
    }
  }

  async function getItemBySourceUrl(sourceUrlValue) {
    const sourceUrl = globalThis.XClipperContentStore.normalizedSourceUrl(sourceUrlValue);
    const database = await openDatabase();
    try {
      const transaction = database.transaction("items", "readonly");
      const item = await requestResult(transaction.objectStore("items").index("sourceUrl").get(sourceUrl));
      await transactionDone(transaction);
      return item || null;
    } finally {
      database.close();
    }
  }

  async function migrateLegacyInbox(legacyValue) {
    const migrated = globalThis.XClipperContentStore.migrateLegacyInbox(legacyValue);
    const database = await openDatabase();
    try {
      const markerTransaction = database.transaction("meta", "readonly");
      const existingMarker = await requestResult(markerTransaction.objectStore("meta").get(MIGRATION_KEY));
      await transactionDone(markerTransaction);
      if (existingMarker) {
        database.close();
        return { migrated: false, state: await readState() };
      }
      const transaction = database.transaction(["items", "authors", "meta"], "readwrite");
      const items = transaction.objectStore("items");
      const authors = transaction.objectStore("authors");
      const meta = transaction.objectStore("meta");
      for (const item of migrated.items) items.put(item);
      for (const author of migrated.authors) authors.put(author);
      meta.put({ key: MIGRATION_KEY, schemaVersion: 2, importedAt: new Date().toISOString() });
      await transactionDone(transaction);
      return { migrated: true, state: migrated };
    } finally {
      database.close();
    }
  }

  async function addCapturedItem(captureValue, { id, now, images = [] } = {}) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["items", "images"], "readwrite");
      const store = transaction.objectStore("items");
      const sourceUrl = globalThis.XClipperContentStore.normalizedSourceUrl(captureValue?.sourceUrl);
      const existing = await requestResult(store.index("sourceUrl").get(sourceUrl));
      if (existing) {
        await transactionDone(transaction);
        return { item: existing, existing: true };
      }
      const result = globalThis.XClipperContentStore.addCapturedItem(
        globalThis.XClipperContentStore.emptyState(),
        captureValue,
        { id, now },
      );
      store.add(result.item);
      const imageStore = transaction.objectStore("images");
      for (const image of images) if (image?.id && image?.blob) imageStore.put({ ...image });
      await transactionDone(transaction);
      return { item: result.item, existing: false };
    } finally {
      database.close();
    }
  }

  async function completeCapturedItem(itemId, captureValue, { now, images = [] } = {}) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(["items", "images"], "readwrite");
      const itemStore = transaction.objectStore("items");
      const existing = await requestResult(itemStore.get(String(itemId || "")));
      if (!existing) throw new Error("内容不存在或已被删除。");
      const result = globalThis.XClipperContentStore.completeCapturedItem(
        { schemaVersion: 2, items: [existing], authors: [] },
        existing.id,
        captureValue,
        { now },
      );
      if (result.completed) {
        itemStore.put(result.item);
        const imageStore = transaction.objectStore("images");
        for (const image of images) if (image?.id && image?.blob) imageStore.put({ ...image });
      }
      await transactionDone(transaction);
      return { item: result.item, completed: result.completed };
    } finally {
      database.close();
    }
  }

  async function updateItemState(itemId, patchValue, { now } = {}) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("items", "readwrite");
      const store = transaction.objectStore("items");
      const existing = await requestResult(store.get(itemId));
      if (!existing) throw new Error("内容不存在或已被删除。");
      const result = globalThis.XClipperContentStore.updateItemState(
        { schemaVersion: 2, items: [existing], authors: [] },
        itemId,
        patchValue,
        { now },
      );
      store.put(result.item);
      await transactionDone(transaction);
      return result.item;
    } finally {
      database.close();
    }
  }

  async function removeItem(itemId) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("items", "readwrite");
      const store = transaction.objectStore("items");
      const existing = await requestResult(store.get(String(itemId || "")));
      if (existing) store.delete(existing.id);
      await transactionDone(transaction);
      return { removed: Boolean(existing), item: existing || null };
    } finally {
      database.close();
    }
  }

  async function saveAuthor(author, { now } = {}) {
    const handle = String(author?.handle || author?.authorHandle || "").replace(/^@/u, "");
    if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) throw new Error("无法识别作者。");
    const database = await openDatabase();
    try {
      const transaction = database.transaction("authors", "readwrite");
      const store = transaction.objectStore("authors");
      const key = handle.toLowerCase();
      const existing = await requestResult(store.get(key));
      const item = {
        ...existing,
        handle: key,
        displayName: author.displayName || author.authorName || existing?.displayName || handle,
        authorAvatarUrl: author.authorAvatarUrl || existing?.authorAvatarUrl || "",
        authorVerificationType: author.authorVerificationType || existing?.authorVerificationType || "",
        description: author.description || existing?.description || "",
        addedAt: existing?.addedAt || now || null,
      };
      store.put(item);
      await transactionDone(transaction);
      return { author: item, existing: Boolean(existing) };
    } finally {
      database.close();
    }
  }

  async function removeAuthor(handleValue) {
    const handle = String(handleValue || "").replace(/^@/u, "").toLowerCase();
    const database = await openDatabase();
    try {
      const transaction = database.transaction("authors", "readwrite");
      const store = transaction.objectStore("authors");
      const existing = await requestResult(store.get(handle));
      if (existing) store.delete(handle);
      await transactionDone(transaction);
      return { removed: Boolean(existing) };
    } finally {
      database.close();
    }
  }

  async function saveImage(image) {
    if (!image?.id || !image?.blob) throw new Error("图片数据无效。");
    const database = await openDatabase();
    try {
      const transaction = database.transaction("images", "readwrite");
      const store = transaction.objectStore("images");
      const existing = await requestResult(store.get(image.id));
      if (!existing) store.add({ ...image });
      await transactionDone(transaction);
      return { id: image.id, existing: Boolean(existing) };
    } finally {
      database.close();
    }
  }

  async function readImage(imageId) {
    const database = await openDatabase();
    try {
      const transaction = database.transaction("images", "readonly");
      const image = await requestResult(transaction.objectStore("images").get(String(imageId || "")));
      await transactionDone(transaction);
      return image || null;
    } finally {
      database.close();
    }
  }

  globalThis.XClipperContentDatabase = {
    DATABASE_NAME,
    DATABASE_VERSION,
    MIGRATION_KEY,
    addCapturedItem,
    completeCapturedItem,
    getItem,
    getItemBySourceUrl,
    migrateLegacyInbox,
    mergeBackupData,
    openDatabase,
    readState,
    readImage,
    readBackupData,
    removeAuthor,
    removeItem,
    saveAuthor,
    saveImage,
    updateItemState,
    upgradeDatabase,
  };
}());
