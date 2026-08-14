# Como gerar o APK do Oficina Tycoon

O ambiente onde o jogo foi desenvolvido não tem acesso de rede aos
repositórios do Google/Maven nem ao Android SDK, por isso o APK compila-se no
**GitHub Actions**. O workflow já está pronto neste repositório — só falta um
passo manual, porque a app que fez o commit não tem permissão para escrever
dentro de `.github/workflows/`.

## Opção A — GitHub Actions (recomendado, 2 minutos, sem instalar nada)

1. No GitHub, abre este repositório no branch
   `arena/019fff48-software-de-gest-o`.
2. Copia o ficheiro `oficina-tycoon/ci/build-apk.yml` para
   `.github/workflows/build-apk.yml`.

   Pela interface web: **Add file → Create new file**, escreve o caminho
   `.github/workflows/build-apk.yml` e cola o conteúdo de
   `oficina-tycoon/ci/build-apk.yml`. Commit no mesmo branch.

   Ou por linha de comandos, no teu computador:

   ```bash
   git clone https://github.com/urp211/Software-de-gest-o-.git
   cd Software-de-gest-o-
   git checkout arena/019fff48-software-de-gest-o
   mkdir -p .github/workflows
   cp oficina-tycoon/ci/build-apk.yml .github/workflows/build-apk.yml
   git add .github/workflows/build-apk.yml
   git commit -m "ci: workflow para gerar APK"
   git push
   ```

3. O build arranca sozinho. Vai a **Actions → Build APK**, espera ~4 min.
4. No fim da execução, secção **Artifacts**, descarrega
   **`oficina-tycoon-apk`** → contém `oficina-tycoon-debug.apk`.
5. Passa o ficheiro para o telemóvel Android, permite "instalar de fontes
   desconhecidas" e instala.

## Opção B — compilar no teu computador

Precisas de **JDK 17+** e do **Android SDK** (basta o Android Studio instalado).

```bash
cd oficina-tycoon
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK gerado em:
`oficina-tycoon/android/app/build/outputs/apk/debug/app-debug.apk`

Ou abre a pasta `oficina-tycoon/android` no Android Studio e carrega em ▶ Run
para instalar direto num telemóvel ligado por USB.

## Nota sobre assinatura

O APK produzido é **debug** — assinado com a chave de debug do Android. Serve
perfeitamente para instalar e jogar. Para publicar na Google Play é preciso
criar um keystore de release e trocar `assembleDebug` por `assembleRelease`
com a configuração de assinatura.
