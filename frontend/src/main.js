import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';

// import router supaya event hashchange jalan
import './router.js';

const sidebarEl = document.getElementById('sidebar');
const navbarEl = document.getElementById('navbar');

// =====================================
// CEK LOGIN
// =====================================
function isLoggedIn() {
  return localStorage.getItem('operator_login') === '1';
}

// =====================================
// RENDER LAYOUT
// =====================================
if (isLoggedIn()) {

  sidebarEl.innerHTML = Sidebar();
  navbarEl.innerHTML = Navbar();

} else {

  // sembunyikan sidebar/navbar saat login
  sidebarEl.style.display = 'none';
  navbarEl.style.display = 'none';
}

// =====================================
// GLOBAL LOGOUT
// =====================================
window.logout = function () {

  localStorage.removeItem('operator_login');
  localStorage.removeItem('sis4d_operator');

  location.hash = '#login';
  location.reload();
};