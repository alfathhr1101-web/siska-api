export function Navbar() {

  const login =
    localStorage.getItem('sis4d_operator') || 'operator';

  return `
    <div class="topbar">

      <div class="topbar-title">
        <h1>SIS4D Operator Panel</h1>
        <small>Login sebagai: ${login}</small>
      </div>

      <div class="topbar-actions">

        <button id="refreshBtn" class="topbar-btn primary">
          Refresh
        </button>

        <button onclick="logout()" class="topbar-btn danger">
          Logout
        </button>

      </div>

    </div>
  `;
}