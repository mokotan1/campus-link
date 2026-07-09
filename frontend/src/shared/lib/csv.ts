/**
 * 아주 단순한 CSV 파서.
 * projects.csv / students.csv 형태의 콤마 구분 + 따옴표 escaping 을 지원한다.
 * (외부 라이브러리 없이 더미데이터 변환용으로만 사용)
 */
export function parseCsv(raw: string): Record<string, string>[] {
  const withoutBom = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const rows = splitCsvRows(withoutBom.trim());
  if (rows.length === 0) return [];

  const [header, ...body] = rows;

  return body.map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = row[index] ?? "";
    });
    return record;
  });
}

function splitCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function splitList(value: string, separators: RegExp = /[,/]/): string[] {
  return value
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean);
}
