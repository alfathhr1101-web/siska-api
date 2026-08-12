import { Sidebar } from './components/Sidebar.js';
import { Navbar } from './components/Navbar.js';
import './router.js';

document.getElementById('sidebar').innerHTML = Sidebar();
document.getElementById('navbar').innerHTML = Navbar();