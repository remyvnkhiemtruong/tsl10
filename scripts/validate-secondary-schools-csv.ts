import { readFileSync } from "node:fs";
import path from "node:path";

type CsvRow = {
  name: string;
  old_address: string;
  new_address: string;
};

const files = [
  "data/import/danh_sach_thcs_ca_mau_moi_ten_truong_dia_chi_cu_moi_seed.csv",
  "data/import/danh_sach_thcs_ca_mau_moi_dia_chi_moi_hoan_chinh.csv",
] as const;

const expectedHeader = ["name", "old_address", "new_address"];
const forbiddenNewAddressPatterns = [
  /Khu vực/i,
  /Chưa rõ/i,
  /\//,
  /\?/,
  /có thể/i,
  /\bhoặc\b/i,
  /Bạc Liêu cũ/i,
  /Cà Mau cũ/i,
];

function parseLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values.map((value) => value.trim());
}

function parseCsv(filePath: string) {
  const raw = readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const header = parseLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const [name, old_address, new_address] = values;
    return { name, old_address, new_address, columnCount: values.length };
  });
  return { header, rows };
}

function countNewUnits(value: string) {
  return (value.match(/\b(?:Xã|Phường)\s+/g) ?? []).length;
}

function validateFile(relativePath: string) {
  const filePath = path.resolve(process.cwd(), relativePath);
  const { header, rows } = parseCsv(filePath);
  const errors: string[] = [];

  if (header.length !== expectedHeader.length || header.some((item, index) => item !== expectedHeader[index])) {
    errors.push(`Header phải đúng: ${expectedHeader.join(",")}`);
  }

  const seen = new Set<string>();
  const names = new Map<string, CsvRow[]>();

  rows.forEach((row, index) => {
    const lineNumber = index + 2;
    if (!row.name || !row.old_address || !row.new_address) {
      errors.push(`Dòng ${lineNumber}: thiếu name, old_address hoặc new_address`);
    }

    if (row.columnCount !== 3) {
      errors.push(`Dòng ${lineNumber}: CSV phải có đúng 03 cột`);
    }

    for (const pattern of forbiddenNewAddressPatterns) {
      if (pattern.test(row.new_address)) {
        errors.push(`Dòng ${lineNumber}: new_address chứa giá trị không hợp lệ: ${row.new_address}`);
        break;
      }
    }

    if (!row.new_address.endsWith("tỉnh Cà Mau")) {
      errors.push(`Dòng ${lineNumber}: new_address phải kết thúc bằng "tỉnh Cà Mau"`);
    }

    if (countNewUnits(row.new_address) > 1) {
      errors.push(`Dòng ${lineNumber}: new_address có nhiều xã/phường trong cùng một ô`);
    }

    const duplicateKey = `${row.name}\u0000${row.old_address}\u0000${row.new_address}`;
    if (seen.has(duplicateKey)) {
      errors.push(`Dòng ${lineNumber}: trùng tuyệt đối name + old_address + new_address`);
    }
    seen.add(duplicateKey);

    const byName = names.get(row.name) ?? [];
    byName.push(row);
    names.set(row.name, byName);
  });

  for (const [name, sameNameRows] of names.entries()) {
    if (sameNameRows.length < 2) continue;
    const oldAddresses = new Set(sameNameRows.map((row) => row.old_address));
    if (oldAddresses.size !== sameNameRows.length || sameNameRows.some((row) => row.old_address.length < 8)) {
      errors.push(`Trường trùng tên "${name}" cần old_address đủ phân biệt`);
    }
  }

  return { rows, errors };
}

let hasErrors = false;

for (const file of files) {
  const { rows, errors } = validateFile(file);
  if (errors.length > 0) {
    hasErrors = true;
    console.error(`\n${file}`);
    for (const error of errors) console.error(`- ${error}`);
  } else {
    console.log(`${file}: OK (${rows.length} dòng)`);
  }
}

if (hasErrors) process.exit(1);
