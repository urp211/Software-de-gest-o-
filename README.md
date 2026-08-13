# 🚛 Truck Simulator 3D (Offline & Mobile Ready)

Um simulador 3D de caminhões europeus completo, moderno e jogável offline, inspirado em *Truckers of Europe 3*. O jogo suporta qualquer tela na horizontal (smartphones e tablets), modo de condução e modo a pé em 1ª pessoa, câmera de cabine com ajuste fino de banco/visão, acoplamento de carretas, mercado de fretes, tráfego com IA, customização de caminhões na garagem e ciclo de dia/noite com clima dinâmico.

---

## 🎮 Principais Recursos e Sistemas

- 🚛 **Caminhão Europeu 3D Cab-Over:** Modelagem detalhada, suspensão dinâmica, prato de 5ª roda para engate de carretas, faróis LED (baixo e alto), setas e luzes de freio.
- 💺 **Cockpit com Ajuste de Banco:** Ajuste fino de altura pneumática do banco, distância do volante, posição lateral, inclinação e Campo de Visão (FOV de 50° a 85°).
- 🚶 **Modo Motorista a Pé:** Desça da cabine a qualquer momento com controle via Joystick virtual 360°, sprint, passos sonoros e interação com a carreta e portas do caminhão.
- 📦 **Mercado de Cargas & Fretes:** Cargas pesadas (maquinário, combustíveis perigosos ADR, perecíveis refrigerados, contêineres marítimos) com recompensas em dinheiro (€) e XP.
- 🚦 **Mundo Aberto & Tráfego IA:** Rodovias com guard-rails, placas suspensas, postos de abastecimento de diesel, parques eólicos e carros com IA de desvio e frenagem.
- 🌧️ **Clima e Ciclo Dia/Noite:** Céu limpo, chuva pesada com partículas e limpadores de para-brisa, pôr do sol dourado e noite com iluminação pública.
- 🔊 **Áudio Sintetizado (Web Audio API):** Motor a diesel com modulação de RPM e assobio de turbina, freios pneumáticos a ar, piscas, buzinas a ar duplas e passos.
- 📲 **100% Offline (PWA & APK Ready):** Service Worker e Web Manifest integrados para instalação direta em 1 clique na tela inicial sem precisar de conexão à internet.

---

## 🕹️ Controles

| Ação | Condução (Mobile / Teclado) | Modo a Pé (Mobile / Teclado) |
| :--- | :--- | :--- |
| **Movimento** | Volante ou Botões `◀ ▶` / `A D` | Joystick Virtual 360° / `W A S D` |
| **Acelerar / Frear** | Pedais `GAS` e `FREIO` / `W S` | Botão `⚡ CORRER` / `Shift` |
| **Descer / Entrar na Cabine** | Botão `🚪` / Tecla `F` | Botão `🚪 ENTRAR` / Tecla `F` |
| **Ajustar Banco** | Botão `💺` (no Cockpit) | — |
| **Engatar Carreta** | Botão `ESPAÇO` / Botão Central | Perto do engate + Ação |
| **Ligar/Desligar Motor** | Botão `PWR` / Tecla `E` | — |
| **Faróis / Limpador / Buzina** | Botões `💡`, `🌧️`, `📢` / `L`, `W`, `H` | — |
| **Câmeras (Órbita, Cabine, Topo)** | Botão `📹` / Tecla `C` | Arraste na tela para olhar |

---

## 🚀 Como Executar o Projeto

```bash
# Entrar no diretório do jogo
cd truck-europe3

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Compilar versão de produção
npm run build
```

---

## 📲 Instalação no Celular (Android / iOS)

1. Acesse o jogo no navegador do seu smartphone.
2. Toque no menu do navegador e selecione **"Adicionar à Tela Inicial"** ou **"Instalar Aplicativo"**.
3. O aplicativo abrirá em tela cheia horizontal nativa e funcionará **100% offline**.
