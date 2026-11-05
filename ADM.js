/* ==========================================================
   GAMING WORLD 2026 — PAINEL ADM (2v2 e 5v5, dados independentes)
   Requer Firebase (firebase-config.js). Login por e-mail/senha; quem pode
   gravar é definido nas regras do Firestore (firestore.rules).
   ========================================================== */
(function () {
    'use strict';
    var GW = window.GW, esc = GW.esc;
    function $(id) { return document.getElementById(id); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    var fbh = null;
    var S = { camp: '2v2', secao: 'inscricoes', view: null, insc: [], filtro: 'todas', unsubView: null, unsubInsc: null, dirty: {} };
    var SECOES = ['inscricoes', 'equipes', 'confrontos', 'config'];

    /* ---------- utilidades ---------- */
    var toastTimer;
    function toast(msg, erro) {
        var t = $('toast');
        t.textContent = msg;
        t.className = 'toast mostrar' + (erro ? ' erro' : '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.className = 'toast'; }, 3800);
    }
    function falha(err) {
        console.error(err);
        var m = (err && err.code === 'permission-denied')
            ? 'Sem permissão: este e-mail não é administrador nas regras do Firestore.'
            : 'Erro: ' + ((err && err.message) || err);
        toast(m, true);
    }
    function path(sub) { return 'campeonatos/' + S.camp + (sub ? '/' + sub : ''); }
    function del() { return fbh.fb.firestore.FieldValue.delete(); }
    function safeImg(src) {
        src = String(src || '');
        return (/^data:image\/(jpeg|png|webp);base64,/.test(src) || /^style5?\/[\w.-]+$/.test(src)) ? src : '';
    }
    function fmtData(ts) {
        try { var d = ts && ts.toDate ? ts.toDate() : null; return d ? d.toLocaleString('pt-BR') : 'agora'; } catch (e) { return ''; }
    }
    function zapUrl(tel) {
        var d = String(tel || '').replace(/\D/g, '');
        if (d.length >= 10 && d.length <= 11) d = '55' + d;
        return d ? 'https://wa.me/' + d : '';
    }
    function temResultados() { return S.view && Object.keys(S.view.partidas).length > 0; }

    /* ---------- login / sessão ---------- */
    function mostrarTela(nome) {
        ['tela-sem-firebase', 'tela-login', 'tela-painel'].forEach(function (id) { $(id).hidden = (id !== nome); });
    }
    function parar() {
        if (S.unsubView) S.unsubView(); if (S.unsubInsc) S.unsubInsc();
        S.unsubView = S.unsubInsc = null; S.view = null; S.insc = [];
    }
    function iniciar() {
        parar();
        S.dirty = {};
        S.unsubView = GW.subscribe(S.camp, function (v) { S.view = v; renderTudo(); });
        S.unsubInsc = fbh.db.collection(path('inscricoes')).onSnapshot(function (qs) {
            S.insc = [];
            qs.forEach(function (d) { var o = d.data(); o._id = d.id; S.insc.push(o); });
            S.insc.sort(function (a, b) { return ((b.criadoEm && b.criadoEm.seconds) || 9e12) - ((a.criadoEm && a.criadoEm.seconds) || 9e12); });
            renderTudo();
        }, falha);
    }

    /* ---------- render ---------- */
    function renderTudo() {
        if (!S.view) return;
        renderResumo();
        var fn = { inscricoes: renderInscricoes, equipes: renderEquipes, confrontos: renderConfrontos, config: renderConfig }[S.secao];
        if (!S.dirty[S.secao]) fn();
    }
    function salvou(sec, msg) { S.dirty[sec] = false; renderTudo(); if (msg) toast(msg); }
    function renderSecaoAgora(nome) { S.dirty[nome] = false; ({ inscricoes: renderInscricoes, equipes: renderEquipes, confrontos: renderConfrontos, config: renderConfig })[nome](); }

    function renderResumo() {
        var v = S.view, c = v.config;
        var pend = S.insc.filter(function (i) { return i.status === 'pendente'; }).length;
        var apr = S.insc.filter(function (i) { return i.status === 'aprovada'; }).length;
        var pag = S.insc.filter(function (i) { return i.pagamento === 'confirmado'; }).length;
        var vagas = (typeof c.vagasRestantes === 'number') ? c.vagasRestantes : '—';
        function n(b, s) { return '<div class="num"><b>' + esc(b) + '</b><small>' + esc(s) + '</small></div>'; }
        $('resumo').innerHTML = n(S.insc.length, 'Inscrições') + n(pend, 'Pendentes') + n(apr, 'Aprovadas') + n(pag, 'Pagos') +
            n(vagas, 'Vagas restantes') + n(v.teams.length, 'Equipes na chave') + n(GW.brl(c.taxa), 'Taxa');
    }

    /* --- Inscrições --- */
    function renderInscricoes() {
        var v = S.view, el = $('secao-inscricoes');
        var lista = S.insc.filter(function (i) { return S.filtro === 'todas' || i.status === S.filtro || (S.filtro === 'sem-pagamento' && i.pagamento !== 'confirmado'); });
        var opts = [['todas', 'Todas'], ['pendente', 'Pendentes'], ['aprovada', 'Aprovadas'], ['rejeitada', 'Rejeitadas'], ['sem-pagamento', 'Pagamento não confirmado']]
            .map(function (o) { return '<option value="' + o[0] + '"' + (o[0] === S.filtro ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('');
        var slots = v.teams.map(function (t) { return '<option value="' + t.id + '">Vaga ' + t.id + ' — ' + esc(t.nome) + '</option>'; }).join('');

        var html = '<div class="barra"><select id="filtro-insc" aria-label="Filtrar">' + opts + '</select>' +
            '<span class="nota" style="margin:0">' + lista.length + ' de ' + S.insc.length + ' inscrições (' + esc(S.camp) + ')</span></div>';
        if (!lista.length) html += '<div class="vazio">Nenhuma inscrição por aqui.</div>';

        lista.forEach(function (i) {
            var jog = (i.jogadores || []).map(function (j) {
                return '<span class="' + (j.tipo === 'reserva' ? 'res' : '') + '">' + (j.tipo === 'reserva' ? '🛡️ ' : '🎮 ') + esc(j.nick) + ' · ID ' + esc(j.id) + '</span>';
            }).join('');
            var logo = safeImg(i.logo), comp = safeImg(i.comprovante);
            var zap = zapUrl(i.contato);
            var valorDiv = (i.valor != null && Number(i.valor) !== Number(v.config.taxa)) ? ' <span class="sel sel-alerta">valor pago ' + esc(GW.brl(i.valor)) + ' ≠ taxa atual</span>' : '';
            html += '<article class="insc" data-id="' + esc(i._id) + '">' +
                '<img class="insc-logo" src="' + esc(logo) + '" alt="Logo ' + esc(i.nomeEquipe) + '">' +
                '<div><div class="insc-cab"><h3>' + esc(i.nomeEquipe) + '</h3>' +
                '<span class="sel sel-' + esc(i.status) + '">' + esc(i.status) + '</span>' +
                '<span class="sel sel-' + esc(i.pagamento) + '">pagamento: ' + esc(i.pagamento) + '</span>' + valorDiv +
                '<small>' + esc(fmtData(i.criadoEm)) + '</small></div>' +
                (i.capitao ? '<div class="nota" style="margin:0">👑 Capitão: ' + esc(i.capitao) + '</div>' : '') +
                '<div class="jogadores">' + jog + '</div>' +
                '<div class="nota" style="margin:0">📱 ' + (zap ? '<a href="' + esc(zap) + '" target="_blank" rel="noopener" style="color:#2ec5ff">' + esc(i.contato) + '</a>' : esc(i.contato)) +
                (i.idTransacao ? ' · 🧾 ' + esc(i.idTransacao) : '') + '</div>' +
                '<div class="insc-acoes">' +
                (comp ? '<img class="comp-miniatura" data-acao="ver" data-src="' + esc(comp) + '" src="' + esc(comp) + '" alt="Comprovante" title="Ver comprovante">' : '<span class="sel sel-alerta">sem comprovante</span>') +
                '<button class="btn btn-peq btn-ok" data-acao="pagamento">' + (i.pagamento === 'confirmado' ? '↩ Desfazer pagamento' : '💰 Confirmar pagamento') + '</button>' +
                '<button class="btn btn-peq btn-ok" data-acao="aprovar">✅ Aprovar</button>' +
                '<button class="btn btn-peq btn-perigo" data-acao="rejeitar">❌ Rejeitar</button>' +
                (i.status !== 'pendente' ? '<button class="btn btn-peq btn-sec" data-acao="pendente">↩ Voltar p/ pendente</button>' : '') +
                '<select data-slot aria-label="Vaga na chave">' + slots + '</select>' +
                '<button class="btn btn-peq btn-neon" data-acao="chave">📌 Enviar p/ chave</button>' +
                '<button class="btn btn-peq btn-perigo" data-acao="excluir">🗑</button>' +
                '</div></div></article>';
        });
        el.innerHTML = html;
    }

    function acaoInscricao(btn) {
        var card = btn.closest('.insc'), id = card.getAttribute('data-id');
        var i = S.insc.filter(function (x) { return x._id === id; })[0];
        var ref = fbh.db.doc(path('inscricoes/' + id));
        var a = btn.getAttribute('data-acao'), p;
        if (a === 'ver') { $('visualizador-img').src = btn.getAttribute('data-src'); $('visualizador').hidden = false; return; }
        if (a === 'pagamento') p = ref.update({ pagamento: i.pagamento === 'confirmado' ? 'aguardando' : 'confirmado' });
        else if (a === 'aprovar') {
            if (i.pagamento !== 'confirmado' && !confirm('O pagamento ainda NÃO foi confirmado. Aprovar mesmo assim?')) return;
            p = ref.update({ status: 'aprovada' });
        } else if (a === 'rejeitar') { if (!confirm('Rejeitar a inscrição de "' + i.nomeEquipe + '"?')) return; p = ref.update({ status: 'rejeitada' }); }
        else if (a === 'pendente') p = ref.update({ status: 'pendente' });
        else if (a === 'excluir') { if (!confirm('Excluir DEFINITIVAMENTE a inscrição de "' + i.nomeEquipe + '"?')) return; p = ref.delete(); }
        else if (a === 'chave') {
            var slot = parseInt(card.querySelector('[data-slot]').value, 10);
            var atual = S.view.teams[slot - 1];
            if (atual.custom && !confirm('A vaga ' + slot + ' já está ocupada por "' + atual.nome + '". Substituir por "' + i.nomeEquipe + '"?')) return;
            var dados = { id: slot, nome: i.nomeEquipe, inscricaoId: id };
            var lg = safeImg(i.logo); if (lg) dados.img = lg;
            p = fbh.db.doc(path('equipes/' + slot)).set(dados, { merge: true }).then(function () { toast('Equipe enviada para a vaga ' + slot + ' da chave.'); });
        }
        if (p) p.then(function () { if (a !== 'chave') toast('Atualizado.'); }).catch(falha);
    }

    /* --- Equipes --- */
    function dadosDoSlot(slot) {
        var d = (S.view.docs || {})[slot] || {};
        return { nome: d.nome, img: d.img, inscricaoId: d.inscricaoId };
    }
    function gravarSlot(batch, slot, d) {
        var ref = fbh.db.doc(path('equipes/' + slot));
        if (!d.nome && !d.img) { batch.delete(ref); return; }
        var o = { id: slot };
        if (d.nome) o.nome = d.nome; if (d.img) o.img = d.img; if (d.inscricaoId) o.inscricaoId = d.inscricaoId;
        batch.set(ref, o);
    }
    function renderEquipes() {
        var v = S.view, el = $('secao-equipes'), trava = temResultados();
        var html = '<div class="barra"><button class="btn btn-sec btn-peq" data-eq="embaralhar"' + (trava ? ' disabled' : '') + '>🎲 Embaralhar ordem</button>' +
            '<span class="nota" style="margin:0">A ordem das vagas define os confrontos da 1ª rodada (1×2, 3×4…).' +
            (trava ? ' <strong>Há resultados lançados — reordenar está bloqueado.</strong>' : '') + '</span></div>' +
            '<table class="tabela"><thead><tr><th>#</th><th>Logo</th><th>Nome</th><th>Ações</th></tr></thead><tbody>';
        v.teams.forEach(function (t, k) {
            html += '<tr data-slot="' + t.id + '"><td class="eq-num">' + t.id + '</td>' +
                '<td><img class="eq-logo" src="' + esc(safeImg(t.img)) + '" alt=""></td>' +
                '<td><input type="text" maxlength="40" value="' + esc(t.nome) + '" data-nome aria-label="Nome da vaga ' + t.id + '"></td>' +
                '<td><div class="eq-acoes">' +
                '<button class="btn btn-peq" data-eq="nome">💾 Nome</button>' +
                '<label class="btn btn-peq btn-sec" style="cursor:pointer;margin:0">🖼 Logo<input type="file" accept="image/*" data-logo></label>' +
                '<button class="btn btn-peq btn-sec" data-eq="logo-padrao" title="Voltar à imagem padrão">↺</button>' +
                '<button class="btn btn-peq btn-sec" data-eq="subir"' + (trava || k === 0 ? ' disabled' : '') + '>↑</button>' +
                '<button class="btn btn-peq btn-sec" data-eq="descer"' + (trava || k === v.teams.length - 1 ? ' disabled' : '') + '>↓</button>' +
                '</div></td></tr>';
        });
        el.innerHTML = html + '</tbody></table>';
    }
    function trocarSlots(a, b) {
        var da = dadosDoSlot(a), db = dadosDoSlot(b), batch = fbh.db.batch();
        gravarSlot(batch, a, db); gravarSlot(batch, b, da);
        return batch.commit();
    }
    function acaoEquipe(btn) {
        var tr = btn.closest('tr'), a = btn.getAttribute('data-eq'), slot = tr ? parseInt(tr.getAttribute('data-slot'), 10) : 0, p;
        if (a === 'nome') {
            var nome = tr.querySelector('[data-nome]').value.trim();
            var o = { id: slot }; o.nome = nome ? nome : del();
            p = fbh.db.doc(path('equipes/' + slot)).set(o, { merge: true });
        } else if (a === 'logo-padrao') {
            p = fbh.db.doc(path('equipes/' + slot)).set({ id: slot, img: del() }, { merge: true });
        } else if (a === 'subir') p = trocarSlots(slot, slot - 1);
        else if (a === 'descer') p = trocarSlots(slot, slot + 1);
        else if (a === 'embaralhar') {
            if (!confirm('Embaralhar a ordem de TODAS as equipes da chave ' + S.camp + '?')) return;
            var n = S.view.teams.length, ord = [], i;
            for (i = 1; i <= n; i++) ord.push(dadosDoSlot(i));
            for (i = n - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var tmp = ord[i]; ord[i] = ord[j]; ord[j] = tmp; }
            var batch = fbh.db.batch();
            ord.forEach(function (d, k) { gravarSlot(batch, k + 1, d); });
            p = batch.commit();
        }
        if (p) p.then(function () { salvou('equipes', 'Equipes atualizadas.'); }).catch(falha);
    }

    /* --- Confrontos --- */
    function linhaPartida(m, label) {
        var travada = m.bye || !m.a || !m.b;
        function tm(t, venc) {
            return t ? '<div class="tm ' + (venc ? 'venc' : '') + '"><img src="' + esc(safeImg(t.img)) + '" alt=""><span>' + esc(t.nome) + '</span></div>'
                : '<div class="tm"><span style="color:#777">' + (m.bye ? 'BYE' : 'A definir') + '</span></div>';
        }
        var venc = m.winner ? (m.winner === m.a ? 'A' : 'B') : '';
        var optsV = '<option value="">— vencedor —</option>' +
            (m.a ? '<option value="A"' + (venc === 'A' ? ' selected' : '') + '>' + esc(m.a.nome) + '</option>' : '') +
            (m.b ? '<option value="B"' + (venc === 'B' ? ' selected' : '') + '>' + esc(m.b.nome) + '</option>' : '');
        var dis = travada ? ' disabled' : '';
        return '<div class="partida' + (travada ? ' travada' : '') + '" data-mid="' + esc(m.id) + '"><div class="rot">' + esc(label) + (m.bye ? ' · BYE — avança automaticamente' : '') + '</div>' +
            tm(m.a, venc === 'A') +
            '<input type="number" min="0" max="99" data-pa value="' + (m.placarA != null ? m.placarA : '') + '" aria-label="Placar A"' + dis + '>' +
            '<input type="number" min="0" max="99" data-pb value="' + (m.placarB != null ? m.placarB : '') + '" aria-label="Placar B"' + dis + '>' +
            tm(m.b, venc === 'B') +
            '<select data-venc class="col-extra"' + dis + '>' + optsV + '</select>' +
            '<input type="text" data-hor class="col-extra" maxlength="40" placeholder="Horário (ex: 20/11 21:00)" value="' + esc(m.horario || '') + '"' + (m.bye ? ' disabled' : '') + '>' +
            '<button class="btn btn-peq col-extra" data-pt="salvar"' + (m.bye ? ' disabled' : '') + '>💾 Salvar</button></div>';
    }
    function renderConfrontos() {
        var b = S.view.bracket, el = $('secao-confrontos');
        var html = '<p class="nota">Lance o placar e escolha o vencedor (ou deixe em branco: vence o maior placar). O vencedor avança automaticamente para a rodada seguinte. Ao corrigir um resultado, as rodadas seguintes se ajustam sozinhas.</p>';
        b.rounds.forEach(function (r) {
            html += '<h3 class="rodada-tit">' + esc(r.nome) + (r.fase && r.fase !== r.nome ? ' · ' + esc(r.fase) : '') + (r.formato ? '<small>' + r.formato + '</small>' : '') + '</h3>';
            r.matches.forEach(function (m) { html += linhaPartida(m, r.nome + ' · confronto ' + (m.index + 1)); });
            if (b.third && r.index === b.rounds.length) html += '<h3 class="rodada-tit">DISPUTA DE 3º LUGAR' + (b.third.formato ? '<small>' + b.third.formato + '</small>' : '') + '</h3>' + linhaPartida(b.third, 'Disputa de 3º lugar');
        });
        if (b.champion) html = '<div class="cartao" style="border-color:rgba(255,215,0,.5)"><h2>🏆 Campeão: ' + esc(b.champion.nome) + '</h2>' + (b.runnerUp ? '<p>🥈 Vice: ' + esc(b.runnerUp.nome) + '</p>' : '') + (b.third && b.third.winner ? '<p>🥉 3º lugar: ' + esc(b.third.winner.nome) + '</p>' : '') + '</div>' + html;
        html += '<div class="cartao zona-perigo" style="margin-top:26px"><h2>Zona de perigo</h2><p>Remove todos os resultados e horários lançados na chave ' + esc(S.camp) + ' (não afeta equipes nem inscrições).</p>' +
            '<button class="btn btn-perigo" data-pt="limpar-tudo">🗑 Limpar todos os resultados do ' + esc(S.camp) + '</button></div>';
        el.innerHTML = html;
    }
    function acaoPartida(btn, e) {
        var a = btn.getAttribute('data-pt');
        if (a === 'limpar-tudo') {
            if (!confirm('Apagar TODOS os resultados e horários do ' + S.camp + '?')) return;
            var ids = Object.keys(S.view.partidas), batch = fbh.db.batch();
            ids.forEach(function (id) { batch.delete(fbh.db.doc(path('partidas/' + id))); });
            batch.commit().then(function () { salvou('confrontos', 'Resultados apagados.'); }).catch(falha);
            return;
        }
        var row = btn.closest('.partida'), mid = row.getAttribute('data-mid');
        var b = S.view.bracket, m = (b.third && b.third.id === mid) ? b.third : null;
        if (!m) b.rounds.forEach(function (r) { r.matches.forEach(function (x) { if (x.id === mid) m = x; }); });
        var pa = row.querySelector('[data-pa]').value, pb = row.querySelector('[data-pb]').value;
        var sel = row.querySelector('[data-venc]').value, hor = row.querySelector('[data-hor]').value.trim();
        var na = pa === '' ? null : Number(pa), nb = pb === '' ? null : Number(pb);
        if (!sel && na != null && nb != null && na !== nb) sel = na > nb ? 'A' : 'B';
        else if (sel && na != null && nb != null && na !== nb && ((sel === 'A') !== (na > nb))) {
            if (!confirm('O vencedor escolhido diverge do placar. Salvar mesmo assim?')) return;
        }
        var ref = fbh.db.doc(path('partidas/' + mid)), p;
        if (!sel && na == null && nb == null && !hor) p = ref.delete();
        else {
            var rec = { a: m.a.id, b: m.b.id, winner: sel === 'A' ? m.a.id : sel === 'B' ? m.b.id : null, placarA: na, placarB: nb, horario: hor };
            p = ref.set(rec);
        }
        p.then(function () { salvou('confrontos', sel ? 'Resultado salvo — vencedor avançou.' : 'Salvo.'); }).catch(falha);
    }

    /* --- Configurações --- */
    function renderConfig() {
        var c = S.view.config, el = $('secao-config');
        var prem = (c.premios || []).map(function (p, k) { return premioLinha(p, k); }).join('');
        el.innerHTML = '<div class="cartao"><h2>⚙️ Configurações do campeonato ' + esc(S.camp) + '</h2>' +
            '<form id="form-config" class="grade-form" novalidate>' +
            '<div><label for="cfg-taxa">Taxa de inscrição (R$)</label><input type="number" id="cfg-taxa" min="0" step="0.01" value="' + esc(c.taxa) + '"><small>Aparece na inscrição, no PIX e nas regras.</small></div>' +
            '<div><label for="cfg-num">Quantidade de equipes</label><input type="number" id="cfg-num" min="2" max="' + c.maxEquipes + '" value="' + esc(S.view.teams.length) + '"><small>A chave é montada com BYE automático se não for potência de 2.</small></div>' +
            '<div><label for="cfg-vagas">Vagas restantes</label><input type="number" id="cfg-vagas" min="0" value="' + (typeof c.vagasRestantes === 'number' ? c.vagasRestantes : '') + '" placeholder="vazio = não mostrar número"><small>0 = “vagas esgotadas” e fecha a inscrição.</small></div>' +
            '<div><label for="cfg-hor">Horário padrão das partidas</label><input type="text" id="cfg-hor" maxlength="60" value="' + esc(c.horarioPadrao) + '"></div>' +
            '<div class="full"><label for="cfg-discord">Link do Discord oficial</label><input type="url" id="cfg-discord" maxlength="200" placeholder="https://discord.gg/..." value="' + esc(c.discordLink) + '"></div>' +
            '<div class="full"><label for="cfg-aviso">Aviso de urgência</label><input type="text" id="cfg-aviso" maxlength="200" value="' + esc(c.aviso) + '"><small>A primeira frase (até o “!”) aparece em destaque. Não coloque número de vagas aqui — use “Vagas restantes”.</small></div>' +
            '<div class="full"><label for="cfg-obs">Observação sobre a premiação</label><textarea id="cfg-obs" rows="3" maxlength="400">' + esc(c.obsPremios) + '</textarea></div>' +
            '<div class="full"><label>Premiação</label><div id="premios-lista">' + prem + '</div><button type="button" class="btn btn-sec btn-peq" data-cfg="add-premio" style="width:auto;margin-top:4px">+ Adicionar colocação</button></div>' +
            '<div><label class="chk"><input type="checkbox" id="cfg-abertas"' + (c.inscricoesAbertas !== false ? ' checked' : '') + '> Inscrições abertas</label></div>' +
            '<div><label class="chk"><input type="checkbox" id="cfg-terceiro"' + (c.disputaTerceiro ? ' checked' : '') + '> Disputa de 3º lugar</label></div>' +
            '<div class="full"><button type="submit" class="btn">💾 Salvar configurações</button></div></form></div>';
    }
    function premioLinha(p, k) {
        return '<div class="premio-linha" data-prem><input type="text" data-p="lugar" maxlength="20" value="' + esc(p.lugar) + '" aria-label="Colocação">' +
            '<input type="text" data-p="valor" maxlength="40" value="' + esc(p.valor) + '" aria-label="Valor">' +
            '<input type="text" data-p="extra" maxlength="80" value="' + esc(p.extra) + '" placeholder="Extra (opcional)" aria-label="Extra">' +
            '<button type="button" class="btn btn-peq btn-perigo" data-cfg="del-premio" aria-label="Remover">✕</button></div>';
    }
    function salvarConfig() {
        var taxa = parseFloat($('cfg-taxa').value), num = parseInt($('cfg-num').value, 10), vg = $('cfg-vagas').value.trim();
        var max = S.view.config.maxEquipes;
        if (isNaN(taxa) || taxa < 0) return toast('Informe uma taxa válida.', true);
        if (isNaN(num) || num < 2 || num > max) return toast('Quantidade de equipes: de 2 a ' + max + '.', true);
        var vagas = null;
        if (vg !== '') { vagas = parseInt(vg, 10); if (isNaN(vagas) || vagas < 0) return toast('Vagas restantes inválidas.', true); }
        if (num !== S.view.teams.length && temResultados() && !confirm('Já existem resultados lançados. Mudar a quantidade de equipes altera a chave e pode invalidar resultados. Continuar?')) return;
        var premios = qsa('[data-prem]', $('premios-lista')).map(function (r) {
            return { lugar: r.querySelector('[data-p=lugar]').value.trim(), valor: r.querySelector('[data-p=valor]').value.trim(), extra: r.querySelector('[data-p=extra]').value.trim() };
        }).filter(function (p) { return p.lugar || p.valor; });
        var cfg = {
            taxa: taxa, numEquipes: num, vagasRestantes: vagas,
            inscricoesAbertas: $('cfg-abertas').checked, disputaTerceiro: $('cfg-terceiro').checked,
            horarioPadrao: $('cfg-hor').value.trim() || 'A definir', discordLink: $('cfg-discord').value.trim(),
            aviso: $('cfg-aviso').value.trim(), obsPremios: $('cfg-obs').value.trim(), premios: premios
        };
        if (cfg.discordLink && !/^https:\/\//.test(cfg.discordLink)) return toast('O link do Discord deve começar com https://', true);
        fbh.db.doc(path()).set(cfg, { merge: true }).then(function () { salvou('config', 'Configurações salvas.'); }).catch(falha);
    }

    /* ---------- eventos ---------- */
    function ligar() {
        $('form-login').addEventListener('submit', function (e) {
            e.preventDefault();
            $('login-erro').textContent = '';
            $('btn-entrar').disabled = true;
            fbh.auth.signInWithEmailAndPassword($('login-email').value.trim(), $('login-senha').value)
                .catch(function () { $('login-erro').textContent = 'E-mail ou senha inválidos.'; })
                .then(function () { $('btn-entrar').disabled = false; });
        });
        $('btn-reset').addEventListener('click', function () {
            var email = $('login-email').value.trim();
            if (!email) { $('login-erro').textContent = 'Digite o e-mail acima para receber o link de redefinição.'; return; }
            fbh.auth.sendPasswordResetEmail(email).then(function () { $('login-erro').textContent = ''; toast('Enviamos o link de redefinição para o seu e-mail.'); })
                .catch(function () { $('login-erro').textContent = 'Não foi possível enviar o e-mail.'; });
        });
        $('btn-sair').addEventListener('click', function () { fbh.auth.signOut(); });

        $('abas-camp').addEventListener('click', function (e) {
            var b = e.target.closest('.aba'); if (!b || b.getAttribute('data-camp') === S.camp) return;
            S.camp = b.getAttribute('data-camp');
            qsa('.aba', $('abas-camp')).forEach(function (x) { x.classList.toggle('ativa', x === b); });
            S.filtro = 'todas'; iniciar();
        });
        $('abas-secao').addEventListener('click', function (e) {
            var b = e.target.closest('.aba'); if (!b) return;
            S.secao = b.getAttribute('data-secao');
            qsa('.aba', $('abas-secao')).forEach(function (x) { x.classList.toggle('ativa', x === b); });
            SECOES.forEach(function (s) { $('secao-' + s).hidden = (s !== S.secao); });
            if (S.view) renderSecaoAgora(S.secao);
        });

        // marca a seção como "em edição" para o tempo real não apagar o que está sendo digitado
        ['equipes', 'confrontos', 'config'].forEach(function (s) {
            $('secao-' + s).addEventListener('input', function () { S.dirty[s] = true; });
        });

        $('secao-inscricoes').addEventListener('change', function (e) {
            if (e.target.id === 'filtro-insc') { S.filtro = e.target.value; renderInscricoes(); }
        });
        $('secao-inscricoes').addEventListener('click', function (e) {
            var b = e.target.closest('[data-acao]'); if (b) acaoInscricao(b);
        });

        var eq = $('secao-equipes');
        eq.addEventListener('click', function (e) { var b = e.target.closest('[data-eq]'); if (b && !b.disabled) acaoEquipe(b); });
        eq.addEventListener('change', function (e) {
            if (!e.target.matches('[data-logo]')) return;
            var tr = e.target.closest('tr'), slot = parseInt(tr.getAttribute('data-slot'), 10), f = e.target.files[0];
            if (!f) return;
            GW.compressImage(f, 220, 70000).then(function (img) {
                return fbh.db.doc(path('equipes/' + slot)).set({ id: slot, img: img }, { merge: true });
            }).then(function () { salvou('equipes', 'Logo da vaga ' + slot + ' atualizada.'); }).catch(function (err) { falha(err); });
        });

        var cf = $('secao-confrontos');
        cf.addEventListener('click', function (e) { var b = e.target.closest('[data-pt]'); if (b && !b.disabled) acaoPartida(b); });
        cf.addEventListener('input', function (e) {
            if (!(e.target.matches('[data-pa]') || e.target.matches('[data-pb]'))) return;
            var row = e.target.closest('.partida'), pa = row.querySelector('[data-pa]').value, pb = row.querySelector('[data-pb]').value;
            if (pa !== '' && pb !== '' && Number(pa) !== Number(pb)) row.querySelector('[data-venc]').value = Number(pa) > Number(pb) ? 'A' : 'B';
        });

        var cg = $('secao-config');
        cg.addEventListener('submit', function (e) { e.preventDefault(); salvarConfig(); });
        cg.addEventListener('click', function (e) {
            var b = e.target.closest('[data-cfg]'); if (!b) return;
            if (b.getAttribute('data-cfg') === 'add-premio') {
                var lista = $('premios-lista');
                if (lista.children.length >= 6) return toast('Máximo de 6 colocações.', true);
                lista.insertAdjacentHTML('beforeend', premioLinha({ lugar: (lista.children.length + 1) + 'º Lugar', valor: '', extra: '' }));
            } else b.closest('[data-prem]').remove();
            S.dirty.config = true;
        });

        $('visualizador').addEventListener('click', function () { $('visualizador').hidden = true; });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('visualizador').hidden = true; });
    }

    /* ---------- início ---------- */
    GW.initFirebase().then(function (f) {
        if (!f) { mostrarTela('tela-sem-firebase'); return; }
        fbh = f;
        ligar();
        f.auth.onAuthStateChanged(function (user) {
            if (user) {
                $('adm-usuario').hidden = false;
                $('adm-email').textContent = user.email;
                mostrarTela('tela-painel');
                iniciar();
            } else {
                parar();
                $('adm-usuario').hidden = true;
                mostrarTela('tela-login');
            }
        });
    });
})();
