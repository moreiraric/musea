export function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sanitizeToken(value: string) {
  return value
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getNormalizedWords(value: string) {
  const normalized = normalizeQuery(sanitizeToken(value));
  if (!normalized) {
    return [];
  }

  return normalized.split(" ").filter(Boolean);
}

function levenshteinDistance(a: string, b: string) {
  if (a === b) {
    return 0;
  }

  if (!a.length) {
    return b.length;
  }

  if (!b.length) {
    return a.length;
  }

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    let diagonal = previous[0];
    previous[0] = row;

    for (let column = 1; column <= b.length; column += 1) {
      const nextDiagonal = previous[column];
      const substitutionCost = a[row - 1] === b[column - 1] ? 0 : 1;
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + substitutionCost,
      );
      diagonal = nextDiagonal;
    }
  }

  return previous[b.length];
}

function getAllowedDistance(word: string) {
  if (word.length <= 3) {
    return 0;
  }
  if (word.length <= 7) {
    return 1;
  }
  return 2;
}

function findBestWordDistance(queryWord: string, textWords: string[]) {
  let bestDistance = Number.POSITIVE_INFINITY;

  textWords.forEach((textWord) => {
    if (Math.abs(queryWord.length - textWord.length) > 2) {
      return;
    }

    bestDistance = Math.min(bestDistance, levenshteinDistance(queryWord, textWord));
  });

  return bestDistance;
}

export function buildSearchTokens(query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }
  const rawTokens = normalized.split(" ").filter(Boolean);
  const tokens = new Set<string>();

  tokens.add(normalized);

  rawTokens.forEach((token) => {
    const cleaned = sanitizeToken(token);
    if (!cleaned) {
      return;
    }
    tokens.add(cleaned);
    if (cleaned.length >= 4) {
      tokens.add(cleaned.slice(0, 4));
    }
    if (cleaned.length >= 3) {
      tokens.add(cleaned.slice(0, 3));
    }
  });

  return Array.from(tokens).filter(Boolean).slice(0, 12);
}

export function buildSearchWords(query: string) {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return [];
  }

  return Array.from(
    new Set(
      normalized
        .split(" ")
        .map((token) => sanitizeToken(token))
        .filter(Boolean),
    ),
  );
}

export function buildSearchFilter(tokens: string[], fields: string[]) {
  if (tokens.length === 0 || fields.length === 0) {
    return "";
  }
  const clauses: string[] = [];
  tokens.forEach((token) => {
    const cleaned = sanitizeToken(token);
    if (!cleaned) {
      return;
    }
    fields.forEach((field) => {
      clauses.push(`${field}.ilike.%${cleaned}%`);
    });
  });
  return clauses.join(",");
}

export function scoreRelevance(text: string, query: string, tokens?: string[]) {
  if (!text) {
    return 0;
  }
  const normalizedText = normalizeQuery(text);
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return 0;
  }
  if (normalizedText === normalizedQuery) {
    return 120;
  }
  let score = 0;
  if (normalizedText.startsWith(normalizedQuery)) {
    score += 80;
  }
  if (normalizedText.includes(normalizedQuery)) {
    score += 50;
  }
  const tokenList = tokens ?? buildSearchTokens(query);
  tokenList.forEach((token) => {
    if (token && normalizedText.includes(token)) {
      score += 6;
    }
  });

  const queryWords = getNormalizedWords(query);
  const textWords = getNormalizedWords(text);
  let fuzzyWordMatches = 0;

  queryWords.forEach((word) => {
    if (textWords.includes(word)) {
      score += 12;
      return;
    }

    const bestDistance = findBestWordDistance(word, textWords);
    if (bestDistance <= getAllowedDistance(word)) {
      fuzzyWordMatches += 1;
      score += 8;
    }
  });

  if (queryWords.length > 0 && fuzzyWordMatches === queryWords.length) {
    score += 30;
  }

  return score;
}

export function matchesSearchText(text: string, query: string) {
  if (!text) {
    return false;
  }

  const normalizedText = normalizeQuery(sanitizeToken(text));
  const normalizedQuery = normalizeQuery(sanitizeToken(query));

  if (!normalizedText || !normalizedQuery) {
    return false;
  }

  if (normalizedText.includes(normalizedQuery)) {
    return true;
  }

  const words = buildSearchWords(query);
  if (words.length === 0) {
    return false;
  }

  if (words.every((word) => normalizedText.includes(word))) {
    return true;
  }

  const textWords = getNormalizedWords(text);
  return words.every((word) => {
    if (textWords.includes(word)) {
      return true;
    }

    const bestDistance = findBestWordDistance(word, textWords);
    return bestDistance <= getAllowedDistance(word);
  });
}
