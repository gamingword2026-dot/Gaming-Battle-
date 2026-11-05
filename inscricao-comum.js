/* ==========================================================
   GAMING WORLD 2026 — LÓGICA COMUM DAS INSCRIÇÕES (2v2 / 5v5)
   Cada página informa o seu campeonato e como coletar os dados:
     GW.setupInscricao({ camp, collect(), whatsapp(data, ctx) })
   - Preview das imagens (logo e comprovante)
   - Cópia da chave PIX e dados do PIX
   - Valor/vagas/avisos lidos do campeonato certo (nunca misturados)
   - Salva a inscrição no Firestore (campeonatos/{camp}/inscricoes)
     e abre o WhatsApp com o resumo
   ========================================================== */
(function (global) {
    'use strict';
    var GW = global.GW;

    GW.setupInscricao = function (o) {
        var form = document.getElementById('form-inscricao');
        var btn = document.getElementById('btn-enviar');
        var msgEl = document.getElementById('gw-msg');
        var fechadoEl = document.getElementById('gw-fechado');
        var textoBtn = btn.textContent;
        var view = null;

        GW.bindPix();

        function showMsg(html, tipo) {
            msgEl.className = 'gw-msg-form ' + tipo;
            msgEl.innerHTML = html;
        }
        function clearMsg() { msgEl.className = 'gw-msg-form'; msgEl.innerHTML = ''; }

        // Preview de imagens (logo e comprovante)
        function preview(inputId, imgId, areaId) {
            var input = document.getElementById(inputId);
            var img = document.getElementById(imgId);
            var area = document.getElementById(areaId);
            var ph = area.querySelector('.upload-placeholder');
            input.addEventListener('change', function (e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function (ev) {
                    img.src = ev.target.result;
                    img.style.display = 'block';
                    ph.style.display = 'none';
                    area.classList.add('com-imagem');
                };
                reader.readAsDataURL(file);
            });
        }
        preview('logo-cla', 'logo-preview', 'logo-area');
        preview('comprovante', 'comprovante-preview', 'comprovante-area');

        // Valor, vagas e avisos do campeonato (tempo real)
        GW.subscribe(o.camp, function (v) {
            view = v;
            GW.bind(v);
            var enc = GW.vagasInfo(v.config).encerradas;
            form.hidden = enc;
            fechadoEl.hidden = !enc;
            if (enc) fechadoEl.innerHTML = GW.avisoHTML(v.config);
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            clearMsg();
            if (!view || GW.vagasInfo(view.config).encerradas) return;

            var r = o.collect();
            if (r.erro) { showMsg('⚠️ ' + GW.esc(r.erro), 'erro'); return; }

            var logoFile = document.getElementById('logo-cla').files[0];
            var compFile = document.getElementById('comprovante').files[0];
            if (!logoFile) { showMsg('⚠️ Por favor, envie a LOGO do seu clã!', 'erro'); return; }
            if (!compFile) { showMsg('⚠️ Por favor, envie o COMPROVANTE de pagamento!', 'erro'); return; }
            if (logoFile.size > 5 * 1024 * 1024) { showMsg('⚠️ A logo deve ter no máximo 5MB!', 'erro'); return; }
            if (compFile.size > 5 * 1024 * 1024) { showMsg('⚠️ O comprovante deve ter no máximo 5MB!', 'erro'); return; }

            btn.disabled = true;
            btn.textContent = '⏳ ENVIANDO...';
            // abre a aba agora (clique do usuário) para o navegador não bloquear o WhatsApp depois
            var aba = null;
            try { aba = global.open('', '_blank'); } catch (err) { aba = null; }

            var taxa = view.config.taxa;
            Promise.all([GW.compressImage(logoFile, 220, 70000), GW.compressImage(compFile, 1100, 600000)])
                .then(function (imgs) {
                    var dados = Object.assign({}, r.data, { valor: taxa, logo: imgs[0], comprovante: imgs[1] });
                    return GW.saveInscricao(o.camp, dados).then(
                        function (ref) { return { online: true, protocolo: ref.id }; },
                        function (err) { console.warn('[GW] inscrição não salva online:', err.message); return { online: false, protocolo: null }; }
                    );
                })
                .then(function (res) {
                    var url = GW.whatsappURL(o.whatsapp(r.data, { taxa: taxa, protocolo: res.protocolo, online: res.online }));
                    var link = '<a href="' + GW.esc(url) + '" target="_blank" rel="noopener" style="color:inherit;font-weight:800;text-decoration:underline">Abrir WhatsApp</a>';
                    if (aba) { aba.location.href = url; }
                    if (res.online) {
                        showMsg('✅ <strong>Inscrição registrada!</strong> Protocolo: <code>' + GW.esc(res.protocolo) + '</code>. Enviamos o resumo para o WhatsApp da organização. Aguarde a confirmação. ' + (aba ? '' : link), 'ok');
                    } else {
                        showMsg('✅ Mensagem preparada no WhatsApp. <strong>Envie também o comprovante de pagamento e a logo na conversa.</strong> ' + (aba ? '' : link), 'ok');
                    }
                    btn.textContent = '✅ ENVIADO! AGUARDE CONFIRMAÇÃO';
                    btn.style.background = 'linear-gradient(135deg, #00a86b, #008c5a)';
                    setTimeout(function () {
                        btn.textContent = textoBtn;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 6000);
                })
                .catch(function (err) {
                    if (aba) aba.close();
                    showMsg('⚠️ ' + GW.esc(err.message || 'Erro ao enviar.'), 'erro');
                    btn.textContent = textoBtn;
                    btn.disabled = false;
                });
        });
    };
})(window);
