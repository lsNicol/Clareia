const eyeIcons=document.querySelectorAll(".eye-icon");
eyeIcons.forEach(icon=>{
    icon.addEventListener("click",()=>{
        const input=icon.previousElementSibling;
        if(input.type==="password"){
            input.type="text";
            icon.src="../img/eye-off.svg";
        }else{
            input.type="password";
            icon.src="../img/eye.svg";
        }
    });
});
document.querySelectorAll(".campo input[type='text']").forEach(input=>{
    const label=input.parentElement.querySelector("label");
    if(!label)return;
    if(label.textContent==="Nome"||label.textContent==="Sobrenome"){
        input.addEventListener("input",()=>{
            input.value=input.value.replace(/[^a-zA-ZÀ-ÿ\s]/g,"");
        });
    }
});
const cpf=document.getElementById("cpf");
cpf.addEventListener("input",()=>{
    let valor=cpf.value.replace(/\D/g,"");
    valor=valor.slice(0,11);
    valor=valor.replace(/(\d{3})(\d)/,"$1.$2");
    valor=valor.replace(/(\d{3})(\d)/,"$1.$2");
    valor=valor.replace(/(\d{3})(\d{1,2})$/,"$1-$2");
    cpf.value=valor;
});
const telefone=document.getElementById("telefone");
telefone.addEventListener("input",()=>{
    let valor=telefone.value.replace(/\D/g,"");
    valor=valor.slice(0,11);
    valor=valor.replace(/(\d{2})(\d)/,"($1) $2");
    valor=valor.replace(/(\d{5})(\d)/,"$1-$2");
    telefone.value=valor;
});
const cep=document.getElementById("cep");
cep.addEventListener("input",()=>{
    let valor=cep.value.replace(/\D/g,"");
    valor=valor.slice(0,8);
    valor=valor.replace(/(\d{5})(\d)/,"$1-$2");
    cep.value=valor;
});
const numero=document.getElementById("numero");
numero.addEventListener("input",()=>{
    numero.value=numero.value.replace(/\D/g,"");
});
const email=document.getElementById("email");
email.addEventListener("blur",()=>{
    const regex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email.value!==""&&!regex.test(email.value)){
        alert("E-mail inválido.");
        email.focus();
    }
});
const nascimento=document.getElementById("nascimento");
nascimento.addEventListener("input",()=>{
    let valor=nascimento.value.replace(/\D/g,"");
    valor=valor.slice(0,8);
    if(valor.length>2)valor=valor.replace(/(\d{2})(\d)/,"$1/$2");
    if(valor.length>5)valor=valor.replace(/(\d{2})\/(\d{2})(\d)/,"$1/$2/$3");
    nascimento.value=valor;
});
const loginModal=document.querySelector(".login-modal");
const forgotModal=document.querySelector(".forgot-modal");
const openLogin=document.getElementById("open-login");
const closeLogin=document.querySelector(".login-close");
const forgotButton=document.querySelector(".forgot-password");
const forgotClose=document.querySelector(".forgot-close");
openLogin.addEventListener("click",e=>{
    e.preventDefault();
    loginModal.classList.add("open");
});
closeLogin.addEventListener("click",()=>{
    loginModal.classList.remove("open");
});
loginModal.addEventListener("click",e=>{
    if(e.target===loginModal){
        loginModal.classList.remove("open");
    }
});
forgotButton.addEventListener("click",e=>{
    e.preventDefault();
    loginModal.classList.remove("open");
    forgotModal.classList.add("open");
});
forgotClose.addEventListener("click",()=>{
    forgotModal.classList.remove("open");
});
forgotModal.addEventListener("click",e=>{
    if(e.target===forgotModal){
        forgotModal.classList.remove("open");
    }
});
const form=document.querySelector("form");
form.addEventListener("submit",e=>{
    e.preventDefault();
    const obrigatorios=["cpf","nascimento","email","telefone","cep","numero","password","confirm-password"];
    for(const id of obrigatorios){
        const campo=document.getElementById(id);
        if(campo.value.trim()===""){
            alert("Preencha todos os campos obrigatórios.");
            campo.focus();
            return;
        }
    }
    const senha=document.getElementById("password");
    const confirmar=document.getElementById("confirm-password");
    if(senha.value!==confirmar.value){
        alert("As senhas não coincidem.");
        confirmar.focus();
        return;
    }
    const termos=document.getElementById("termos");
    if(!termos.checked){
        alert("Você deve aceitar os Termos de Uso.");
        termos.focus();
        return;
    }
    const partes=nascimento.value.split("/");
    if(partes.length!==3){
        alert("Data de nascimento inválida.");
        nascimento.focus();
        return;
    }
    const data=new Date(partes[2],partes[1]-1,partes[0]);
    const hoje=new Date();
    let idade=hoje.getFullYear()-data.getFullYear();
    const mes=hoje.getMonth()-data.getMonth();
    if(mes<0||(mes===0&&hoje.getDate()<data.getDate())){
        idade--;
    }
    if(idade<13){
        alert("É necessário ter pelo menos 13 anos.");
        nascimento.focus();
        return;
    }
    alert("Cadastro válido.");
});