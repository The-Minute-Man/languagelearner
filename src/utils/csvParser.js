// CSV/TSV parsing utilities

export const detectDelimiter = (text) => {
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
};

// Safe plain JS delimited parser (CSV or TSV) with quoted fields
export const parseCSV = (text) => {
  const delimiter = detectDelimiter(text);
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentValue = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      row.push(currentValue.trim());
      currentValue = "";
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      row.push(currentValue.trim());
      if (row.length > 0 && row.some(cell => cell !== "")) {
        lines.push(row);
      }
      row = [];
      currentValue = "";
    } else {
      currentValue += char;
    }
  }

  if (currentValue !== "" || row.length > 0) {
    row.push(currentValue.trim());
    if (row.length > 0 && row.some(cell => cell !== "")) {
      lines.push(row);
    }
  }

  if (lines.length === 0) return [];
  
  let headerOffset = 0;
  const firstRow = lines[0];
  
  if (
    firstRow[0]?.toLowerCase() === 'term' || 
    firstRow[0]?.toLowerCase() === 'spanish' ||
    firstRow[1]?.toLowerCase() === 'definition' ||
    firstRow[1]?.toLowerCase() === 'english'
  ) {
    headerOffset = 1;
  }

  const cards = [];
  for (let i = headerOffset; i < lines.length; i++) {
    const r = lines[i];
    if (r.length >= 2 && r[0] && r[1]) {
      cards.push({
        id: `csv_${Date.now()}_${i}`,
        term: r[0],
        definition: r[1]
      });
    }
  }
  return cards;
};
