/* Inscrição — campeonato 5v5 (R$ 50,00 por equipe: 5 titulares + até 2 reservas).
   Lógica comum em inscricao-comum.js. Independente do 2v2. */
document.addEventListener('DOMContentLoaded', function () {
    function v(id) { return document.getElementById(id).value.trim(); }

    GW.setupInscricao({
        camp: '5v5',

        collect: function () {
            var nomeEquipe = v('nome-equipe'), capitao = v('capitao'), contato = v('contato');
            if (!nomeEquipe) return { erro: 'Informe o nome do clã / equipe.' };
            if (!capitao) return { erro: 'Informe o nick do capitão.' };
            var jogadores = [], i;
            for (i = 1; i <= 5; i++) {
                if (!v('nick' + i) || !v('id' + i)) return { erro: 'Preencha NICK e ID dos 5 jogadores titulares.' };
                jogadores.push({ nick: v('nick' + i), id: v('id' + i), tipo: 'titular' });
            }
            for (i = 6; i <= 7; i++) {
                var n = v('nick' + i), d = v('id' + i);
                if (n || d) {
                    if (!n || !d) return { erro: 'Reserva ' + (i - 5) + ': preencha NICK e ID (ou deixe os dois vazios).' };
                    jogadores.push({ nick: n, id: d, tipo: 'reserva' });
                }
            }
            if (!contato) return { erro: 'Informe o WhatsApp do capitão / responsável.' };
            return {
                data: {
                    nomeEquipe: nomeEquipe,
                    capitao: capitao,
                    contato: contato,
                    idTransacao: v('info-pagamento'),
                    jogadores: jogadores
                }
            };
        },

        whatsapp: function (d, ctx) {
            var tit = d.jogadores.filter(function (j) { return j.tipo === 'titular'; });
            var res = d.jogadores.filter(function (j) { return j.tipo === 'reserva'; });
            function linha(j, k) { return k + '. ' + j.nick + ' — ID ' + j.id; }
            return '📝 *NOVA INSCRIÇÃO 5v5 - GAMING BATTLE 2026*\n\n' +
                '🏴 *Clã/Equipe:* ' + d.nomeEquipe + '\n' +
                '👑 *Capitão:* ' + d.capitao + '\n\n' +
                '⚔️ *Titulares*\n' + tit.map(function (j, k) { return linha(j, k + 1); }).join('\n') + '\n' +
                (res.length ? '\n🛡️ *Reservas*\n' + res.map(function (j, k) { return linha(j, 'R' + (k + 1)); }).join('\n') + '\n' : '') +
                '\n📱 *Contato:* ' + d.contato + '\n' +
                '💰 *Taxa paga:* ' + GW.brl(ctx.taxa) + '\n' +
                (d.idTransacao ? '🧾 *Pagador/Transação:* ' + d.idTransacao + '\n' : '') +
                (ctx.online
                    ? '\n📎 Logo e comprovante enviados pelo site.\n🔖 *Protocolo:* ' + ctx.protocolo
                    : '\n📎 Logo e comprovante serão enviados nesta conversa.') +
                '\n\n✅ *Inscrição aguardando confirmação*\n🏆 Gaming World 2026';
        }
    });
});
