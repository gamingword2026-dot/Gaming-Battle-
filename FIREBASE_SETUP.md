# Configuração do Firebase — Gaming World 2026

O site é estático (GitHub Pages). Para que **inscrições, resultados, vagas, premiação e o painel ADM**
funcionem para todos os visitantes, ele usa o **Firebase** (plano grátis "Spark" é suficiente).
Enquanto o `firebase-config.js` estiver vazio, o site funciona com os dados padrão
(inscrição só pelo WhatsApp e sem painel ADM).

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com → **Adicionar projeto** (ex.: `gaming-world-2026`).
2. **Build → Authentication → Começar → E-mail/senha → Ativar.**
3. **Authentication → Usuários → Adicionar usuário**: crie o administrador
   (por padrão `gamingword2026@gmail.com`, com uma senha forte).
4. **Build → Firestore Database → Criar banco de dados** (modo produção, região `southamerica-east1`).

## 2. Regras de segurança
1. Firestore → aba **Regras** → cole o conteúdo de `firestore.rules` → **Publicar**.
2. Se o administrador usar outro e-mail, troque `gamingword2026@gmail.com` dentro do arquivo
   (pode listar vários: `['a@x.com', 'b@y.com']`).

## 3. Ligar o site ao projeto
1. Configurações do projeto (engrenagem) → **Seus apps → `</>` Web** → registrar o app.
2. Copie os valores de `firebaseConfig` para **`firebase-config.js`** (apiKey, authDomain, projectId, ...).
   Essas chaves não são segredo; a proteção está nas regras acima.
3. Authentication → **Configurações → Domínios autorizados**: adicione `gamingword.com.br`
   (e `www.gamingword.com.br`).
4. Publique os arquivos no GitHub como de costume.

## 4. Usar o painel
Acesse `https://gamingword.com.br/adm.html`, entre com o e-mail/senha do administrador e use as abas
**2v2** e **5v5** (dados totalmente separados):

| Aba | O que faz |
|---|---|
| Inscrições | vê dados, logo e comprovante; confirma pagamento; aprova/rejeita; envia a equipe para uma vaga da chave |
| Equipes | edita nome e logo de cada vaga, reordena e embaralha |
| Confrontos | lança placar/vencedor/horário; o vencedor avança sozinho; mostra o campeão |
| Configurações | taxa, nº de equipes, vagas restantes, inscrições abertas, premiação, horário padrão, Discord, aviso |

## Onde ficam os dados (Firestore)
```
campeonatos/2v2                 configuração do 2v2
campeonatos/2v2/equipes/{1..N}  nome e logo de cada vaga
campeonatos/2v2/partidas/{id}   resultados e horários
campeonatos/2v2/inscricoes/{id} inscrições recebidas (só o ADM lê)
campeonatos/5v5/...             mesma estrutura, independente
```

## Observações
- O comprovante e a logo são reduzidos no navegador e guardados dentro do próprio documento
  (não precisa do Firebase Storage, que exige plano pago).
- Sem nenhum documento no Firestore o site usa os padrões: 2v2 = 16 equipes / R$ 20,00;
  5v5 = 32 equipes / R$ 50,00.
- Backup: o Firestore tem exportação em Configurações → Integrações, ou copie manualmente as inscrições do painel.
