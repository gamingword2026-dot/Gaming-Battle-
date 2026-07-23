/* ===========================
   GAMING WORLD - REGRAS.JS
=========================== */

/* ===========================
   ANIMAÇÃO DOS CARDS
=========================== */

const cards = document.querySelectorAll(".card");

function revelarCards(){

    const alturaTela = window.innerHeight;

    cards.forEach(card=>{

        const topo = card.getBoundingClientRect().top;

        if(topo < alturaTela - 120){

            card.classList.add("active");

        }

    });

}

window.addEventListener("load", revelarCards);

window.addEventListener("scroll", revelarCards);

window.addEventListener("resize", revelarCards);

/* ===========================
   PARALAX DAS ESTRELAS
=========================== */

const estrelas = document.querySelector(".stars");

window.addEventListener("scroll",()=>{

    const scroll = window.scrollY;

    estrelas.style.transform =
    `translateY(${scroll*0.03}px)`;

});

/* ===========================
   EFEITO LOGO
=========================== */

const logo = document.querySelector(".logo");

if(logo){

logo.addEventListener("mouseenter",()=>{

logo.style.transition=".4s";

logo.style.transform="scale(1.04)";

});

logo.addEventListener("mouseleave",()=>{

logo.style.transform="scale(1)";

});

}

/* ===========================
   BRILHO ALEATÓRIO
=========================== */

setInterval(()=>{

document.querySelectorAll(".premio").forEach(card=>{

card.style.boxShadow=

`0 0 ${
18 + Math.random()*18
}px rgba(46,197,255,.35)`;

});

},2200);

/* ===========================
   TÍTULO DA ABA
=========================== */

let alternar=false;

setInterval(()=>{

document.title = alternar ?

"📜 Regras • Gaming World"

:

"🎮 Gaming World";

alternar=!alternar;

},3000);

console.log("Regras Gaming World carregadas.");
