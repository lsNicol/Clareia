const cadastroForm = document.getElementById('cadastroForm');
const cadastroStatus = document.getElementById('cadastro-status');
const campos = [...cadastroForm.querySelectorAll('input[required]')];
const digitos = (valor) => valor.replace(/\D/g, '');

const mascaras = {
  cpf: (valor) => valor.slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/(\.\d{3})(\d)/, '$1.$2')
    .replace(/(\.\d{3})(\d)/, '$1-$2'),
  telefone: (valor) => {
    const numero = valor.slice(0, 11);
    const prefixo = numero.length === 11 ? 5 : 4;
    const parteLocal = numero.slice(2);
    if (numero.length <= 2) return numero;
    return `(${numero.slice(0, 2)}) ${parteLocal.slice(0, prefixo)}`
      + (parteLocal.length > prefixo ? `-${parteLocal.slice(prefixo)}` : '');
  },
  cep: (valor) => valor.slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2'),
  nascimento: (valor) => valor.slice(0, 8)
    .replace(/^(\d{2})(\d)/, '$1/$2')
    .replace(/^(\d{2}\/\d{2})(\d)/, '$1/$2'),
  numero: digitos,
};

cadastroForm.querySelectorAll('.eye-icon').forEach((botao) => {
  const senha = botao.previousElementSibling;
  const icone = botao.querySelector('img');
  botao.addEventListener('click', () => {
    const mostrar = senha.type === 'password';
    senha.type = mostrar ? 'text' : 'password';
    icone.src = mostrar ? '../img/eye-off.svg' : '../img/eye.svg';
    botao.setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
  });
});

function validarNascimento(valor) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(valor)) return 'Informe a data no formato DD/MM/AAAA.';
  const [dia, mes, ano] = valor.split('/').map(Number);
  const data = new Date(0);
  data.setFullYear(ano, mes - 1, dia);
  const hoje = new Date();
  if (ano === 0 || data.getFullYear() !== ano || data.getMonth() !== mes - 1
      || data.getDate() !== dia || data > hoje) {
    return 'Informe uma data de nascimento válida.';
  }
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) {
    idade--;
  }
  return idade < 13 ? 'É necessário ter pelo menos 13 anos.' : '';
}

function mensagemDeErro(campo) {
  if (campo.id === 'termos') return campo.checked ? '' : 'Aceite os termos para continuar.';
  if (!campo.value.trim()) return 'Preencha este campo.';

  const valor = campo.value;
  switch (campo.id) {
    case 'cpf':
      return digitos(valor).length !== 11 ? 'Informe os 11 dígitos do CPF.' : '';
    case 'cep':
      return digitos(valor).length !== 8 ? 'Informe os 8 dígitos do CEP.' : '';
    case 'telefone':
      return !/^\d{10,11}$/.test(digitos(valor)) ? 'Informe o telefone com DDD.' : '';
    case 'nascimento':
      return validarNascimento(valor);
    case 'email':
      return campo.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)
        ? 'Informe um e-mail válido.' : '';
    case 'password':
      return valor.length < 6 ? 'Use pelo menos 6 caracteres.' : '';
    case 'confirm-password':
      return valor !== cadastroForm.elements.password.value ? 'As senhas não coincidem.' : '';
    default:
      return '';
  }
}

function mostrarErro(campo, mensagem) {
  document.getElementById(`${campo.id}-erro`).textContent = mensagem;
  if (mensagem) campo.setAttribute('aria-invalid', 'true');
  else campo.removeAttribute('aria-invalid');
}

cadastroForm.addEventListener('input', ({ target: campo }) => {
  cadastroStatus.textContent = '';
  if (!campos.includes(campo)) return;
  const mascara = mascaras[campo.id];
  if (mascara) campo.value = mascara(digitos(campo.value));
  if (campo.hasAttribute('aria-invalid')) mostrarErro(campo, mensagemDeErro(campo));

  const confirmacao = cadastroForm.elements['confirm-password'];
  if (campo.id === 'password' && confirmacao.value) {
    mostrarErro(confirmacao, mensagemDeErro(confirmacao));
  }
});

cadastroForm.addEventListener('submit', (event) => {
  event.preventDefault();
  cadastroStatus.textContent = '';
  let primeiroInvalido;
  for (const campo of campos) {
    const mensagem = mensagemDeErro(campo);
    mostrarErro(campo, mensagem);
    if (mensagem && !primeiroInvalido) primeiroInvalido = campo;
  }
  if (primeiroInvalido) {
    primeiroInvalido.focus();
    return;
  }
  cadastroStatus.textContent = 'Formulário validado. A criação de contas ainda não está disponível.';
});

cadastroForm.querySelector('[data-google]').addEventListener('click', () => {
  cadastroStatus.textContent = 'O acesso com Google ainda não está disponível.';
});
