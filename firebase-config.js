/* ==========================================================
   GAMING WORLD 2026 — CONFIGURAÇÃO DO FIREBASE
   ----------------------------------------------------------
   1. Crie um projeto em https://console.firebase.google.com
   2. Ative: Authentication (E-mail/senha) e Firestore Database
   3. Em "Configurações do projeto > Seus apps > Web" copie os
      valores e cole abaixo.
   4. Publique as regras do arquivo firestore.rules
   (passo a passo completo em FIREBASE_SETUP.md)

   Enquanto apiKey/projectId estiverem vazios, o site funciona
   com os dados padrão (sem inscrições online e sem painel ADM).
   Estes valores NÃO são segredos: quem protege os dados são as
   regras do Firestore.
   ========================================================== */
window.GW_FIREBASE_CONFIG = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
};
