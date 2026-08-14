# 📥 Como obter o APK do Oficina Tycoon 3D

O ambiente onde o jogo foi desenvolvido **não tem acesso de rede** ao Android
SDK nem ao Maven/Google, por isso o APK não pode ser compilado aqui. O build
está preparado para correr no **GitHub Actions**, que compila e publica o APK
com um **link de download direto**.

Falta **um passo manual** (30 segundos), porque a app que fez os commits não
tem permissão para escrever dentro de `.github/workflows/`.

---

## Passo único: ativar o workflow

### Pela interface do GitHub (mais fácil)

1. Abre o repositório no branch `arena/019fff48-software-de-gest-o`.
2. **Add file → Create new file**.
3. No nome do ficheiro escreve exatamente:
   ```
   .github/workflows/build-apk.yml
   ```
4. Cola o conteúdo do ficheiro [`oficina-tycoon/ci/build-apk.yml`](./build-apk.yml).
5. **Commit** (para o mesmo branch).

### Ou por linha de comandos

```bash
git clone https://github.com/urp211/Software-de-gest-o-.git
cd Software-de-gest-o-
git checkout arena/019fff48-software-de-gest-o
mkdir -p .github/workflows
cp oficina-tycoon/ci/build-apk.yml .github/workflows/build-apk.yml
git add .github/workflows/build-apk.yml
git commit -m "ci: build do APK"
git push
```

---

## O que acontece a seguir

O build arranca sozinho (~4–6 min) e produz o APK em **dois sítios**:

### 1. Link direto e permanente (Releases) ⭐

Assim que o build terminar, o APK fica disponível neste endereço fixo — é o
link que podes abrir diretamente no telemóvel:

```
https://github.com/urp211/Software-de-gest-o-/releases/download/apk-latest/oficina-tycoon.apk
```

Também aparece em **Releases → Oficina Tycoon 3D — APK**.

> Nota: o link só funciona **depois** da primeira execução do workflow
> terminar com sucesso. Se der 404, o build ainda não correu.

### 2. Artefacto da execução

**Actions → Build APK →** (última execução) **→ Artifacts →
`oficina-tycoon-apk`**. Vem dentro de um `.zip`.

---

## Instalar no telemóvel

1. Abre o link do APK no browser do Android e transfere.
2. O Android vai pedir para permitir **"instalar de fontes desconhecidas"**
   para o browser — aceita.
3. Abre o ficheiro transferido e instala.
4. O jogo abre em **ecrã cheio, na horizontal**.

---

## Alternativa: compilar no teu computador

Precisas de **JDK 17+** e do **Android SDK** (basta ter o Android Studio).

```bash
cd oficina-tycoon
npm install
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
```

APK em `oficina-tycoon/android/app/build/outputs/apk/debug/app-debug.apk`.

Ou abre a pasta `oficina-tycoon/android` no Android Studio e carrega em ▶ Run
com o telemóvel ligado por USB.

---

## Sobre a assinatura

O APK é **debug** (assinado com a chave de debug do Android) — instala e joga
sem problemas. Para publicar na Google Play seria preciso criar um keystore de
release e usar `assembleRelease`.
