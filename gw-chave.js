/* ==========================================================
   GAMING WORLD 2026 — RENDERIZADOR DA CHAVE (2v2 e 5v5)
   Usa GW.subscribe (gw-core.js). Cada página monta a sua própria
   chave informando o campeonato: GW.mountChave({ camp: '2v2' }).
   ========================================================== */
(function (global) {
    'use strict';
    var GW = global.GW, esc = GW.esc;

    function placeholder(label, size) {
        var s = size || 60;
        return "data:image/svg+xml," + encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="' + s + '" height="' + s + '"><rect width="' + s + '" height="' + s +
            '" fill="#222"/><text x="' + s / 2 + '" y="' + (s / 2 + 5) + '" text-anchor="middle" fill="#ffd700" font-family="Arial" font-size="' +
            Math.round(s / 4) + '" font-weight="bold">' + label + '</text></svg>');
    }

    function slot(team, bye, size) {
        if (bye) return { img: placeholder('BYE', size), nome: 'BYE', cls: 'slot-bye' };
        if (!team) return { img: placeholder('?', size), nome: 'A DEFINIR', cls: 'slot-tbd' };
        return { img: team.img, nome: team.nome, cls: '', fallback: placeholder(String(team.id), size) };
    }

    function timeBox(s, state) {
        return '<div class="time-box ' + s.cls + ' ' + (state || '') + '">' +
            '<img src="' + esc(s.img) + '" alt="' + esc(s.nome) + '"' +
            (s.fallback ? ' data-fallback="' + esc(s.fallback) + '"' : '') + '>' +
            '<span>' + esc(s.nome) + '</span></div>';
    }

    function placarTxt(m) {
        return (m.placarA != null && m.placarB != null) ? m.placarA + ' x ' + m.placarB : null;
    }

    function cardHTML(m, cfg) {
        var sa = slot(m.a, false), sb = slot(m.b, m.bye);
        var stA = '', stB = '';
        if (m.winner && !m.bye) { stA = m.winner === m.a ? 'vencedor' : 'perdedor'; stB = m.winner === m.b ? 'vencedor' : 'perdedor'; }
        var meio = m.bye ? '<span class="gw-passa">AVANÇA</span>' : (placarTxt(m) || '⚔️');
        var horario = m.horario || cfg.horarioPadrao || 'A definir';
        var rodape = m.bye ? 'Vaga automática (BYE)' : '📅 ' + esc(horario) + (m.formato ? ' · ' + m.formato : '');
        return '<div class="card-jogo' + (m.bye ? ' bye' : '') + (m.winner && !m.bye ? ' decidido' : '') + '" data-mid="' + esc(m.id) + '">' +
            timeBox(sa, stA) + '<div class="vs-box">' + meio + '</div>' + timeBox(sb, stB) +
            '<div class="gw-card-rodape">' + rodape + '</div></div>';
    }

    function findMatch(bracket, id) {
        if (bracket.third && bracket.third.id === id) return bracket.third;
        for (var i = 0; i < bracket.rounds.length; i++) {
            var ms = bracket.rounds[i].matches;
            for (var j = 0; j < ms.length; j++) if (ms[j].id === id) return ms[j];
        }
        return null;
    }

    function mountChave(o) {
        var tabsEl = document.querySelector(o.tabs || '.nav-rodadas');
        var boxEl = document.getElementById(o.container || 'container-confrantos');
        var campEl = document.getElementById(o.champion || 'gw-campeao');
        var modal = document.getElementById('modal-confronto');
        var state = { view: null, round: 1 };

        function renderTabs() {
            var rounds = state.view.bracket.rounds;
            tabsEl.innerHTML = rounds.map(function (r) {
                return '<button class="btn-rodada' + (r.index === state.round ? ' ativo' : '') + '" data-rodada="' + r.index + '">' + esc(r.nome) +
                    (r.formato ? ' <small>' + r.formato + '</small>' : '') + '</button>';
            }).join('');
        }

        function renderRound() {
            var v = state.view, b = v.bracket;
            var r = b.rounds[state.round - 1];
            if (!r) { boxEl.innerHTML = '<p class="gw-vazio">Nenhum confronto disponível</p>'; return; }
            var head = '<div class="gw-fase"><strong>' + esc(r.nome) + '</strong>' +
                (r.fase && r.fase !== r.nome ? ' · ' + esc(r.fase) : '') +
                ' · ' + r.matches.length + (r.matches.length === 1 ? ' confronto' : ' confrontos') +
                (r.formato ? ' · <span class="gw-md">' + r.formato + '</span>' : '') + '</div>';
            var html = head + '<div class="grid-jogos">' + r.matches.map(function (m) { return cardHTML(m, v.config); }).join('') + '</div>';
            if (b.third && r.index === b.rounds.length) {
                html += '<div class="gw-fase gw-fase-3"><strong>DISPUTA DE 3º LUGAR</strong>' + (b.third.formato ? ' · <span class="gw-md">' + b.third.formato + '</span>' : '') +
                    '</div><div class="grid-jogos">' + cardHTML(b.third, v.config) + '</div>';
            }
            boxEl.innerHTML = html;
        }

        function renderCampeao() {
            if (!campEl) return;
            var b = state.view.bracket;
            if (!b.champion) { campEl.hidden = true; campEl.innerHTML = ''; return; }
            var c = b.champion;
            var linhas = '';
            if (b.runnerUp) linhas += '<div>🥈 2º lugar: <strong>' + esc(b.runnerUp.nome) + '</strong></div>';
            if (b.third && b.third.winner) linhas += '<div>🥉 3º lugar: <strong>' + esc(b.third.winner.nome) + '</strong></div>';
            campEl.hidden = false;
            campEl.innerHTML = '<div class="gw-campeao-box"><div class="gw-trofeu">🏆</div><div class="gw-campeao-tit">CAMPEÃO</div>' +
                '<img src="' + esc(c.img) + '" alt="' + esc(c.nome) + '" data-fallback="' + esc(placeholder(String(c.id), 90)) + '">' +
                '<div class="gw-campeao-nome">' + esc(c.nome) + '</div>' + linhas + '</div>';
        }

        function openModal(m) {
            var v = state.view, tb = document.getElementById('modal-times'), info = document.getElementById('modal-info');
            var sa = slot(m.a, false, 80), sb = slot(m.b, m.bye, 80);
            var rotulo = m.third ? 'DISPUTA DE 3º LUGAR' : (m.round === v.bracket.rounds.length ? 'FINAL' : 'RODADA ' + m.round + ' - CONFRONTO ' + (m.index + 1));
            document.getElementById('modal-titulo').textContent = '⚔️ ' + rotulo;
            function mt(s) {
                return '<div class="modal-time"><img src="' + esc(s.img) + '" alt="' + esc(s.nome) + '"' + (s.fallback ? ' data-fallback="' + esc(s.fallback) + '"' : '') + '><span>' + esc(s.nome) + '</span></div>';
            }
            tb.innerHTML = mt(sa) + '<div class="modal-vs">' + (placarTxt(m) || 'VS') + '</div>' + mt(sb);
            var status = m.bye ? 'Avança automaticamente (BYE)'
                : m.winner ? '✅ Finalizado — vencedor: <strong>' + esc(m.winner.nome) + '</strong>'
                : (m.a && m.b ? '⏳ Aguardando resultado' : '⏳ Aguardando definição dos confrontos anteriores');
            info.innerHTML = '<p>' + status + '</p>' +
                (m.bye ? '' : '<p>📅 ' + esc(m.horario || v.config.horarioPadrao || 'A definir') + '</p>') +
                (m.formato ? '<p>🎯 Formato: ' + m.formato + (m.formato === 'MD3' ? ' (vence quem ganhar 2 partidas)' : ' (vence quem ganhar 3 partidas)') + '</p>' : '') +
                '<p>Clique fora para fechar</p>';
            modal.classList.add('mostrar');
        }

        // fallback de imagem (sem atributos inline, compatível com CSP)
        document.addEventListener('error', function (e) {
            var t = e.target;
            if (t && t.tagName === 'IMG' && t.getAttribute('data-fallback') && !t.getAttribute('data-fb-done')) {
                t.setAttribute('data-fb-done', '1');
                t.src = t.getAttribute('data-fallback');
            }
        }, true);

        tabsEl.addEventListener('click', function (e) {
            var btn = e.target.closest('.btn-rodada');
            if (!btn) return;
            state.round = parseInt(btn.getAttribute('data-rodada'), 10);
            renderTabs(); renderRound();
        });
        boxEl.addEventListener('click', function (e) {
            var card = e.target.closest('.card-jogo');
            if (!card || !state.view) return;
            var m = findMatch(state.view.bracket, card.getAttribute('data-mid'));
            if (m) openModal(m);
        });
        modal.querySelector('.fechar-modal').addEventListener('click', function () { modal.classList.remove('mostrar'); });
        modal.addEventListener('click', function (e) { if (e.target === modal) modal.classList.remove('mostrar'); });

        return GW.subscribe(o.camp, function (view) {
            state.view = view;
            if (state.round > view.bracket.rounds.length) state.round = 1;
            GW.bind(view);
            renderTabs(); renderRound(); renderCampeao();
            if (o.onView) o.onView(view);
        });
    }

    GW.mountChave = mountChave;
})(window);
