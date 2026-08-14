# 🚛 Oficina Tycoon 3D

Simulação de oficina automóvel **+ condução 3D de camião-reboque** ao estilo
Euro Truck Simulator 2. Geres o negócio na oficina e, quando entra uma avaria
na estrada, entras no camião e vais tu buscar o carro.

**React + TypeScript + Three.js**, empacotado como **APK Android** com
Capacitor.

## 📥 Descarregar o APK

Link direto (válido depois da primeira execução do workflow):

```
https://github.com/urp211/Software-de-gest-o-/releases/download/apk-latest/oficina-tycoon.apk
```

⚠️ **É preciso ativar o workflow primeiro** — instruções em
[`ci/COMO-GERAR-O-APK.md`](./ci/COMO-GERAR-O-APK.md).

## 🎮 O jogo

### Modo gestão (oficina)

1. **Oficina** — clientes chegam à fila com um veículo e um serviço, cada um
   com uma barra de paciência. Se esgotar, vão-se embora e perdes reputação.
2. Para **aceitar** precisas de peças em stock, baia livre e mecânico
   disponível. Escolhes quem faz o trabalho: nível (★1–★5) e energia ditam a
   rapidez.
3. **Peças** — compra antes de precisares; vender devolve só 60%.
4. **Equipa** — contrata mecânicos e dá-lhes café ☕ quando cansam.
5. **Melhorias** — baias, ferramentas, marketing, armazém, formação e sala de
   espera.
6. A cada 120 s passa um dia: pagas salários + renda.

### Modo condução 3D (reboque) 🚛

Alguns clientes aparecem marcados **"🚛 Avariado na estrada"** — esses **não
podem ser reparados** até os ires buscar, e pagam **+45%**.

- Toca em **"Ir buscar com o reboque"** (ou no botão de passeio livre).
- Conduz até ao carro seguindo a **seta e a distância** no HUD.
- Chega perto e pára: a **rampa desce** e o botão **🪝 Guinchar** acende.
- Leva o carro à oficina e carrega em **📥 Descarregar** para receber o bónus
  de reboque. O trabalho fica então disponível para reparar.

A simulação da oficina **congela enquanto conduzes** — não perdes clientes.

### 🎥 Câmaras (estilo ETS2)

Sete vistas, comutáveis a qualquer momento (tecla `C` no browser):

| Ícone | Vista | Descrição |
|---|---|---|
| 🪟 | Cabine | Sentado ao volante, do lado esquerdo — a vista clássica |
| 🔭 | Capô | Logo à frente do para-brisas |
| 🎥 | Perseguição | Atrás do camião, com FOV que abre com a velocidade |
| 🎬 | Cinemática | Ângulo largo e lateral, com atraso suave |
| 🪞 | Retrovisor | Espelho esquerdo, a olhar para o atrelado e a carga |
| 🛞 | Roda | Rente ao chão, na cava da roda dianteira |
| 🛰️ | Aérea | Vista de cima, útil para manobrar |

### Condução

- **Volante** — arrasta na roda (esquerda/direita).
- **Pedais** — ⛽ acelerador e 🛑 travão.
- **D / R** — muda entre marcha à frente e atrás.
- **☀️/🌙** — alterna dia/noite (acende faróis e iluminação pública).

Física de camião com atrelado articulado: o reboque segue o engate, a direção
fecha com a velocidade, e **com carga o camião acelera e trava mais devagar**
(~72 km/h vazio vs ~54 km/h carregado).

Teclado (para testar no browser): `W/S` ou setas, `A/D` direção, `espaço`
travão de mão, `R` marcha-atrás, `C` mudar de câmara.

## 🛠️ Desenvolvimento

```bash
cd oficina-tycoon
npm install
npm run dev      # http://localhost:5173
npm run build
```

## 📁 Estrutura

```
src/game/        MODO GESTÃO
  types.ts       modelos de dados
  data.ts        conteúdo e balanceamento
  engine.ts      simulação (tick) e ações — lógica pura, testável
  store.ts       hook React: loop de 500 ms, autosave, toasts

src/sim/         MODO CONDUÇÃO 3D
  truck.ts       física do camião + atrelado (bicycle model)
  models.ts      geometria: camião, carros, prédios, oficina
  world.ts       mundo: grelha de estradas, cidade, árvores instanciadas
  scene.ts       cena Three.js, 7 câmaras, missões, tráfego, dia/noite

src/App.tsx      UI da gestão (5 separadores)
src/Drive.tsx    UI da condução (volante, pedais, HUD)
```

### Notas de performance

O mundo corre em ~450 draw calls e ~48k triângulos. As janelas dos prédios e
as árvores usam `InstancedMesh` (sem isso eram ~3400 draw calls), o
`pixelRatio` está limitado a 1.75 e as sombras usam `PCFShadowMap` com o
frustum apertado à volta do camião.
