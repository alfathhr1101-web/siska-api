export function Sidebar(){

  return `
    <div class="sidebar-header">
      <h2>SIS4D</h2>
      <p>Operator Panel</p>
    </div>

    <nav class="sidebar-nav">

      <a href="#dashboard" class="nav-item" data-page="dashboard">
        📊 Dashboard
      </a>

      <a href="#admins" class="nav-item" data-page="admins">
        👤 Admin Online
      </a>

      <a href="#banks" class="nav-item" data-page="banks">
        🏦 Bank Master
      </a>

    </nav>
  `;
}