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
});
