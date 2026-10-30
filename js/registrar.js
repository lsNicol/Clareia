const modal = document.getElementById('registrarModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const registrarForm = document.getElementById('registrarForm');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const submitBtn = document.getElementById('submitBtn');
const alternarTexto = document.getElementById('alternarTexto');
const alternarLink = document.getElementById('alternarLink');
const titulo = document.getElementById('modalTitulo');
let criando = true;

togglePassword.addEventListener('click', () => {
  const mostrar = passwordInput.type === 'password';
  passwordInput.type = mostrar ? 'text' : 'password';
  togglePassword.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
});

// Alterna entre "Criar conta" e "Entrar"
alternarLink.addEventListener('click', (e) => {
  e.preventDefault();
  criando = !criando;
  const texto = criando ? 'Criar conta' : 'Entrar';
  titulo.textContent = texto;
  submitBtn.textContent = texto;
  alternarTexto.textContent = criando ? 'Já tem uma conta?' : 'Ainda não tem conta?';
  alternarLink.textContent = criando ? 'Entrar' : 'Criar conta';
});

openModalBtn.addEventListener('click', (e) => {
  e.preventDefault();
  modal.showModal();
});

// Fechar o modal pelo botão "X"
closeModalBtn.addEventListener('click', () => {
  modal.close();
});

// Fechar clicando fora do modal (no backdrop)
modal.addEventListener('click', (event) => {
  const rect = modal.getBoundingClientRect();
  const isInDialog = (
    rect.top <= event.clientY &&
    event.clientY <= rect.bottom &&
    rect.left <= event.clientX &&
    event.clientX <= rect.right
  );
  if (!isInDialog) {
    modal.close();
  }
});

// Interceptar envio do formulário de login
registrarForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;

  // Exemplo básico de validação/ação
  alert(`${criando ? 'Conta criada' : 'Login realizado'} com o e-mail: ${email}`);
  modal.close();
  registrarForm.reset();
});
