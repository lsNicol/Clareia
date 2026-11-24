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
const emailInput = document.getElementById('email');
const contaStatus = document.getElementById('conta-status');
const credenciais = [emailInput, passwordInput];
let criando = true;

togglePassword.addEventListener('click', () => {
  const mostrar = passwordInput.type === 'password';
  passwordInput.type = mostrar ? 'text' : 'password';
  togglePassword.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
});

// Alterna entre "Criar conta" e "Entrar"
alternarLink.addEventListener('click', (e) => {
  if (criando) {
    e.preventDefault();
    configurarModo(false);
  }
});

function configurarModo(criarConta) {
  criando = criarConta;
  contaStatus.textContent = '';
  credenciais.forEach((campo) => mostrarErroConta(campo, ''));
  passwordInput.autocomplete = criando ? 'new-password' : 'current-password';
  const texto = criando ? 'Criar conta' : 'Entrar';
  titulo.textContent = texto;
  submitBtn.textContent = texto;
  alternarTexto.textContent = criando ? 'Já tem uma conta?' : 'Ainda não tem conta?';
  alternarLink.textContent = criando ? 'Entrar' : 'Criar conta';
  alternarLink.href = criando ? '#entrar' : 'pages/cadastro.html';
}

window.configurarModalConta = configurarModo;
window.abrirModalConta = (modoCriarConta = true) => {
  configurarModo(modoCriarConta);
  if (!modal.open) modal.showModal();
};

openModalBtn?.addEventListener('click', (e) => {
  e.preventDefault();
  window.abrirModalConta(true);
});

// Fechar o modal pelo botão "X"
closeModalBtn.addEventListener('click', () => {
  modal.close();
});

// Fechar clicando fora do modal (no backdrop)
modal.addEventListener('click', (event) => {
  if (event.target !== modal) return;
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

function mostrarErroConta(campo, mensagem) {
  document.getElementById(`${campo.id}-erro`).textContent = mensagem;
  if (mensagem) campo.setAttribute('aria-invalid', 'true');
  else campo.removeAttribute('aria-invalid');
}

function validarCredencial(campo) {
  if (!campo.value.trim()) return 'Preencha este campo.';
  if (campo === emailInput && campo.validity.typeMismatch) return 'Informe um e-mail válido.';
  if (campo === passwordInput && campo.value.length < 6) return 'Use pelo menos 6 caracteres.';
  return '';
}

for (const campo of credenciais) {
  campo.addEventListener('input', () => {
    contaStatus.textContent = '';
    if (campo.hasAttribute('aria-invalid')) mostrarErroConta(campo, validarCredencial(campo));
  });
}

registrarForm.addEventListener('submit', (event) => {
  event.preventDefault();
  contaStatus.textContent = '';
  let primeiroInvalido;
  for (const campo of credenciais) {
    const mensagem = validarCredencial(campo);
    mostrarErroConta(campo, mensagem);
    if (mensagem && !primeiroInvalido) primeiroInvalido = campo;
  }
  if (primeiroInvalido) {
    primeiroInvalido.focus();
    return;
  }
  contaStatus.textContent = criando
    ? 'A criação de contas ainda não está disponível.'
    : 'O login ainda não está disponível.';
});

modal.querySelector('[data-recuperar]').addEventListener('click', (event) => {
  event.preventDefault();
  contaStatus.textContent = 'A recuperação de senha ainda não está disponível.';
});

modal.querySelector('[data-google]').addEventListener('click', () => {
  contaStatus.textContent = 'O acesso com Google ainda não está disponível.';
});

modal.addEventListener('close', () => {
  registrarForm.reset();
  passwordInput.type = 'password';
  togglePassword.setAttribute('aria-label', 'Mostrar senha');
});

document.querySelectorAll('[data-login]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    window.abrirModalConta(false);
  });
});

const urlConta = new URL(window.location.href);
if (urlConta.searchParams.get('conta') === 'entrar') {
  urlConta.searchParams.delete('conta');
  window.history.replaceState(window.history.state, '', urlConta);
  window.abrirModalConta(false);
}
