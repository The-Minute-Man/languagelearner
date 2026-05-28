// Text grading and matching utilities

export const cleanText = (str) => {
  return str
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿¡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const levenshteinDistance = (a, b) => {
  if (a === b) return 0;
  if (!a) return b.length;
  if (!b) return a.length;

  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return dp[m][n];
};

export const getAnswerVariants = (definition) => {
  const raw = String(definition || "");
  // Allow simple multi-answer definitions like: "to look / watch; see"
  return raw
    .split(/[\/;|]| or /i)
    .map((s) => cleanText(s))
    .filter(Boolean);
};

export const isSmartMatch = (userAnswerRaw, targetDefinitionRaw) => {
  const user = cleanText(userAnswerRaw);
  if (!user) return false;

  const variants = getAnswerVariants(targetDefinitionRaw);
  if (variants.length === 0) return false;

  return variants.some((target) => {
    if (!target) return false;
    if (user === target) return true;

    // Similarity by edit distance
    const dist = levenshteinDistance(user, target);
    const maxLen = Math.max(user.length, target.length);
    const similarity = maxLen === 0 ? 1 : 1 - dist / maxLen;

    // Tight threshold for short answers; slightly looser for longer
    const allowedDist =
      maxLen <= 4 ? 0 :
      maxLen <= 7 ? 1 :
      maxLen <= 11 ? 2 : 3;

    return dist <= allowedDist || similarity >= 0.86;
  });
};

// Direct Web API fetch to Google Translate (Free Public API fallback)
export const translateWithGoogle = async (text) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Google Translate request failed");
    
    const data = await res.json();
    if (data && data[0]) {
      // Maps and joins all sentences parsed from Google Cloud
      const fullTranslation = data[0].map(item => item[0]).join("").trim();
      return fullTranslation;
    }
    throw new Error("Unable to parse translation response");
  } catch (err) {
    console.error("Google Translate Error:", err);
    return null;
  }
};

// Semantic similarities grader
export const gradeTranslationSemantic = (userText, targetText) => {
  const cleanUser = cleanText(userText);
  const cleanTarget = cleanText(targetText);

  if (!cleanUser) {
    return {
      score: 1,
      what_was_right: "No input provided.",
      what_was_off: "The translation was blank. Please type in a translation.",
      suggested_translation: targetText
    };
  }

  const userWords = cleanUser.split(" ");
  const targetWords = cleanTarget.split(" ");
  
  const matched = userWords.filter(word => targetWords.includes(word));
  const uniqueMatches = [...new Set(matched)];
  const overlapRatio = uniqueMatches.length / [...new Set(targetWords)].length;

  let score = 1;
  let what_was_right = "You completed the submission.";
  let what_was_off = "The words and translation structure did not match the reference translation.";

  if (cleanUser === cleanTarget) {
    score = 5;
    what_was_right = "Excellent! Your translation is identical to the target translation.";
    what_was_off = "No errors detected.";
  } else if (overlapRatio >= 0.8) {
    score = 5;
    what_was_right = "Superb! Excellent vocabulary selection, and the phrasing is highly natural.";
    what_was_off = "Minor stylistic differences, but the meaning is fully correct.";
  } else if (overlapRatio >= 0.55) {
    score = 4;
    what_was_right = "Great translation! You translated key concepts correctly: " + uniqueMatches.join(", ");
    what_was_off = "A few prepositions or words could be adjusted to sound more natural.";
  } else if (overlapRatio >= 0.3) {
    score = 3;
    what_was_right = "Decent attempt. You captured some correct words: " + uniqueMatches.join(", ");
    what_was_off = "Several crucial parts of the sentence meaning were omitted.";
  } else if (overlapRatio > 0.05) {
    score = 2;
    what_was_right = "You matched some words: " + uniqueMatches.join(", ");
    what_was_off = "The translation meaning deviates significantly from the original.";
  } else {
    score = 1;
    what_was_right = "You started translating, which is a great exercise.";
    what_was_off = "None of the words match the target translation. Try adjusting vocabulary choices.";
  }

  return {
    score,
    what_was_right,
    what_was_off,
    suggested_translation: targetText
  };
};
