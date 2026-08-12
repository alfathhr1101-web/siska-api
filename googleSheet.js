import { google } from 'googleapis';
import fs from 'fs';

const credentials = JSON.parse(
  fs.readFileSync('./google-service.json', 'utf8')
);

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

const sheets = google.sheets({
  version: 'v4',
  auth
});

const SPREADSHEET_ID =
  '1fZLzW-SEZ2LWmqIIfKr7LSxRbJLMoo8C8VJGJKSuhj8';

// =========================
// Cari baris kosong pertama mulai B7
// =========================
async function getNextRow(sheetName){
    sheetName = typeof sheetName === 'object'
  ? sheetName.name
  : sheetName;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!B7:B1000`
  });

  const rows = res.data.values || [];

  // mulai dari baris 7
  let row = 7;

  for(const r of rows){

    // kalau sel kosong -> pakai baris ini
    if(!r[0] || r[0].toString().trim() === ''){
      return row;
    }

    row++;
  }

  // kalau semua terisi -> tambah di bawahnya
  return row;
}

// =========================
// Ambil nama rekening dari bank tujuan
// contoh:
// DANA - xxxxx8406 - Muhamad Zenal Ihwan
// hasil:
// Muhamad Zenal Ihwan
// =========================
function extractNama(bankTujuan){

  if(!bankTujuan) return '';

  const parts = bankTujuan.split('-');

  if(parts.length >= 3){
    return parts.slice(2).join('-').trim();
  }

  return bankTujuan.trim();
}

// =========================
// Tulis transaksi ke sheet
// =========================
export async function appendToSheet(sheetName, item){
    sheetName = typeof sheetName === 'object'
  ? sheetName.name
  : sheetName;

  const row = await getNextRow(sheetName);

  const nama = item.atasNama || extractNama(item.bankTujuan);

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [

        // B = NAMA
        {
          range: `${sheetName}!B${row}`,
          values: [[ nama ]]
        },

        // C = KELUAR
        {
          range: `${sheetName}!C${row}`,
          values: [[ item.nominal ]]
        },

        // F = USER
        {
          range: `${sheetName}!F${row}`,
          values: [[ item.userId ]]
        }

      ]
    }
  });

  console.log(
    `Transaksi masuk ke ${sheetName} baris ${row}`
  );
}