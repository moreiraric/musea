// Shared search helpers for query cleanup, fuzzy matching, and result scoring.
// Routes use these helpers to keep search behavior consistent across endpoints.

// === NORMALIZATION HELPERS ===

// Normalizes casing and whitespace so searches compare against a stable shape.
export function normalizeQuery(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

// Removes punctuation that would add noise to token matching.
function sanitizeToken(value: string) {
  return value
    .replace(/[^a-z0-9\s]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Splits user input into clean words for exact and fuzzy comparisons.
function getNormalizedWords(value: string) {
  const normalized = normalizeQuery(sanitizeToken(value));
  if (!normalized) {
    return [];
  }

  return normalized.split(" ").filter(Boolean);
}

// Calculates edit distance so near-matches like typos still score.
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

// Keeps fuzzy matching strict for short words and looser for longer ones.
function getAllowedDistance(word: string) {
  if (word.length <= 3) {
    return 0;
  }
  if (word.length <= 7) {
    return 1;
  }
  return 2;
}

// Finds the closest matching word in the candidate text.
function findBestWordDistance(queryWord: string, textWords: string[]) {
  let bestDistance = Number.POSITIVE_INFINITY;

  textWords.forEach((textWord) => {
    // Skip obviously distant words to avoid unnecessary edit-distance work.
    if (Math.abs(queryWord.length - textWord.length) > 2) {
      return;
    }

    bestDistance = Math.min(bestDistance, levenshteinDistance(queryWord, textWord));
  });

  return bestDistance;
}

// === TOKEN BUILDERS ===

// Builds a compact set of tokens for ilike filters and lightweight matching.
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
      // Short prefixes help catch partial matches while keeping the token list small.
      tokens.add(cleaned.slice(0, 3));
    }
  });

  return Array.from(tokens).filter(Boolean).slice(0, 12);
}

// Builds de-duplicated search words for exact and fuzzy checks.
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

// Converts search tokens into a comma-separated Supabase OR filter.
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

// Scores how closely a piece of text matches the current query.
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
    // Reward titles that match all words, even if some matches were fuzzy.
    score += 30;
  }

  return score;
}

// Returns a yes or no match check for lightweight filtering paths.
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
