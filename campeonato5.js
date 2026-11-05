/* Campeonato 5v5 — abas da página + chave independente do 2v2 */
(function () {
    'use strict';
    var paginas = ['info', 'regras', 'confrontos'];
    var botoes = document.querySelectorAll('.nav-paginas .btn-rodada');

    function abrir(nome, atualizaHash) {
        if (paginas.indexOf(nome) < 0) nome = 'info';
        paginas.forEach(function (p) {
            document.getElementById('pagina-' + p).hidden = (p !== nome);
        });
        Array.prototype.forEach.call(botoes, function (b) {
            b.classList.toggle('ativo', b.getAttribute('data-pagina') === nome);
        });
        if (atualizaHash) {
            try { history.replaceState(null, '', '#' + nome); } catch (e) { /* ignorar */ }
        }
    }

    Array.prototype.forEach.call(botoes, function (b) {
        b.addEventListener('click', function () { abrir(b.getAttribute('data-pagina'), true); });
    });
    window.addEventListener('hashchange', function () { abrir(location.hash.replace('#', ''), false); });
    abrir(location.hash.replace('#', ''), false);

    // chave do 5v5 (equipes, resultados, horários e premiação vêm do painel ADM)
    GW.mountChave({ camp: '5v5', tabs: '.nav-chave' });
})();
