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

  const arquivos = e.dataTransfer.files;
  for (const file of arquivos){
    if (!tratarArquivo(file)) {
      console.log("Iterrompendo..");
      break;
    }
  }
});

// Também funciona clicando e escolhendo pelo explorador de arquivos
input.addEventListener("change", () => {
  if (input.files[0]) tratarArquivo(input.files[0]);
});

function tratarArquivo(arquivo) {
  console.log(arquivo.name, arquivo.type, arquivo.size);
  if (arquivo.size > 10240000){
    console.log("Arquivo rejeitado, maior que 10 Mb");
    return false;
  }
  else{
    console.log("Arquivo aceitado!");
    enviarParaServidor(arquivo);
    return true;
  }
}
async function enviarParaServidor(arquivo) {
  const form = new FormData();
  form.append("arquivo", arquivo);

  try {
    const resp = await fetch("/api/fatura", { method: "POST", body: form });
    const dados = await resp.json();
    if (!resp.ok) {
      console.log("Erro:", dados.erro);
      return;
    }
    console.log("Dados da fatura:", dados);
  } catch (err) {
    console.log("Servidor fora do ar?", err);
  }
}
