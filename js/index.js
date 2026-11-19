const loginLinks = document.querySelectorAll('.login, .menu-conta a');

const loginModal = document.createElement('div');
loginModal.className = 'login-modal';
loginModal.innerHTML = `
  <div class="login-modal-box">
    <button type="button" class="login-close" aria-label="Fechar">✕</button>
    <h2 class="login-modal-title">Entrar</h2>
    <p class="login-modal-subtitle">Continue para acessar sua conta.</p>
    <input type="email" class="login-input" placeholder="E-mail" id="login-email">
    <div class="password-container">
      <input id="login-password" type="password" class="login-input" placeholder="Senha">
      <img src="img/eye.svg" class="eye-icon" alt="Mostrar senha">
    </div>
    <a href="#" class="forgot-password">Esqueceu sua senha?</a>
    <button type="button" class="login-button">Entrar</button>
  </div>
`;

const forgotModal = document.createElement('div');
forgotModal.className = 'forgot-modal';
forgotModal.innerHTML = `
  <div class="login-modal-box">
    <button type="button" class="forgot-close login-close" aria-label="Fechar">✕</button>
    <h2 class="login-modal-title">Recuperar senha</h2>
    <p class="login-modal-subtitle">Digite seu e-mail para receber as instruções de redefinição.</p>
    <input type="email" class="login-input" placeholder="E-mail">
    <button type="button" class="login-button">Enviar link</button>
  </div>
`;

document.body.append(loginModal, forgotModal);

loginLinks.forEach((link) => {
  if (link.textContent.trim() === 'Login') {
    link.addEventListener('click', (event) => {
      event.preventDefault();

      const modalAntigo = document.getElementById('registrarModal');
      if (modalAntigo?.open) {
        modalAntigo.close();
      }

      loginModal.classList.add('open');
    });
  }
});

loginModal.querySelector('.login-close').addEventListener('click', () => {
  loginModal.classList.remove('open');
});

loginModal.addEventListener('click', (event) => {
  if (event.target === loginModal) loginModal.classList.remove('open');
});

loginModal.querySelector('.forgot-password').addEventListener('click', (event) => {
  event.preventEvent?.();
  event.preventDefault();
  loginModal.classList.remove('open');
  forgotModal.classList.add('open');
});

forgotModal.querySelector('.forgot-close').addEventListener('click', () => {
  forgotModal.classList.remove('open');
});

forgotModal.addEventListener('click', (event) => {
  if (event.target === forgotModal) forgotModal.classList.remove('open');
});

const eyeIcon = loginModal.querySelector('.eye-icon');
eyeIcon.addEventListener('click', () => {
  const passwordInput = loginModal.querySelector('#login-password');
  const mostrar = passwordInput.type === 'password';
  passwordInput.type = mostrar ? 'text' : 'password';
  eyeIcon.src = mostrar ? 'img/eye-off.svg' : 'img/eye.svg';
  eyeIcon.alt = mostrar ? 'Ocultar senha' : 'Mostrar senha';
});
