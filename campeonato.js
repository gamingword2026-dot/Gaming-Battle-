// Dados dos times (12 clãs)
const times = [
    { id: 1, nome: 'Clã 1', img: 'style/cla1.png' },
    { id: 2, nome: 'Clã 2', img: 'style/cla2.png' },
    { id: 3, nome: 'Clã 3', img: 'style/cla3.png' },
    { id: 4, nome: 'Clã 4', img: 'style/cla4.png' },
    { id: 5, nome: 'Clã 5', img: 'style/cla5.png' },
    { id: 6, nome: 'Clã 6', img: 'style/cla6.png' },
    { id: 7, nome: 'Clã 7', img: 'style/cla7.png' },
    { id: 8, nome: 'Clã 8', img: 'style/cla8.png' },
    { id: 9, nome: 'Clã 9', img: 'style/cla9.png' },
    { id: 10, nome: 'Clã 10', img: 'style/cla10.png' },
    { id: 11, nome: 'Clã 11', img: 'style/cla11.png' },
    { id: 12, nome: 'Clã 12', img: 'style/cla12.png' }
];

// Estrutura dos confrontos
const rodadas = {
    1: [ // 6 confrontos - 12 times
        { timeA: 1, timeB: 2 },
        { timeA: 3, timeB: 4 },
        { timeA: 5, timeB: 6 },
        { timeA: 7, timeB: 8 },
        { timeA: 9, timeB: 10 },
        { timeA: 11, timeB: 12 }
    ],
    2: [ // 3 confrontos - 6 times (vencedores da rodada 1)
        { timeA: 1, timeB: 3 },
        { timeA: 5, timeB: 7 },
        { timeA: 9, timeB: 11 }
    ],
    3: [ // 2 confrontos - 4 times (semifinal)
        { timeA: 1, timeB: 5 },
        { timeA: 9, timeB: 11 }
    ],
    4: [ // 1 confronto - FINAL
        { timeA: 1, timeB: 9 }
    ]
};

let rodadaAtual = 1;

const container = document.getElementById('container-confrantos');
const botoes = document.querySelectorAll('.btn-rodada');
const modal = document.getElementById('modal-confronto');
const modalTimes = document.getElementById('modal-times');
const modalInfo = document.getElementById('modal-info');
const modalTitulo = document.getElementById('modal-titulo');
const fecharModal = document.querySelector('.fechar-modal');

function getTime(id) {
    return times.find(t => t.id === id);
}

function renderizarRodada(numero) {
    const confrontos = rodadas[numero];
    if (!confrontos) return;

    let html = `<div class="grid-jogos">`;
    
    confrontos.forEach((conf, index) => {
        const timeA = getTime(conf.timeA);
        const timeB = getTime(conf.timeB);
        
        html += `
            <div class="card-jogo" data-rodada="${numero}" data-jogo="${index}">
                <div class="time-box">
                    <img src="${timeA.img}" alt="${timeA.nome}">
                    <span>${timeA.nome}</span>
                </div>
                <div class="vs-box">⚔️</div>
                <div class="time-box">
                    <img src="${timeB.img}" alt="${timeB.nome}">
                    <span>${timeB.nome}</span>
                </div>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;

    document.querySelectorAll('.card-jogo').forEach(card => {
        card.addEventListener('click', function() {
            const rodada = parseInt(this.dataset.rodada);
            const jogo = parseInt(this.dataset.jogo);
            abrirModal(rodada, jogo);
        });
    });
}

function abrirModal(rodadaNum, jogoIndex) {
    const confronto = rodadas[rodadaNum][jogoIndex];
    if (!confronto) return;

    const timeA = getTime(confronto.timeA);
    const timeB = getTime(confronto.timeB);

    modalTitulo.textContent = `⚔️ RODADA ${rodadaNum} - CONFRONTO ${jogoIndex + 1}`;
    
    modalTimes.innerHTML = `
        <div class="modal-time">
            <img src="${timeA.img}" alt="${timeA.nome}">
            <span>${timeA.nome}</span>
        </div>
        <div class="modal-vs">VS</div>
        <div class="modal-time">
            <img src="${timeB.img}" alt="${timeB.nome}">
            <span>${timeB.nome}</span>
        </div>
    `;

    const data = new Date();
    const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    
    modalInfo.innerHTML = `
        <p>📅 ${dataStr} - 20:00 BRT</p>
        <p>🏟️ Arena Gaming World</p>
        <p style="color:#ffd700; margin-top:8px; opacity:0.5;">Clique fora para fechar</p>
    `;

    modal.classList.add('mostrar');
}

fecharModal.addEventListener('click', () => modal.classList.remove('mostrar'));
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('mostrar');
});

botoes.forEach(btn => {
    btn.addEventListener('click', function() {
        botoes.forEach(b => b.classList.remove('ativo'));
        this.classList.add('ativo');
        rodadaAtual = parseInt(this.dataset.rodada);
        renderizarRodada(rodadaAtual);
    });
});

// Iniciar com Rodada 1
renderizarRodada(1);
