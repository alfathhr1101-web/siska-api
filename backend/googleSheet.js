import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const credentials = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, 'google-service.json'),
    'utf8'
  )
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets'
  ]
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

// Spreadsheet default lama
const SPREADSHEET_ID =
  '1fZLzW-SE2LWmqIIfKr7LSxRbJLMoo8C8VJGJKSuhj8';

// =====================================
// Ambil Spreadsheet ID dari link Google
// =====================================
export function extractSpreadsheetId(input = '') {
  const value = String(input).trim();

  if (!value) {
    return '';
  }

  // Jika yang dimasukkan langsung berupa ID
  if (!value.includes('/')) {
    return value;
  }

  const match = value.match(
    /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/
  );

  return match ? match[1] : '';
}

// =====================================
// Baca seluruh spreadsheet dan semua tab
// =====================================
export async function getSpreadsheetSheets(
  spreadsheetId = SPREADSHEET_ID
) {
  const id = extractSpreadsheetId(spreadsheetId);

  if (!id) {
    throw new Error('Spreadsheet ID atau link tidak valid');
  }

  const response = await sheets.spreadsheets.get({
    spreadsheetId: id,
    fields:
      'spreadsheetId,properties(title),sheets(properties(sheetId,title,index))'
  });

  const spreadsheet = response.data;

  return {
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetName:
      spreadsheet.properties?.title || '',
    sheets: (spreadsheet.sheets || [])
      .map(sheet => ({
        sheetId: sheet.properties.sheetId,
        title: sheet.properties.title,
        index: sheet.properties.index
      }))
      .sort((a, b) => a.index - b.index)
  };
}

// =====================================
// Cari baris kosong pertama mulai B4
// =====================================
async function getNextRow(
  sheetName,
  spreadsheetId = SPREADSHEET_ID
) {
  sheetName =
    typeof sheetName === 'object'
      ? sheetName.name || sheetName.title
      : sheetName;

  const id = extractSpreadsheetId(spreadsheetId);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `'${sheetName}'!B4:B1000`
  });

  const rows = res.data.values || [];

  let row = 4;

  for (const currentRow of rows) {
    if (
      !currentRow[0] ||
      currentRow[0].toString().trim() === ''
    ) {
      return row;
    }

    row++;
  }

  return row;
}

// =====================================
// Ambil nama rekening dari bank tujuan
// Contoh:
// BCA - xxxxx7144 - PRAKITNO
// Hasil:
// PRAKITNO
// =====================================
function extractNama(bankTujuan) {
  if (!bankTujuan) {
    return '';
  }

  const parts = String(bankTujuan).split('-');

  if (parts.length >= 3) {
    return parts.slice(2).join('-').trim();
  }

  return String(bankTujuan).trim();
}

// =====================================
// NORMALISASI NAMA BANK
// =====================================
function normalizeBank(text = '') {
  const t = String(text).toUpperCase();

  if (t.includes('BCA')) return 'BCA';
  if (t.includes('BNI')) return 'BNI';
  if (t.includes('BRI')) return 'BRI';
  if (t.includes('MANDIRI')) return 'MANDIRI';
  if (t.includes('DANA')) return 'DANA';
  if (t.includes('OVO')) return 'OVO';
  if (t.includes('GOPAY')) return 'GOPAY';
  if (t.includes('LINKAJA')) return 'LINKAJA';

  return t.trim();
}

// =====================================
// HITUNG BIAYA ADMIN
// =====================================
function getAdminFee(bankAktif, bankTujuan) {
  const asal = normalizeBank(bankAktif);

  const tujuan = normalizeBank(
    String(bankTujuan || '').split('-')[0]
  );

  // Bank aktif sama dengan bank tujuan
  if (asal === tujuan) {
    return 0;
  }

  // DANA dan OVO tidak dikenakan biaya
  if (tujuan === 'DANA' || tujuan === 'OVO') {
    return 0;
  }

  // GOPAY dan LINKAJA
  if (
    tujuan === 'GOPAY' ||
    tujuan === 'LINKAJA'
  ) {
    return 1000;
  }

  // Bank berbeda lainnya
  return 2500;
}

// =====================================
// Tulis transaksi ke sheet
// =====================================
export async function appendToSheet(
  sheetName,
  item,
  bankAktif,
  spreadsheetId = SPREADSHEET_ID
) {
  console.log('RAW DATA:', {
    spreadsheetId,
    sheetName,
    bankAktif,
    bankTujuan: item.bankTujuan
  });

  sheetName =
    typeof sheetName === 'object'
      ? sheetName.name || sheetName.title
      : sheetName;

  const id = extractSpreadsheetId(spreadsheetId);

  if (!id) {
    throw new Error('Spreadsheet ID tidak valid');
  }

  if (!sheetName) {
    throw new Error('Nama sheet tujuan wajib diisi');
  }

  const row = await getNextRow(
    sheetName,
    id
  );

  const nama =
    item.atasNama ||
    extractNama(item.bankTujuan);

  const biayaAdmin = getAdminFee(
    bankAktif,
    item.bankTujuan
  );

  const data = [
    // TRANSAKSI UTAMA
    {
      range: `'${sheetName}'!B${row}`,
      values: [[nama]]
    },
    {
      range: `'${sheetName}'!C${row}`,
      values: [[item.nominal]]
    },
    {
      range: `'${sheetName}'!F${row}`,
      values: [[item.userId]]
    }
  ];

  // Kalau ada biaya admin, tambah baris di bawahnya
  if (biayaAdmin > 0) {
    data.push(
      {
        range: `'${sheetName}'!B${row + 1}`,
        values: [['BIAYA TRANSFER']]
      },
      {
        range: `'${sheetName}'!C${row + 1}`,
        values: [[biayaAdmin]]
      }
    );
  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: id,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data
    }
  });

  console.log(
    `Transaksi masuk ke ${sheetName} baris ${row} | biaya admin: ${biayaAdmin}`
  );

  return {
    success: true,
    spreadsheetId: id,
    sheetName,
    row,
    biayaAdmin
  };
}

// =====================================
// Tes koneksi Google Sheets
// =====================================
export async function testSpreadsheetConnection(
  spreadsheetId = SPREADSHEET_ID
) {
  const result = await getSpreadsheetSheets(
    spreadsheetId
  );

  return {
    success: true,
    spreadsheetId: result.spreadsheetId,
    spreadsheetName: result.spreadsheetName,
    totalSheets: result.sheets.length,
    sheets: result.sheets
  };
}