const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatInline = (value: string) => {
  let formatted = escapeHtml(value);
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

  const flushTable = () => {
    if (!tableBuffer.length) return;
    htmlParts.push(renderTable(tableBuffer));
    tableBuffer = [];
  };

  for (const line of lines) {
    const isTableRow = line.includes("|");

    if (isTableRow) {
      tableBuffer.push(line.split("|").filter(Boolean));
      continue;
    }

    flushTable();

    if (!line.trim()) {
      htmlParts.push("<p>\u00a0</p>");
      continue;
    }

    htmlParts.push(`<p>${formatInline(line)}</p>`);
  }

  flushTable();

  return { __html: htmlParts.join("") };
};
