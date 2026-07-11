#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.lib.units import cm
import os
from datetime import datetime

# Cores do projeto
ROXO = Color(0.53, 0.12, 0.76)   # #8822C2
DOURADO = Color(0.93, 0.78, 0.22) # #EDC838
CINZA = Color(0.15, 0.15, 0.15)
BRANCO = Color(1, 1, 1)

def criar_art_gaming_battle(nome_arquivo="Gaming_Battle_Art.pdf"):
    """Gera o ART do campeonato Gaming Battle em PDF"""

    caminho = f"outputs/{nome_arquivo}"
    c = canvas.Canvas(caminho, pagesize=A4)
    largura, altura = A4

    # --- FUNDO ---
    c.setFillColor(CINZA)
    c.rect(0, 0, largura, altura, fill=1)

    # --- CABEÇALHO: GAMING WORLD ---
    c.setFillColor(DOURADO)
    c.setFont("Helvetica-Bold", 52)
    c.drawString(70, altura - 100, "GAMING")

    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 52)
    c.drawString(70, altura - 155, "WORLD")

    # --- SLOGAN ---
    c.setFillColor(DOURADO)
    c.setFont("Helvetica", 14)
    c.drawString(70, altura - 200, "A COMUNIDADE GAMER ESTÁ DE VOLTA")

    # --- NOME NIVALIERE ---
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 60)
    c.drawString(70, altura - 290, "NIVALIERE")

    # --- SUBTEXTO ---
    c.setFillColor(DOURADO)
    c.setFont("Helvetica", 10)
    c.drawString(70, altura - 325, "AD · MAIS IIPIANIZACBO · UMA KOAITHA")

    # --- META AI ---
    c.setFillColor(ROXO)
    c.setFont("Helvetica", 9)
    c.drawString(70, altura - 355, "MetaAI")

    # --- LINHA DECORATIVA ---
    c.setStrokeColor(DOURADO)
    c.setLineWidth(2)
    c.line(70, altura - 370, largura - 70, altura - 370)

    # --- TÍTULO DO TORNEIO ---
    c.setFillColor(ROXO)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(70, altura - 420, "GAMING BATTLE")

    # --- INFORMAÇÕES ---
    c.setFillColor(DOURADO)
    c.setFont("Helvetica", 13)
    y = altura - 460
    informacoes = [
        "• 10 EQUIPES",
        "• 2 PARTIDAS POR RODADA",
        "• EMPATE = MODO RIXA (BRAWL)",
        "• CHAT PROIBIDO DURANTE AS PARTIDAS",
        "• COMUNIDADE: NIVALIERE"
    ]

    for info in informacoes:
        c.drawString(70, y, info)
        y -= 25

    # --- DATA ---
    c.setFillColor(ROXO)
    c.setFont("Helvetica", 10)
    data = datetime.now().strftime("%d/%m/%Y - %H:%M")
    c.drawString(70, y - 30, f"GERADO EM: {data}")

    # --- RODAPÉ ---
    c.setFillColor(CINZA)
    c.setFont("Helvetica", 8)
    c.drawString(70, 30, "Comunidade Nivaliere | Organized by Gaming World")
    c.drawString(70, 20, "MLBB Mobile Legends - Torneio Oficial da Comunidade")

    # --- SALVAR ---
    c.save()
    print(f"✅ PDF salvo em: {caminho}")
    return caminho

if __name__ == "__main__":
    criar_art_gaming_battle()
