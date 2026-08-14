# 🔧 Oficina Tycoon

Jogo mobile de simulação/gestão de uma oficina automóvel. Geres a fila de
clientes, o stock de peças, a equipa de mecânicos e as melhorias das
instalações — tudo em tempo real.

Feito em **React + TypeScript + Vite**, empacotado como **APK Android** com
**Capacitor**.

## Como se joga

1. **Oficina** — clientes chegam à fila com um veículo e um serviço. Cada um
   tem uma barra de paciência: se esgotar, vai embora e perdes reputação.
2. Para **aceitar** precisas de: peças em stock, uma baia livre e um mecânico
   disponível. Escolhes quem faz o trabalho — nível e energia ditam a rapidez.
3. **Peças** — compra antes de precisares. Vender devolve só 60% do valor.
4. **Equipa** — contrata mecânicos, dá-lhes café ☕ quando a energia baixa.
   Eles sobem de nível (★1–★5) à medida que trabalham.
5. **Melhorias** — 6 linhas de upgrade: baias, ferramentas, marketing,
   armazém, formação e sala de espera.
6. A cada **120 s** passa um dia de jogo: pagas salários + renda. Não fiques
   sem caixa.

Sobes de nível de oficina com XP, o que desbloqueia serviços e peças mais
caras (Distribuição, Embraiagem, Recondicionar motor…).

O progresso guarda-se automaticamente em `localStorage` (inclui até 2 min de
progresso offline).

## Desenvolvimento

```bash
cd oficina-tycoon
npm install
npm run dev      # http://localhost:5173
npm run build    # bundle de produção em dist/
```

## Gerar o APK

O sandbox de desenvolvimento não tem acesso ao Maven/Google, por isso o APK é
compilado no **GitHub Actions**: `oficina-tycoon/ci/build-apk.yml` (ver `ci/COMO-GERAR-O-APK.md`).

- Corre automaticamente em cada push a `arena/**` que toque em `oficina-tycoon/`.
- Também podes lançá-lo à mão em **Actions → Build APK → Run workflow**.
- No fim, descarrega o artefacto **`oficina-tycoon-apk`** (contém
  `oficina-tycoon-debug.apk`).

No telemóvel Android: ativa "instalar de fontes desconhecidas" e abre o ficheiro.

### Build local (se tiveres Android SDK + JDK 17+)

```bash
cd oficina-tycoon
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug
# android/app/build/outputs/apk/debug/app-debug.apk
```

> O APK gerado é *debug* (assinado com a chave de debug) — perfeito para
> testar. Para publicar na Play Store é preciso um keystore de release.

## Estrutura

```
src/game/types.ts    modelos de dados
src/game/data.ts     conteúdo: peças, serviços, veículos, upgrades, balanço
src/game/engine.ts   simulação (tick) e ações do jogador — puro, testável
src/game/store.ts    hook React: loop de 500 ms, autosave, toasts
src/App.tsx          UI mobile (5 separadores)
```
