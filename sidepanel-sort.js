(function registerSidePanelSort() {
  const SORT_KEYS = new Set(["added", "published"]);
  const COLLECTIONS = new Set(["reading", "material"]);

  function timestamp(value) {
    const result = Date.parse(value || "");
    return Number.isFinite(result) ? result : null;
  }

  function addedTimestamp(item, collection) {
    const specific = collection === "material" ? item?.materialAddedAt : item?.readingAddedAt;
    return timestamp(specific) ?? timestamp(item?.capturedAt) ?? timestamp(item?.createdAt);
  }

  function compareNullableDescending(left, right) {
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    return right - left;
  }

  function sortItems(values, { collection = "reading", sortBy = "added" } = {}) {
    const normalizedCollection = COLLECTIONS.has(collection) ? collection : "reading";
    const normalizedSort = SORT_KEYS.has(sortBy) ? sortBy : "added";
    return [...(Array.isArray(values) ? values : [])].sort((left, right) => {
      const primary = normalizedSort === "published"
        ? compareNullableDescending(timestamp(left?.publishedAt), timestamp(right?.publishedAt))
        : compareNullableDescending(addedTimestamp(left, normalizedCollection), addedTimestamp(right, normalizedCollection));
      if (primary) return primary;
      const added = compareNullableDescending(addedTimestamp(left, normalizedCollection), addedTimestamp(right, normalizedCollection));
      if (added) return added;
      return String(left?.id || "").localeCompare(String(right?.id || ""));
    });
  }

  globalThis.XClipperSidePanelSort = { addedTimestamp, sortItems };
}());
