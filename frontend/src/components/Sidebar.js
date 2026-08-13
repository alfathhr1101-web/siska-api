export function Sidebar() {

  const current =
    (location.hash || '#dashboard').replace('#', '');

  const active = (page) =>
    current === page ? 'active' : '';

  return `
    <div class="sidebar-header">

      <div class="sidebar-logo">S</div>

      <div>
        <h2>SIS4D</h2>
        <p>Operator Panel</p>
      </div>

    </div>

    <nav class="sidebar-nav">

      <a href="#dashboard"
         class="nav-item ${active('dashboard')}"
         data-page="dashboard">
        <span class="nav-icon">📊</span>
        <span>Dashboard</span>
      </a>

      <a href="#admins"
         class="nav-item ${active('admins')}"
         data-page="admins">
        <span class="nav-icon">👤</span>
        <span>Admin Online</span>
      </a>

      <a href="#banks"
         class="nav-item ${active('banks')}"
         data-page="banks">
        <span class="nav-icon">🏦</span>
        <span>Bank Master</span>
      </a>

    </nav>

    <div class="sidebar-footer">

      <button class="logout-btn" onclick="logout()">
        🚪 Logout
      </button>

      <small>SIS4D Operator v1.0</small>

    </div>
  `;
}