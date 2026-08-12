import time
import uiautomator2 as u2

d = u2.connect()

# buka myBCA
d.app_start('com.bca.mybca.omni.android')
time.sleep(3)

# klik Transfer berdasarkan teks
d(text='Transfer').click()

print('Klik Transfer berhasil')