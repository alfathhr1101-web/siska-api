import time
import uiautomator2 as u2

BANK = 'SEABANK'
REKENING = '901278774240'
NOMINAL = '20000'

d = u2.connect()

def w(sec=0.8):
    time.sleep(sec)

print('CONNECTED')

# buka myBCA
d.app_start('com.bca.mybca.omni.android')
w(2)

# Transfer
d(text='Transfer').click()
w()

# Bank Lain
d(text='Bank Lain').click()
w()

# tujuan baru
d(textContains='tujuan baru').click()
w()

# cari bank
search = d(className='android.widget.EditText')
search.click()
w(0.5)
search.set_text(BANK)
w(1)

banks = d(textContains=BANK)
banks[1].click() if banks.count > 1 else banks[0].click()
print('Pilih bank')
w(2)

# halaman rekening
d(textContains='No. Rekening').wait(timeout=15)

rekening_field = d(className='android.widget.EditText')
rekening_field.click()
w(0.5)
rekening_field.set_text(REKENING)
w(1)

d.press('enter')
w(1)

# lanjut rekening
d(text='Lanjut').wait(timeout=15)
d(text='Lanjut').click()
print('Lanjut rekening')

# tunggu halaman nominal siap
w(3)

# ambil semua edittext di halaman ini
fields = d(className='android.widget.EditText')

print('Jumlah EditText:', fields.count)

if fields.count < 2:
    raise Exception('Field nominal tidak ditemukan')

# field kedua = nominal
nominal_field = fields[1]

# klik elemen nominal langsung
nominal_field.click()
w(1.5)

# isi langsung ke elemen nominal
nominal_field.set_text(NOMINAL)
print('Nominal diisi')

w(2)

# tutup keyboard
d.press('back')
w(1)

# layanan transfer
d(textContains='Layanan Transfer').click()
w(1)

# BI FAST
d(textContains='BI FAST').click()
print('BI FAST')
w(1)

# tujuan transaksi
d(textContains='Tujuan Transaksi').click()
w(0.5)

d(text='Lainnya').click()
w(0.5)

# lanjut konfirmasi
d(text='Lanjut').click()
print('Sampai konfirmasi')

print('=== DONE ===')