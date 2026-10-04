export function extractFirstJsonValue(text = '') {
  if (!text || typeof text !== 'string') return null;

  const candidate = text
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  if (!candidate) return null;

  const startIndex = candidate.search(/[\[{]/);
  if (startIndex === -1) return null;

  let jsonText = candidate.slice(startIndex);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonText.length; i += 1) {
    const char = jsonText[i];

    if (char === '\\' && !escaped) {
      escaped = true;
      continue;
    }

    if (char === '"' && !escaped) {
      inString = !inString;
    }

    if (!inString) {
      if (char === '{' || char === '[') depth += 1;
      if (char === '}' || char === ']') depth -= 1;
    }

    escaped = false;

    if (depth === 0 && i > 0) {
      jsonText = jsonText.slice(0, i + 1);
      break;
    }
  }

  try {
    return JSON.parse(jsonText);
  } catch {
    const fallback = candidate.match(/\[[\s\S]*\]/);
    if (fallback) {
      try {
        return JSON.parse(fallback[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function extractFirstJsonArray(text) {
  const value = extractFirstJsonValue(text);
  return Array.isArray(value) ? value : null;
}

export function extractFirstJsonObject(text) {
  const value = extractFirstJsonValue(text);
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}
