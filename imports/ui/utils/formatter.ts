const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatInline = (value: string) => {
  let formatted = escapeHtml(value);

  formatted = formatted.replace(/`([^`]+)`/g, "<code>$1</code>");
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  formatted = formatted.replace(/\*(.+?)\*/g, "<em>$1</em>");

  return formatted;
};

const renderTable = (rows: string[][]) => {
  if (!rows.length) return "";

  const [rawHeader, ...rawBody] = rows;
  const header = rawHeader.map((cell) => `<th>${formatInline(cell.trim())}</th>`);

  const bodyRows = rawBody
    .filter((cells) => !cells.every((cell) => /^-+$/.test(cell.trim())))
    .map(
      (cells) =>
        `<tr>${cells
          .map((cell) => `<td>${formatInline(cell.trim())}</td>`)
          .join("")}</tr>`
    )
    .join("");

  return `<table><thead><tr>${header.join("")}</tr></thead><tbody>${
    bodyRows || ""
  }</tbody></table>`;
};

export const formatChatHtml = (content: string): { __html: string } => {
  const lines = content.split(/\r?\n/);
  const htmlParts: string[] = [];
  let tableBuffer: string[][] = [];
  let codeBuffer: string[] = [];
  let listBuffer: string[] = [];
  let codeLanguage: string | null = null;
  let isInCodeBlock = false;

  const normalizeCodeLanguage = (lang: string | null) => {
    if (!lang) return "";

    const normalized = lang.trim().toLowerCase();
    if (["bash", "shell", "sh", "cmd"].includes(normalized)) {
      return "language-bash";
    }

    return normalized ? `language-${normalized}` : "";
  };

  const flushTable = () => {
    if (!tableBuffer.length) return;
    htmlParts.push(renderTable(tableBuffer));
    tableBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer.length) return;
    htmlParts.push(`<ul>${listBuffer.map((item) => `<li>${formatInline(item)}</li>`).join("")}</ul>`);
    listBuffer = [];
  };

  const flushCode = () => {
    if (!codeBuffer.length) return;
    const className = normalizeCodeLanguage(codeLanguage);
    const classAttribute = className ? ` class="${className}"` : "";
    htmlParts.push(
      `<pre><code${classAttribute}>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`
    );
    codeBuffer = [];
    codeLanguage = null;
  };

  for (const line of lines) {
    const codeFenceMatch = line.match(/^```(.*)$/);

    if (codeFenceMatch) {
      if (isInCodeBlock) {
        flushCode();
      } else {
        flushTable();
        codeLanguage = codeFenceMatch[1] || null;
      }

      isInCodeBlock = !isInCodeBlock;
      continue;
    }

    if (isInCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushTable();
      flushList();
      const level = headingMatch[1].length;
      htmlParts.push(`<h${level}>${formatInline(headingMatch[2].trim())}</h${level}>`);
      continue;
    }

    const listMatch = line.match(/^\s*-\s+(.*)$/);
    if (listMatch) {
      flushTable();
      listBuffer.push(listMatch[1]);
      continue;
    }

    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushList();
      htmlParts.push("<p>\u00a0</p>");
      continue;
    }

    const isTableRow = line.includes("|");

    if (isTableRow) {
      flushList();
      tableBuffer.push(line.split("|").filter(Boolean));
      continue;
    }

    flushTable();
    flushList();

    htmlParts.push(`<p>${formatInline(line)}</p>`);
  }

  flushList();
  flushTable();
  flushCode();

  return { __html: htmlParts.join("") };
};
