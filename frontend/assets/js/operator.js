document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  // sementara hardcode dulu
  if(username === 'operator' && password === 'sis4d123'){
    window.location.href = '/dashboard/';
  }else{
    alert('Username atau password salah');
  }
});