/* ===========================
   PREMIAÇÃO
=========================== */

.awards{

display:flex;
justify-content:center;
align-items:stretch;
gap:25px;
flex-wrap:wrap;
margin-top:25px;

}

.award{

flex:1;
min-width:240px;
max-width:320px;

background:rgba(255,255,255,.04);

border:1px solid rgba(255,255,255,.08);

border-radius:22px;

padding:30px 20px;

text-align:center;

transition:.4s;

backdrop-filter:blur(20px);

}

.award:hover{

transform:translateY(-10px) scale(1.03);

box-shadow:
0 0 30px rgba(46,197,255,.35);

}

.award span{

font-size:3.2rem;

display:block;

margin-bottom:15px;

}

.award h3{

font-family:"Orbitron",sans-serif;

font-size:1.5rem;

color:var(--gold);

margin-bottom:12px;

}

.award p{

color:var(--text);

margin:8px 0;

}

.first{

border:2px solid var(--gold);

box-shadow:
0 0 25px rgba(255,211,77,.25);

}

.second{

border:2px solid var(--blue);

}

/* ===========================
   FOOTER
=========================== */

footer{

margin-top:70px;

padding:40px 20px;

text-align:center;

border-top:1px solid rgba(255,255,255,.08);

background:rgba(0,0,0,.35);

backdrop-filter:blur(15px);

}

.footerLogo{

width:220px;

margin-bottom:18px;

filter:

drop-shadow(0 0 15px #00BFFF);

}

footer p{

font-family:"Orbitron",sans-serif;

font-size:1.2rem;

color:var(--white);

margin-bottom:8px;

}

footer span{

color:#88cfff;

font-size:.95rem;

}

/* ===========================
   ANIMAÇÃO DOS CARDS
=========================== */

.reveal{

opacity:0;

transform:translateY(60px);

transition:
opacity .8s ease,
transform .8s ease;

}

.reveal.active{

opacity:1;

transform:translateY(0);

}

/* ===========================
   RESPONSIVO
=========================== */

@media(max-width:768px){

.hero{

padding:40px 20px;

}

.logo{

width:92%;

}

.title{

font-size:2.2rem;

}

.subtitle{

font-size:.85rem;

letter-spacing:2px;

}

.description{

font-size:.95rem;

line-height:1.7;

}

.playButton{

width:100%;

padding:18px;

font-size:1rem;

}

.card{

padding:22px;

}

.card h2{

font-size:1.2rem;

}

.awards{

flex-direction:column;

}

.award{

max-width:100%;

}

.footerLogo{

width:170px;

}

}
