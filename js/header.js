// marca o header da home quando a página já rolou, para ele compactar e ganhar o fundo translúcido
const headerHome = document.querySelector('.header-home');

if (headerHome) {
  const atualizar = () => headerHome.classList.toggle('rolou', window.scrollY > 10);
  atualizar();
  window.addEventListener('scroll', atualizar, { passive: true });
}
