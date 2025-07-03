document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  fetch('../api/login.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
      body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      if (data.success) {
        alert('Đăng nhập thành công!');
        window.location.href = '../views/dashboard.html';
      } else {
        alert('Email hoặc mật khẩu không đúng!');
      }
    })
    .catch(error => {
      console.error('Lỗi:', error);
    });
  });
  