// Practice bank normalization and parsing utilities

export const makePracticeId = () => `pq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const emptyPracticeBank = () => ({ contexts: [], questions: [] });

export const emptyPracticeSetsRoot = () => ({ sets: [] });

export const normalizePracticeBank = (raw) => {
  if (!raw) return emptyPracticeBank();
  if (Array.isArray(raw)) {
    return {
      contexts: [],
      questions: raw.map((q) => ({
        id: q.id || makePracticeId(),
        type: q.type === 'context' ? 'context' : 'normal',
        prompt: q.prompt || '',
        answer: q.answer || '',
        contextRef: q.contextRef || undefined,
      })),
    };
  }
  return {
    contexts: Array.isArray(raw.contexts) ? raw.contexts : [],
    questions: Array.isArray(raw.questions) ? raw.questions : [],
  };
};

export const normalizePracticeSet = (set) => {
  const bank = normalizePracticeBank(set);
  return {
    id: set?.id || makePracticeId(),
    title: set?.title?.trim() || 'Untitled Practice',
    description: set?.description?.trim() || '',
    contexts: bank.contexts,
    questions: bank.questions,
    updatedAt: set?.updatedAt || new Date().toISOString(),
  };
};

export const normalizePracticeSetsRoot = (raw) => {
  if (!raw) return emptyPracticeSetsRoot();
  if (Array.isArray(raw)) {
    return { sets: raw.map((item) => normalizePracticeSet(item)) };
  }
  if (Array.isArray(raw.sets)) {
    return { sets: raw.sets.map((item) => normalizePracticeSet(item)) };
  }
  if (raw.contexts || raw.questions) {
    const legacy = normalizePracticeBank(raw);
    if (legacy.contexts.length === 0 && legacy.questions.length === 0) {
      return emptyPracticeSetsRoot();
    }
    return {
      sets: [
        normalizePracticeSet({
          id: makePracticeId(),
          title: 'Practice Set 1',
          description: '',
          ...legacy,
        }),
      ],
    };
  }
  return emptyPracticeSetsRoot();
};

export const parsePromptAnswerLine = (line) => {
  let prompt = '';
  let answer = '';
  if (line.includes('|')) {
    const idx = line.indexOf('|');
    prompt = line.slice(0, idx).trim();
    answer = line.slice(idx + 1).trim();
  } else if (line.includes('\t')) {
    const idx = line.indexOf('\t');
    prompt = line.slice(0, idx).trim();
    answer = line.slice(idx + 1).trim();
  } else {
    return null;
  }
  if (!prompt || !answer) return null;
  return { prompt, answer };
};

export const parsePracticeSyntax = (text) => {
  const result = emptyPracticeBank();
  const contextByRef = new Map();
  const lines = String(text || '').split('\n');
  let i = 0;

  const upsertContext = (ref, body) => {
    const trimmedBody = body.trim();
    if (!ref || !trimmedBody) return;
    const existing = contextByRef.get(ref);
    if (existing) {
      existing.body = trimmedBody;
      return;
    }
    const ctx = { id: makePracticeId(), ref, body: trimmedBody };
    contextByRef.set(ref, ctx);
    result.contexts.push(ctx);
  };

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();
    i += 1;
    if (!line || line.startsWith('#')) continue;

    const contextMatch = line.match(/^@context\s+([a-zA-Z0-9_-]+)\s*$/i);
    if (contextMatch) {
      const ref = contextMatch[1];
      const bodyLines = [];
      while (i < lines.length) {
        const nextRaw = lines[i];
        const next = nextRaw.trim();
        if (!next) {
          i += 1;
          break;
        }
        if (/^@context\s+/i.test(next) || /^@?[a-zA-Z0-9_-]+\s+Q:/i.test(next) || /^Q:/i.test(next)) {
          break;
        }
        bodyLines.push(nextRaw);
        i += 1;
      }
      upsertContext(ref, bodyLines.join('\n'));
      continue;
    }

    let contextRef = null;
    let questionLine = line;
    const contextQuestionMatch = line.match(/^@([a-zA-Z0-9_-]+)\s+(.+)$/i);
    if (contextQuestionMatch) {
      contextRef = contextQuestionMatch[1];
      questionLine = contextQuestionMatch[2].trim();
    }

    if (/^Q:/i.test(questionLine)) {
      questionLine = questionLine.replace(/^Q:\s*/i, '').trim();
    }

    const parsed = parsePromptAnswerLine(questionLine);
    if (!parsed) continue;

    result.questions.push({
      id: makePracticeId(),
      type: contextRef ? 'context' : 'normal',
      prompt: parsed.prompt,
      answer: parsed.answer,
      ...(contextRef ? { contextRef } : {}),
    });
  }

  return result;
};

export const getPracticeContextBody = (bank, contextRef) => {
  if (!contextRef) return '';
  return bank.contexts.find((c) => c.ref === contextRef)?.body || '';
};

export const mergePracticeBanks = (base, incoming) => {
  const merged = {
    contexts: [...base.contexts],
    questions: [...base.questions],
  };
  const refIndex = new Map(merged.contexts.map((c) => [c.ref, c]));
  for (const ctx of incoming.contexts) {
    const existing = refIndex.get(ctx.ref);
    if (existing) {
      existing.body = ctx.body;
    } else {
      merged.contexts.push(ctx);
      refIndex.set(ctx.ref, ctx);
    }
  }
  merged.questions.push(...incoming.questions);
  return merged;
};
