/* ==========================================================
   GAMING WORLD 2026 — NÚCLEO COMPARTILHADO (2v2 e 5v5)
   - Configuração padrão de cada campeonato (independentes)
   - Firebase/Firestore (carregado só se firebase-config.js estiver preenchido)
   - Motor da chave eliminatória (com BYE para qualquer nº de equipes)
   - Utilitários: PIX, cópia, compressão de imagem, envio de inscrição
   Caminhos no Firestore (separados por modalidade):
     campeonatos/{2v2|5v5}                 -> configuração
     campeonatos/{camp}/equipes/{n}        -> nome e logo de cada vaga
     campeonatos/{camp}/partidas/{id}      -> resultados / horários
     campeonatos/{camp}/inscricoes/{auto}  -> inscrições recebidas
   ========================================================== */
(function (global) {
    'use strict';

    var FB_VERSION = '10.12.2';
    var WHATSAPP = '553172189691';

    var PIX = {
        chave: 'gamingword2026@gmail.com',
        nome: 'Gemisson Laion Souza Morais',
        banco: 'Mercado Pago'
    };

    /* ---------- padrões de cada campeonato (NÃO compartilhados) ---------- */
    var DEFAULTS = {
        '2v2': {
            id: '2v2',
            titulo: 'Campeonato 2v2',
            entidade: 'dupla',
            taxa: 20,
            numEquipes: 16,
            vagasRestantes: null,          // null = não exibir número (a administração informa)
            inscricoesAbertas: true,
            disputaTerceiro: false,
            usaMD: false,
            horarioPadrao: 'A definir',
            discordLink: '',
            premios: [
                { lugar: '1º Lugar', valor: 'R$ 140,00', extra: '' },
                { lugar: '2º Lugar', valor: 'R$ 60,00', extra: '' },
                { lugar: '3º Lugar', valor: 'R$ 20,00', extra: '+ vaga garantida para a próxima edição' }
            ],
            obsPremios: '',
            aviso: 'POUCAS VAGAS DISPONÍVEIS! Inscreva sua dupla agora e garanta sua participação.',
            rotulo: 'CLÃ',
            imgDir: 'style/',
            imgTotal: 16,
            maxEquipes: 64
        },
        '5v5': {
            id: '5v5',
            titulo: 'Campeonato 5v5',
            entidade: 'equipe',
            taxa: 50,
            numEquipes: 32,
            vagasRestantes: null,
            inscricoesAbertas: true,
            disputaTerceiro: true,
            usaMD: true,
            horarioPadrao: 'A definir',
            discordLink: '',
            premios: [
                { lugar: '1º Lugar', valor: 'R$ 700,00', extra: '' },
                { lugar: '2º Lugar', valor: 'R$ 300,00', extra: '' },
                { lugar: '3º Lugar', valor: 'R$ 120,00', extra: '' }
            ],
            obsPremios: 'A premiação poderá ser ampliada mediante a entrada de novos patrocinadores e investidores. Estamos abertos a parcerias para fortalecer a competição e aumentar os prêmios.',
            aviso: 'POUCAS VAGAS DISPONÍVEIS! Garanta sua inscrição antes do encerramento das vagas.',
            rotulo: 'CLÃ',
            imgDir: 'style5/',
            imgTotal: 32,
            maxEquipes: 64
        }
    };

    /* ---------- utilitários ---------- */
    function clone(o) { return JSON.parse(JSON.stringify(o)); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function clampInt(v, min, max, fallback) {
        var n = parseInt(v, 10);
        if (isNaN(n)) n = fallback;
        return Math.max(min, Math.min(max, n));
    }
    function brl(v) {
        var n = Number(v);
        if (isNaN(n)) return String(v);
        return 'R$ ' + n.toFixed(2).replace('.', ',');
    }
    function num(v) {
        if (v === '' || v == null) return null;
        var n = Number(v);
        return isNaN(n) ? null : n;
    }
    function imgPadrao(camp, id) {
        var d = DEFAULTS[camp];
        return d.imgDir + 'cla' + (((id - 1) % d.imgTotal) + 1) + '.png';
    }

    /* ---------- Firebase (carregado sob demanda) ---------- */
    var fbPromise = null;
    function configured() {
        var c = global.GW_FIREBASE_CONFIG;
        return !!(c && c.apiKey && c.projectId);
    }
    function loadScript(src) {
        return new Promise(function (resolve, reject) {
            var s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = function () { reject(new Error('Falha ao carregar ' + src)); };
            document.head.appendChild(s);
        });
    }
    function initFirebase() {
        if (fbPromise) return fbPromise;
        if (!configured()) { fbPromise = Promise.resolve(null); return fbPromise; }
        var base = 'https://www.gstatic.com/firebasejs/' + FB_VERSION + '/';
        fbPromise = loadScript(base + 'firebase-app-compat.js')
            .then(function () {
                return Promise.all([
                    loadScript(base + 'firebase-auth-compat.js'),
                    loadScript(base + 'firebase-firestore-compat.js')
                ]);
            })
            .then(function () {
                if (!global.firebase.apps.length) global.firebase.initializeApp(global.GW_FIREBASE_CONFIG);
                return { db: global.firebase.firestore(), auth: global.firebase.auth(), fb: global.firebase };
            })
            .catch(function (err) {
                console.warn('[GW] Firebase indisponível, usando dados padrão:', err.message);
                return null;
            });
        return fbPromise;
    }

    /* ---------- motor da chave eliminatória ---------- */
    function resolveMatch(m, rec) {
        rec = rec || {};
        m.horario = rec.horario || '';
        m.winner = null;
        m.loser = null;
        // o resultado só vale se foi lançado para ESTES times (evita resultado velho
        // aparecer quando um confronto anterior é corrigido pela administração)
        var valido = (rec.a == null || (m.a && String(m.a.id) === String(rec.a))) &&
                     (rec.b == null || (m.b && String(m.b.id) === String(rec.b)));
        if (!valido) rec = { horario: rec.horario };
        m.placarA = num(rec.placarA);
        m.placarB = num(rec.placarB);
        if (m.bye) {
            m.winner = m.a;
        } else if (m.a && m.b && rec.winner != null && rec.winner !== '') {
            var w = String(rec.winner);
            if (String(m.a.id) === w) { m.winner = m.a; m.loser = m.b; }
            else if (String(m.b.id) === w) { m.winner = m.b; m.loser = m.a; }
        }
        return m;
    }

    function faseNome(diff) {
        return ['FINAL', 'SEMIFINAL', 'QUARTAS DE FINAL', 'OITAVAS DE FINAL'][diff] || '';
    }

    /**
     * Monta a chave para qualquer quantidade de equipes (>= 2).
     * Quando o total não é potência de 2, as vagas excedentes viram BYE
     * (a equipe avança automaticamente), distribuídos de forma uniforme.
     * Vencedores avançam automaticamente a partir de `partidas`.
     */
    function buildBracket(teams, partidas, opts) {
        opts = opts || {};
        partidas = partidas || {};
        var n = teams.length;
        if (n < 2) return { rounds: [], third: null, champion: null, finalists: [], size: 0, byes: 0 };

        var P = 1; while (P < n) P <<= 1;
        var R = Math.round(Math.log(P) / Math.LN2);
        var m1 = P / 2, byes = P - n;

        var byeIdx = {};
        for (var i = 0; i < byes; i++) byeIdx[Math.floor((i + 0.5) * m1 / byes)] = true;

        function formato(r) {
            if (!opts.usaMD) return '';
            return r >= R - 1 ? 'MD5' : 'MD3';
        }

        var rounds = [], t = 0, j;
        var first = [];
        for (j = 0; j < m1; j++) {
            var a = teams[t++], b = null, bye = false;
            if (byeIdx[j]) bye = true; else b = teams[t++];
            first.push(resolveMatch({ id: 'r1m' + j, round: 1, index: j, a: a, b: b, bye: bye }, partidas['r1m' + j]));
        }
        rounds.push({ index: 1, nome: R === 1 ? 'FINAL' : 'RODADA 1', fase: faseNome(R - 1), formato: formato(1), matches: first });

        for (var r = 2; r <= R; r++) {
            var prev = rounds[r - 2].matches, cur = [];
            for (j = 0; j < prev.length / 2; j++) {
                var id = 'r' + r + 'm' + j;
                cur.push(resolveMatch({
                    id: id, round: r, index: j,
                    a: prev[2 * j].winner, b: prev[2 * j + 1].winner, bye: false
                }, partidas[id]));
            }
            rounds.push({ index: r, nome: r === R ? 'FINAL' : 'RODADA ' + r, fase: faseNome(R - r), formato: formato(r), matches: cur });
        }

        var third = null;
        if (opts.disputaTerceiro && R >= 2) {
            var semis = rounds[R - 2].matches;
            if (semis.length === 2 && !semis[0].bye && !semis[1].bye) {
                third = resolveMatch({ id: 't3', round: R, index: 1, a: semis[0].loser, b: semis[1].loser, bye: false, third: true }, partidas['t3']);
                third.formato = formato(R);
            }
        }

        var fin = rounds[R - 1].matches[0];
        return {
            rounds: rounds,
            third: third,
            champion: fin.winner,
            runnerUp: fin.loser,
            finalists: [fin.a, fin.b],
            size: P,
            byes: byes
        };
    }

    /* ---------- estado público (config + equipes + resultados) ---------- */
    function buildView(camp, st) {
        var def = DEFAULTS[camp];
        var cfg = st.config;
        var n = clampInt(cfg.numEquipes, 2, def.maxEquipes, def.numEquipes);
        var teams = [];
        for (var i = 1; i <= n; i++) {
            var d = st.docs[i] || {};
            teams.push({ id: i, nome: d.nome || (def.rotulo + ' ' + i), img: d.img || imgPadrao(camp, i), custom: !!d.nome || !!d.img });
        }
        var bracket = buildBracket(teams, st.partidas, { usaMD: cfg.usaMD, disputaTerceiro: cfg.disputaTerceiro });
        return { camp: camp, def: def, config: cfg, teams: teams, bracket: bracket, partidas: st.partidas, docs: st.docs, online: st.online };
    }

    /**
     * Escuta (tempo real) os dados do campeonato. cb(view) é chamado
     * imediatamente com os padrões e a cada alteração no Firestore.
     * Retorna função para cancelar.
     */
    function subscribe(camp, cb) {
        var st = { config: clone(DEFAULTS[camp]), docs: {}, partidas: {}, online: false };
        var unsubs = [], cancelled = false;
        function emit() { cb(buildView(camp, st)); }
        emit();
        initFirebase().then(function (f) {
            if (!f || cancelled) return;
            var base = 'campeonatos/' + camp;
            var onErr = function (e) { console.warn('[GW] Firestore:', e.message); };
            unsubs.push(f.db.doc(base).onSnapshot(function (s) {
                st.online = true;
                st.config = Object.assign(clone(DEFAULTS[camp]), s.exists ? s.data() : {});
                emit();
            }, onErr));
            unsubs.push(f.db.collection(base + '/equipes').onSnapshot(function (qs) {
                st.docs = {};
                qs.forEach(function (d) { st.docs[d.id] = d.data(); });
                emit();
            }, onErr));
            unsubs.push(f.db.collection(base + '/partidas').onSnapshot(function (qs) {
                st.partidas = {};
                qs.forEach(function (d) { st.partidas[d.id] = d.data(); });
                emit();
            }, onErr));
        });
        return function () { cancelled = true; unsubs.forEach(function (u) { u(); }); };
    }

    /* ---------- vagas / avisos ---------- */
    function vagasInfo(cfg) {
        var esgotadas = cfg.vagasRestantes === 0 || cfg.vagasRestantes === '0';
        var fechadas = cfg.inscricoesAbertas === false;
        var restantes = (typeof cfg.vagasRestantes === 'number' && cfg.vagasRestantes > 0) ? cfg.vagasRestantes : null;
        return { esgotadas: esgotadas, fechadas: fechadas, encerradas: esgotadas || fechadas, restantes: restantes };
    }
    function avisoHTML(cfg) {
        var v = vagasInfo(cfg);
        if (v.esgotadas) return '<div class="gw-aviso gw-aviso-fim"><span class="gw-aviso-ico">⛔</span><div><strong>VAGAS ESGOTADAS!</strong> Acompanhe a Gaming World para as próximas edições.</div></div>';
        if (v.fechadas) return '<div class="gw-aviso gw-aviso-fim"><span class="gw-aviso-ico">⛔</span><div><strong>INSCRIÇÕES ENCERRADAS.</strong> Acompanhe a Gaming World para as próximas edições.</div></div>';
        var txt = String(cfg.aviso || '');
        var m = txt.match(/^([^!]*!)\s*(.*)$/);
        var forte = m ? m[1] : txt, resto = m ? m[2] : '';
        var extra = v.restantes ? ' <span class="gw-vagas">Restam ' + v.restantes + (v.restantes === 1 ? ' vaga' : ' vagas') + '.</span>' : '';
        return '<div class="gw-aviso"><span class="gw-aviso-ico">🔥</span><div><strong>' + esc(forte) + '</strong> ' + esc(resto) + extra + '</div></div>';
    }
    function premiosHTML(cfg) {
        var ic = ['🥇', '🥈', '🥉'], cl = ['ouro', 'prata', 'bronze'];
        return (cfg.premios || []).map(function (p, i) {
            return '<div class="gw-premio ' + (cl[i] || '') + '"><div class="gw-premio-ico">' + (ic[i] || '🏅') + '</div>' +
                '<div class="gw-premio-lugar">' + esc(p.lugar) + '</div>' +
                '<div class="gw-premio-valor">' + esc(p.valor) + '</div>' +
                (p.extra ? '<div class="gw-premio-extra">' + esc(p.extra) + '</div>' : '') + '</div>';
        }).join('');
    }

    /** Preenche elementos [data-gw] / [data-gw-aviso] / [data-gw-premios] da página. */
    function bind(view, root) {
        root = root || document;
        var cfg = view.config;
        var map = {
            taxa: brl(cfg.taxa),
            numEquipes: String(view.teams.length),
            obsPremios: cfg.obsPremios || '',
            horarioPadrao: cfg.horarioPadrao || 'A definir',
            vagas: vagasInfo(cfg).restantes ? String(vagasInfo(cfg).restantes) : ''
        };
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw]'), function (el) {
            var k = el.getAttribute('data-gw');
            if (k in map) {
                el.textContent = map[k];
                if (k === 'obsPremios' || k === 'vagas') el.hidden = !map[k];
            }
        });
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw-aviso]'), function (el) { el.innerHTML = avisoHTML(cfg); });
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw-premios]'), function (el) { el.innerHTML = premiosHTML(cfg); });
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw-discord]'), function (el) {
            if (cfg.discordLink) {
                el.innerHTML = '<a href="' + esc(cfg.discordLink) + '" target="_blank" rel="noopener">' + esc(cfg.discordLink) + '</a>';
            } else {
                el.textContent = 'será informado na descrição do campeonato';
            }
        });
    }

    /* ---------- PIX ---------- */
    function copyText(text) {
        if (navigator.clipboard && global.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
        }
        return legacyCopy(text);
    }
    function legacyCopy(text) {
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text; ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
            document.body.appendChild(ta); ta.select();
            try { document.execCommand('copy') ? resolve() : reject(new Error('copy')); }
            catch (e) { reject(e); }
            document.body.removeChild(ta);
        });
    }
    /** Liga o botão "copiar chave PIX" e preenche os dados do PIX da página. */
    function bindPix(root) {
        root = root || document;
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw-pix]'), function (el) {
            el.textContent = PIX[el.getAttribute('data-gw-pix')] || '';
        });
        Array.prototype.forEach.call(root.querySelectorAll('[data-gw-copiar-pix]'), function (btn) {
            var original = btn.textContent;
            btn.addEventListener('click', function () {
                copyText(PIX.chave).then(function () {
                    btn.textContent = '✅ Chave copiada!';
                    btn.classList.add('copiado');
                }).catch(function () {
                    btn.textContent = '⚠️ Copie manualmente: ' + PIX.chave;
                }).then(function () {
                    setTimeout(function () { btn.textContent = original; btn.classList.remove('copiado'); }, 2500);
                });
            });
        });
    }

    /* ---------- imagens ---------- */
    function compressImage(file, maxDim, maxBytes) {
        return new Promise(function (resolve, reject) {
            var fr = new FileReader();
            fr.onerror = function () { reject(new Error('Não foi possível ler o arquivo.')); };
            fr.onload = function () {
                var img = new Image();
                img.onerror = function () { reject(new Error('Arquivo de imagem inválido.')); };
                img.onload = function () {
                    var s = Math.min(1, maxDim / Math.max(img.width, img.height));
                    var c = document.createElement('canvas');
                    c.width = Math.max(1, Math.round(img.width * s));
                    c.height = Math.max(1, Math.round(img.height * s));
                    var x = c.getContext('2d');
                    x.fillStyle = '#ffffff'; x.fillRect(0, 0, c.width, c.height);
                    x.drawImage(img, 0, 0, c.width, c.height);
                    var q = 0.85, out = c.toDataURL('image/jpeg', q);
                    while (out.length > maxBytes && q > 0.3) { q -= 0.1; out = c.toDataURL('image/jpeg', q); }
                    if (out.length > maxBytes) return reject(new Error('Imagem muito pesada, envie uma menor.'));
                    resolve(out);
                };
                img.src = fr.result;
            };
            fr.readAsDataURL(file);
        });
    }

    /* ---------- inscrição ---------- */
    function saveInscricao(camp, data) {
        return initFirebase().then(function (f) {
            if (!f) throw new Error('offline');
            var payload = Object.assign({}, data, {
                camp: camp,
                status: 'pendente',
                pagamento: 'aguardando',
                criadoEm: f.fb.firestore.FieldValue.serverTimestamp()
            });
            var op = f.db.collection('campeonatos/' + camp + '/inscricoes').add(payload);
            var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('timeout')); }, 15000); });
            return Promise.race([op, timeout]);
        });
    }
    function whatsappURL(text) {
        return 'https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(text);
    }

    global.GW = {
        PIX: PIX, WHATSAPP: WHATSAPP, DEFAULTS: DEFAULTS,
        esc: esc, brl: brl, clampInt: clampInt, clone: clone, imgPadrao: imgPadrao,
        configured: configured, initFirebase: initFirebase,
        buildBracket: buildBracket, buildView: buildView, subscribe: subscribe,
        vagasInfo: vagasInfo, avisoHTML: avisoHTML, premiosHTML: premiosHTML, bind: bind,
        copyText: copyText, bindPix: bindPix,
        compressImage: compressImage, saveInscricao: saveInscricao, whatsappURL: whatsappURL
    };
})(window);
