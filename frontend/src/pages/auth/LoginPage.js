export function LoginPage() {
  return `
    <div class="auth-page">
      <div class="auth-card">
        <h1>SIS4D Operator</h1>
        <p>Masuk ke dashboard operator</p>

        <input id="username" type="text" placeholder="Username" />
        <input id="password" type="password" placeholder="Password" />

        <button id="loginBtn">Masuk</button>
      </div>
    </div>
  `;
}

export function bindLogin() {
  document.getElementById('loginBtn').onclick = () => {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;

    if (u === 'operator' && p === 'sis4d123') {
      localStorage.setItem('operator_login', '1');
      location.hash = '#dashboard';
      location.reload();
    } else {
      alert('Username atau password salah');
    }
  };
}