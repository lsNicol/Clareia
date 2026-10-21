const zona = document.querySelector(".area-de-envio");
const input = document.getElementById("arquivo");

zona.addEventListener("dragenter", (e) => {
  e.preventDefault();
  zona.classList.add("arrastando");
});

zona.addEventListener("dragover", (e) => {
  e.preventDefault(); // obrigatório, senão o drop não acontece
});

zona.addEventListener("dragleave", (e) => {
  // ignora quando o mouse só passou para um elemento filho
  if (zona.contains(e.relatedTarget)) return;
  zona.classList.remove("arrastando");
});

zona.addEventListener("drop", (e) => {
  e.preventDefault(); // impede o navegador de abrir o arquivo
  zona.classList.remove("arrastando");

  const arquivo = e.dataTransfer.files[0];
  if (arquivo) tratarArquivo(arquivo);
});

// Também funciona clicando e escolhendo pelo explorador de arquivos
input.addEventListener("change", () => {
  if (input.files[0]) tratarArquivo(input.files[0]);
});

function tratarArquivo(arquivo) {
  console.log(arquivo.name, arquivo.type, arquivo.size);
}
