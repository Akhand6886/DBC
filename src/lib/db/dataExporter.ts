/**
 * Multi-Format Data Exporter Engine & Native File Downloader
 * Supports Excel (.xlsx / .xls), CSV, JSON, Markdown (.md), and HTML table exports.
 */

export interface ExportOptions {
  format: 'excel' | 'csv' | 'json' | 'markdown' | 'html';
  delimiter?: string;
  includeHeaders?: boolean;
  filename?: string;
}

export function generateExportContent(
  columns: string[],
  rows: Record<string, any>[],
  options: ExportOptions
): { content: string; mimeType: string; extension: string } {
  const { format, delimiter = ',', includeHeaders = true } = options;

  // 1. Excel Spreadsheet (.xls XML format readable by Excel as native spreadsheet)
  if (format === 'excel') {
    const headerXml = columns.map(c => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`).join('');
    const rowsXml = rows.map(r => {
      const cells = columns.map(c => {
        const val = r[c];
        const isNum = typeof val === 'number';
        return `<Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(String(val ?? ''))}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('\n');

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Query Results">
  <Table>
   ${includeHeaders ? `<Row>${headerXml}</Row>` : ''}
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;

    return {
      content: xml,
      mimeType: 'application/vnd.ms-excel',
      extension: 'xls'
    };
  }

  // 2. CSV (.csv)
  if (format === 'csv') {
    const lines: string[] = [];
    if (includeHeaders) {
      lines.push(columns.map(c => `"${c.replace(/"/g, '""')}"`).join(delimiter));
    }
    rows.forEach(r => {
      lines.push(columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(delimiter));
    });
    return {
      content: lines.join('\n'),
      mimeType: 'text/csv;charset=utf-8;',
      extension: 'csv'
    };
  }

  // 3. JSON (.json)
  if (format === 'json') {
    return {
      content: JSON.stringify(rows, null, 2),
      mimeType: 'application/json',
      extension: 'json'
    };
  }

  // 4. Markdown Table (.md)
  if (format === 'markdown') {
    const header = `| ${columns.join(' | ')} |`;
    const separator = `| ${columns.map(() => '---').join(' | ')} |`;
    const body = rows.map(r => `| ${columns.map(c => String(r[c] ?? '')).join(' | ')} |`).join('\n');
    return {
      content: `${header}\n${separator}\n${body}`,
      mimeType: 'text/markdown',
      extension: 'md'
    };
  }

  // 5. HTML Table (.html)
  const headerHtml = columns.map(c => `<th style="border:1px solid #ddd;padding:8px;background:#f2f2f2;">${escapeXml(c)}</th>`).join('');
  const rowsHtml = rows.map(r => {
    const cells = columns.map(c => `<td style="border:1px solid #ddd;padding:8px;">${escapeXml(String(r[c] ?? ''))}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('\n');

  const html = `<!DOCTYPE html>
<html>
<head><title>Query Export</title></head>
<body style="font-family:sans-serif;padding:20px;">
<h2>SQL Query Export Results</h2>
<table style="border-collapse:collapse;width:100%;">
  ${includeHeaders ? `<thead><tr>${headerHtml}</tr></thead>` : ''}
  <tbody>${rowsHtml}</tbody>
</table>
</body>
</html>`;

  return {
    content: html,
    mimeType: 'text/html',
    extension: 'html'
  };
}

export function downloadExportFile(
  columns: string[],
  rows: Record<string, any>[],
  options: ExportOptions
): string {
  const { content, mimeType, extension } = generateExportContent(columns, rows, options);
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');

  const timestamp = new Date().toISOString().slice(0, 10);
  const defaultName = `sql_query_export_${timestamp}.${extension}`;
  a.href = url;
  a.download = options.filename || defaultName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return options.filename || defaultName;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
