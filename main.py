#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
PROJETO: GAMING BATTLE
VERSÃO: 1.0
DESCRIÇÃO: Sistema de geração de artes e documentos para campeonato MLBB
"""

import os
from datetime import datetime
from gerar_pdf import criar_art_gaming_battle

def exibir_banner():
    """Mostra o banner do projeto"""
    banner = """
    ╔═══════════════════════════════════════╗
    ║                                      ║
    ║   ██████   █████  ███    ███         ║
    ║  ██       ██   ██ ████  ████         ║
    ║  ██   ███ ███████ ██ ████ ██         ║
    ║  ██    ██ ██   ██ ██  ██  ██         ║
    ║   ██████  ██   ██ ██      ██         ║
    ║                                      ║
    ║        GAMING BATTLE MLBB            ║
    ║        Comunidade Nivaliere          ║
    ║                                      ║
    ╚═══════════════════════════════════════╝
    """
    print(banner)
    print(f"📅 {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 50)

def menu_principal():
    """Menu interativo do projeto"""
    while True:
        print("\n" + "=" * 50)
        print("🎮 ESCOLHA UMA OPÇÃO:")
        print("  1. Gerar ART do campeonato (PDF)")
        print("  2. Ver regulamento")
        print("  3. Sair")
        print("=" * 50)

        opcao = input("👉 Digite 1, 2 ou 3: ")

        if opcao == "1":
            print("\n🔄 Gerando ART...")
            criar_art_gaming_battle()
            print("✅ ART gerado com sucesso! Pasta: outputs/")
            print("📱 Para baixar: python -m http.server 8080")
            print("   e acesse: http://localhost:8080/outputs/")

        elif opcao == "2":
            print("\n📜 REGULAMENTO GAMING BATTLE")
            print("-" * 40)
            print("• 10 equipes")
            print("• 2 partidas por rodada")
            print("• Empate = Modo Rixa (Brawl)")
            print("• Chat proibido durante as partidas")
            print("• Comunidade: Nivaliere")
            print("-" * 40)

        elif opcao == "3":
            print("\n👋 Até logo! GGWP!")
            break

        else:
            print("❌ Opção inválida! Tente novamente.")

if __name__ == "__main__":
    # Criar pastas necessárias
    os.makedirs("outputs", exist_ok=True)
    os.makedirs("docs", exist_ok=True)

    exibir_banner()
    menu_principal()
