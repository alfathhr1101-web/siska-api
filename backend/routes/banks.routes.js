import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

const BANK_FILE = path.resolve('./data/banks.json');

function readBanks() {
  return JSON.parse(fs.readFileSync(BANK_FILE, 'utf8'));
}

function saveBanks(data) {
  fs.writeFileSync(BANK_FILE, JSON.stringify(data, null, 2));
}

// GET semua bank
router.get('/', (req, res) => {
  res.json(readBanks());
});

// POST tambah bank
router.post('/', (req, res) => {
  const banks = readBanks();

  const newBank = {
    id: Date.now(),
    name: req.body.name,
    spreadsheetId: req.body.spreadsheetId,
    sheetName: req.body.sheetName,
    startRow: Number(req.body.startRow || 4),
    active: true
  };

  banks.push(newBank);
  saveBanks(banks);

  res.json({
    success: true,
    bank: newBank
  });
});

// PUT edit bank
router.put('/:id', (req, res) => {
  const banks = readBanks();

  const index = banks.findIndex(
    b => String(b.id) === req.params.id
  );

  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: 'Bank tidak ditemukan'
    });
  }

  banks[index] = {
    ...banks[index],
    ...req.body
  };

  saveBanks(banks);

  res.json({
    success: true,
    bank: banks[index]
  });
});

// DELETE hapus bank
router.delete('/:id', (req, res) => {
  const banks = readBanks();

  const filtered = banks.filter(
    b => String(b.id) !== req.params.id
  );

  saveBanks(filtered);

  res.json({ success: true });
});

export default router;