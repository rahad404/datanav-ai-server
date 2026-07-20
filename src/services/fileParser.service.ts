import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedDataset {
   rows: Record<string, unknown>[];
   columns: string[];
   rowCount: number;
   numericSummary: Record<string, { min: number; max: number; avg: number }>;
}

export function parseBuffer(buffer: Buffer, originalName: string): ParsedDataset {
   const ext = originalName.toLowerCase().split(".").pop() || "";
   let rows: Record<string, unknown>[] = [];

   if (ext === "csv") {
      const content = buffer.toString("utf-8");
      const parsed = Papa.parse(content, { header: true, skipEmptyLines: true });
      rows = parsed.data as Record<string, unknown>[];
   } else if (ext === "xlsx" || ext === "xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet);
   } else if (ext === "json") {
      const content = buffer.toString("utf-8");
      const parsed = JSON.parse(content);
      rows = Array.isArray(parsed) ? parsed : parsed.data ?? [];
   } else {
      throw new Error(`Unsupported file extension: ${ext}`);
   }

   const columns = rows.length ? Object.keys(rows[0]) : [];
   const numericSummary: ParsedDataset["numericSummary"] = {};

   for (const col of columns) {
      const values = rows
         .map((r) => Number(r[col]))
         .filter((v) => !Number.isNaN(v));
      if (values.length > rows.length * 0.3) {
         numericSummary[col] = {
            min: values.reduce((a, b) => (a < b ? a : b)),
            max: values.reduce((a, b) => (a > b ? a : b)),
            avg: values.reduce((a, b) => a + b, 0) / values.length,
         };
      }
   }

   return { rows, columns, rowCount: rows.length, numericSummary };
}
