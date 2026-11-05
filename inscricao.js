<<<<<<< HEAD
/* Inscrição — campeonato 2v2 (R$ 20,00 por dupla). Lógica comum em inscricao-comum.js */
document.addEventListener('DOMContentLoaded', function () {
    function v(id) { return document.getElementById(id).value.trim(); }

    GW.setupInscricao({
        camp: '2v2',

        // lê e valida os campos da dupla
        collect: function () {
            var nomeEquipe = v('nome-equipe'), contato = v('contato');
            var nick1 = v('nick1'), nick2 = v('nick2'), id1 = v('id1'), id2 = v('id2');
            if (!nomeEquipe) return { erro: 'Informe o nome do clã / dupla.' };
            if (!nick1 || !nick2 || !id1 || !id2) return { erro: 'Por favor, preencha todos os campos de NICK e ID!' };
            if (!contato) return { erro: 'Informe o WhatsApp do responsável.' };
            return {
                data: {
                    nomeEquipe: nomeEquipe,
                    contato: contato,
                    idTransacao: v('info-pagamento'),
                    jogadores: [
                        { nick: nick1, id: id1, tipo: 'titular' },
                        { nick: nick2, id: id2, tipo: 'titular' }
                    ]
                }
            };
        },

        // mensagem enviada ao WhatsApp da organização
        whatsapp: function (d, ctx) {
            return '📝 *NOVA INSCRIÇÃO 2v2 - GAMING BATTLE 2026*\n\n' +
                '🏴 *Clã/Dupla:* ' + d.nomeEquipe + '\n\n' +
                '🎮 *NICK Jogador 1:* ' + d.jogadores[0].nick + '\n' +
                '🆔 *ID Jogador 1:* ' + d.jogadores[0].id + '\n\n' +
                '🎮 *NICK Jogador 2:* ' + d.jogadores[1].nick + '\n' +
                '🆔 *ID Jogador 2:* ' + d.jogadores[1].id + '\n\n' +
                '📱 *Contato:* ' + d.contato + '\n' +
                '💰 *Taxa paga:* ' + GW.brl(ctx.taxa) + '\n' +
                (d.idTransacao ? '🧾 *Pagador/Transação:* ' + d.idTransacao + '\n' : '') +
                (ctx.online
                    ? '\n📎 Logo e comprovante enviados pelo site.\n🔖 *Protocolo:* ' + ctx.protocolo
                    : '\n📎 Logo e comprovante serão enviados nesta conversa.') +
                '\n\n✅ *Inscrição aguardando confirmação*\n🏆 Gaming World 2026';
        }
    });
=======
document.addEventListener('DOMContentLoaded', function() {
    // Preview das imagens
    const logoInput = document.getElementById('logo-cla');
    const comprovanteInput = document.getElementById('comprovante');
    const logoPreview = document.getElementById('logo-preview');
    const comprovantePreview = document.getElementById('comprovante-preview');
    const logoPlaceholder = document.querySelector('#logo-area .upload-placeholder');
    const comprovantePlaceholder = document.querySelector('#comprovante-area .upload-placeholder');
    const logoArea = document.getElementById('logo-area');
    const comprovanteArea = document.getElementById('comprovante-area');

    // Preview Logo
    logoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                logoPreview.src = event.target.result;
                logoPreview.style.display = 'block';
                logoPlaceholder.style.display = 'none';
                logoArea.classList.add('com-imagem');
            };
            reader.readAsDataURL(file);
        }
    });

    // Preview Comprovante
    comprovanteInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                comprovantePreview.src = event.target.result;
                comprovantePreview.style.display = 'block';
                comprovantePlaceholder.style.display = 'none';
                comprovanteArea.classList.add('com-imagem');
            };
            reader.readAsDataURL(file);
        }
    });

    // Envio do formulário
    const form = document.getElementById('form-inscricao');
    const btnEnviar = document.getElementById('btn-enviar');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Pegar valores
        const nick1 = document.getElementById('nick1').value.trim();
        const nick2 = document.getElementById('nick2').value.trim();
        const id1 = document.getElementById('id1').value.trim();
        const id2 = document.getElementById('id2').value.trim();
        const logoFile = document.getElementById('logo-cla').files[0];
        const comprovanteFile = document.getElementById('comprovante').files[0];

        // Validar campos
        if (!nick1 || !nick2 || !id1 || !id2) {
            alert('⚠️ Por favor, preencha todos os campos de NICK e ID!');
            return;
        }

        if (!logoFile) {
            alert('⚠️ Por favor, envie a LOGO do seu clã!');
            return;
        }

        if (!comprovanteFile) {
            alert('⚠️ Por favor, envie o COMPROVANTE de pagamento!');
            return;
        }

        // Validar tamanho dos arquivos (máx 5MB)
        if (logoFile.size > 5 * 1024 * 1024) {
            alert('⚠️ A logo deve ter no máximo 5MB!');
            return;
        }

        if (comprovanteFile.size > 5 * 1024 * 1024) {
            alert('⚠️ O comprovante deve ter no máximo 5MB!');
            return;
        }

        // Construir mensagem para WhatsApp
        const mensagem = `📝 *NOVA INSCRIÇÃO - GAMING BATTLE 2026*

🎮 *NICK Jogador 1:* ${nick1}
🆔 *ID Jogador 1:* ${id1}

🎮 *NICK Jogador 2:* ${nick2}
🆔 *ID Jogador 2:* ${id2}

💰 *Taxa paga:* R$ 5,00

📎 *Logo do clã:* Enviada em anexo
🧾 *Comprovante:* Enviado em anexo

✅ *Inscrição aguardando confirmação*
🏆 Gaming World 2026`;

        // Codificar para URL
        const mensagemCodificada = encodeURIComponent(mensagem);
        const numeroWhatsApp = '553172189691';
        const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensagemCodificada}`;

        // Abrir WhatsApp
        window.open(urlWhatsApp, '_blank');

        // Feedback
        btnEnviar.textContent = '✅ ENVIADO! AGUARDE CONFIRMAÇÃO';
        btnEnviar.style.background = 'linear-gradient(135deg, #00a86b, #008c5a)';
        btnEnviar.disabled = true;

        // Resetar após 5 segundos
        setTimeout(() => {
            btnEnviar.textContent = '📤 ENVIAR INSCRIÇÃO VIA WHATSAPP';
            btnEnviar.style.background = 'linear-gradient(135deg, #25D366, #128C7E)';
            btnEnviar.disabled = false;
        }, 5000);
    });
>>>>>>> 25fd453c447ff2d983547817a41a65ef35de268b
});
