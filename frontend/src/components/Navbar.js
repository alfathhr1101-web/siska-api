export function Navbar(){

  const login =
    localStorage.getItem('sis4d_operator') || 'operator';

  return `
    <div class="topbar">

      <div>
        <h1>SIS4D Operator Panel</h1>
        <small>Login sebagai: ${login}</small>
      </div>

      <button id="refreshBtn">Refresh</button>

    </div>
  `;
}