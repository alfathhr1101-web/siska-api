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

// =====================================
// Cari baris kosong pertama mulai B4
// =====================================
async function getNextRow(sheetName){

  sheetName = typeof sheetName === 'object'
    ? sheetName.name
    : sheetName;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!B4:B1000`
  });

  const rows = res.data.values || [];

  let row = 4;

  for(const r of rows){

    if(!r[0] || r[0].toString().trim() === ''){
      return row;
    }

    row++;
  }

  return row;
}

// =====================================
// Ambil nama rekening dari bank tujuan
// contoh:
// BCA - xxxxx7144 - PRAKITNO
// hasil:
// PRAKITNO
// =====================================
function extractNama(bankTujuan){

  if(!bankTujuan) return '';

  const parts = bankTujuan.split('-');

  if(parts.length >= 3){
    return parts.slice(2).join('-').trim();
  }

  return bankTujuan.trim();
}

// =====================================
// HITUNG BIAYA ADMIN
// =====================================
function normalizeBank(text = '') {
  const t = text.toUpperCase();

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

function getAdminFee(bankAktif, bankTujuan){

  const asal = normalizeBank(bankAktif);

  const tujuan = normalizeBank(
    (bankTujuan || '').split('-')[0]
  );

  if (asal === tujuan) {
    return 0;
  }

  if (tujuan === 'DANA' || tujuan === 'OVO') return 0;

  if (tujuan === 'GOPAY' || tujuan === 'LINKAJA') return 1000;

  return 2500;
}

// =====================================
// Tulis transaksi ke sheet
// =====================================
export async function appendToSheet(sheetName, item, bankAktif){
  console.log('RAW DATA:', {
    bankAktif,
    bankTujuan: item.bankTujuan
  });
  sheetName = typeof sheetName === 'object'
    ? sheetName.name
    : sheetName;

  const row = await getNextRow(sheetName);

  const nama =
    item.atasNama || extractNama(item.bankTujuan);

const biayaAdmin = getAdminFee(
  bankAktif,
  item.bankTujuan
);

  const data = [

    // TRANSAKSI UTAMA
    {
      range: `'${sheetName}'!B${row}`,
      values: [[ nama ]]
    },

    {
      range: `'${sheetName}'!C${row}`,
      values: [[ item.nominal ]]
    },

    {
      range: `'${sheetName}'!F${row}`,
      values: [[ item.userId ]]
    }

  ];

  // Kalau ada biaya admin -> tambah baris di bawahnya
  if (biayaAdmin > 0) {

    data.push(
      {
        range: `'${sheetName}'!B${row + 1}`,
        values: [[ 'BIAYA TRANSFER' ]]
      },
      {
        range: `'${sheetName}'!C${row + 1}`,
        values: [[ biayaAdmin ]]
      }
    );

  }

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data
    }
  });

  console.log(
    `Transaksi masuk ke ${sheetName} baris ${row} | biaya admin: ${biayaAdmin}`
  );
}