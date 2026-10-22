// Serialize JSON documents without constructing one string for the entire export.
// Registry snapshots can exceed V8's maximum individual string length.
export function writeJsonDocument(value, write, chunkSize = 65536) {
  if (!Number.isSafeInteger(chunkSize) || chunkSize < 2) {
    throw new RangeError("JSON output chunk size must be an integer >= 2");
  }
  let pending = "";
  const ancestors = new Set();
  function emit(text) {
    for (let offset = 0; offset < text.length;) {
      const length = Math.min(chunkSize - pending.length, text.length - offset);
      pending += text.slice(offset, offset + length);
      offset += length;
      if (pending.length === chunkSize) {
        // Never split a UTF-16 surrogate pair across UTF-8 sink writes.
        const tail = pending.charCodeAt(pending.length - 1);
        if (tail >= 0xd800 && tail <= 0xdbff) {
          write(pending.slice(0, -1));
          pending = pending.slice(-1);
        } else {
          write(pending);
          pending = "";
        }
      }
    }
  }
  function string(text) {
    emit('"');
    for (let offset = 0; offset < text.length;) {
      let end = Math.min(offset + chunkSize, text.length);
      const last = text.charCodeAt(end - 1);
      if (end < text.length && last >= 0xd800 && last <= 0xdbff) end -= 1;
      emit(JSON.stringify(text.slice(offset, end)).slice(1, -1));
      offset = end;
    }
    emit('"');
  }
  function visit(item, depth) {
    if (typeof item === "string") return string(item);
    if (item === null || typeof item === "boolean" || typeof item === "number") {
      return emit(JSON.stringify(item));
    }
    if (typeof item !== "object") {
      throw new TypeError(`Unsupported JSON export value: ${typeof item}`);
    }
    if (ancestors.has(item)) throw new TypeError("Circular JSON export value");
    ancestors.add(item);
    const array = Array.isArray(item);
    const entries = array ? item.map((value, index) => [index, value]) : Object.entries(item);
    emit(array ? "[" : "{");
    for (let index = 0; index < entries.length; index += 1) {
      const [key, child] = entries[index];
      emit(`${index ? "," : ""}\n${"  ".repeat(depth + 1)}`);
      if (!array) {
        string(key);
        emit(": ");
      }
      visit(child, depth + 1);
    }
    if (entries.length) emit(`\n${"  ".repeat(depth)}`);
    emit(array ? "]" : "}");
    ancestors.delete(item);
  }
  visit(value, 0);
  emit("\n");
  if (pending) write(pending);
}
