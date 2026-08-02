function escapeCsvCell(value: string | number): string {
    const str = String(value ?? "");
    if (/["\n\r,]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/** Builds a CSV file from headers + rows and triggers a browser download.
 *  Prefixes a UTF-8 BOM so Excel renders non-ASCII text (e.g. Urdu) correctly. */
export function downloadCsv(
    filename: string,
    headers: string[],
    rows: (string | number)[][],
): void {
    const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
    const BOM = String.fromCharCode(0xfeff);
    const csvContent = BOM + lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
