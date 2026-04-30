const CONTENT_FIELD_KEYS = [
  "message",
  "body",
  "content",
  "text",
  "note",
  "summary",
  "description",
  "subject",
  "title",
] as const;

function normalizeFragment(value: string) {
  return value.replace(/\r\n/g, "\n").trim();
}

function tryParseJson(value: string) {
  const trimmed = value.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }
}

function collectStructuredFragments(
  input: unknown,
  fragments: string[],
  seen: Set<string>,
  depth = 0,
) {
  if (depth > 4 || input == null) {
    return;
  }

  if (typeof input === "string") {
    const normalized = normalizeFragment(input);

    if (!normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    fragments.push(normalized);
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((item) => collectStructuredFragments(item, fragments, seen, depth + 1));
    return;
  }

  if (typeof input !== "object") {
    return;
  }

  const record = input as Record<string, unknown>;
  let matchedPriorityField = false;

  CONTENT_FIELD_KEYS.forEach((key) => {
    if (!(key in record)) {
      return;
    }

    matchedPriorityField = true;
    collectStructuredFragments(record[key], fragments, seen, depth + 1);
  });

  if (matchedPriorityField) {
    return;
  }

  Object.values(record).forEach((value) => {
    collectStructuredFragments(value, fragments, seen, depth + 1);
  });
}

export function getActivityContentText(content: string) {
  const normalized = normalizeFragment(content);

  if (!normalized) {
    return "";
  }

  const parsed = tryParseJson(normalized);

  if (!parsed) {
    return normalized;
  }

  const fragments: string[] = [];
  collectStructuredFragments(parsed, fragments, new Set<string>());

  return fragments.length ? fragments.join("\n\n") : normalized;
}
