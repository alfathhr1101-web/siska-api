import './style.css'

const root = document.querySelector('#operator')

function render(){
  const data = JSON.parse(localStorage.getItem('wdData')) || []

  root.innerHTML = `
    <div class="container">
      <h1>Operator HP</h1>

      ${data.map((item,i)=>`
        <div style="background:#111827;padding:15px;border-radius:12px;margin-bottom:10px">
          <b>${item.nama}</b><br>
          ${item.bank} - ${item.rekening}<br>
          Rp ${Number(item.nominal).toLocaleString('id-ID')}<br>
          Status: <b>${item.status}</b><br><br>
          <button onclick="window.proses(${i})">Proses</button>
        </div>
      `).join('')}
    </div>
  `
}

window.proses = (i)=>{
  const data = JSON.parse(localStorage.getItem('wdData')) || []
  data[i].status = 'Berhasil'
  localStorage.setItem('wdData', JSON.stringify(data))
  render()
}

render()
setInterval(render, 1000)