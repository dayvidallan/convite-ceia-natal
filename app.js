// CONTADOR
const contador = document.getElementById("contador");

function atualizarContador() {
  const fim = new Date("2025-12-17T11:00:00-03:00").getTime();
  const agora = Date.now();
  const diff = fim - agora;

  if (diff <= 0) {
    contador.innerHTML = "<span>Encerrado</span>";
    return;
  }

  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);

  contador.innerHTML = `
    <span>${d}<br>dias</span>
    <span>${h}<br>horas</span>
    <span>${m}<br>min</span>
    <span>${s}<br>seg</span>
  `;
}

setInterval(atualizarContador, 1000);
atualizarContador();

// FORM (por enquanto só visual)
document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();
  alert("Cadastro realizado! Fique atento ao e-mail 🎄");
});

// BOTÃO ADMIN
document.getElementById("adminBtn").addEventListener("click", () => {
  window.location.href = "/admin.html";
});
