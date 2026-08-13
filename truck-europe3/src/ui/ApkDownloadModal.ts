import { SoundManager } from '../audio/SoundManager';

export class ApkDownloadModal {
  private modalEl: HTMLElement;
  private soundManager: SoundManager;

  constructor(soundManager: SoundManager) {
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-apk-download';
    this.modalEl.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden select-none';
    document.body.appendChild(this.modalEl);

    this.render();
  }

  public show() {
    this.render();
    this.modalEl.classList.remove('hidden');
  }

  public hide() {
    this.modalEl.classList.add('hidden');
  }

  private render() {
    this.modalEl.innerHTML = `
      <div class="bg-slate-950 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-xl">
              📲
            </div>
            <div>
              <h2 class="text-base font-black text-white">Truck Simulator - Instalação Offline & APK</h2>
              <p class="text-xs text-slate-400">Jogue 100% offline no celular em qualquer tela horizontal</p>
            </div>
          </div>

          <button id="btn-close-apk-modal" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-all">✕</button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          
          <!-- Option 1: One-Click PWA App Installation -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-lg">⚡</span>
                <b class="text-sm text-white font-bold">1. Instalação Direta no Celular (PWA Offline)</b>
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px]">Recomendado</span>
            </div>
            <p class="text-slate-400 leading-relaxed">
              O jogo possui <b>ServiceWorker</b> configurado para cache offline completo. No seu navegador (Chrome / Safari / Edge):
            </p>
            <ol class="list-decimal list-inside space-y-1 text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <li>Toque nos <b>3 pontinhos</b> (Menu) do navegador.</li>
              <li>Selecione <b>"Instalar Aplicativo"</b> ou <b>"Adicionar à Tela Inicial"</b>.</li>
              <li>O jogo abrirá como um aplicativo nativo em tela cheia horizontal e funcionará <b>mesmo sem internet</b>!</li>
            </ol>
          </div>

          <!-- Option 2: Standalone Zip Package & Android APK wrapper -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div class="flex items-center gap-2">
              <span class="text-lg">📦</span>
              <b class="text-sm text-white font-bold">2. Pacote do Jogo Completo Offline (.ZIP / APK Web)</b>
            </div>
            <p class="text-slate-400 leading-relaxed">
              Baixe todos os arquivos HTML5/3D e código-fonte prontos para empacotar em APK com <b>Capacitor</b>, <b>Cordova</b> ou <b>Android Studio WebView</b>.
            </p>
            <button id="btn-download-bundle" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer">
              <span>📥</span>
              <span>Baixar Pacote do Jogo Offline (.ZIP)</span>
            </button>
          </div>

          <!-- Features included -->
          <div class="bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div>✔️ Suporte a qualquer resolução de tela (20:9, 19.5:9, 16:9, Tablets)</div>
            <div>✔️ Modo Motorista a Pé com controle por Joystick virtual</div>
            <div>✔️ Câmera interna com ajuste fino de altura do banco e visão</div>
            <div>✔️ Física completa com 12 marchas, engate de carreta e tráfego IA</div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400 flex justify-end">
          <button id="btn-footer-close-apk" class="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-all active:scale-95">Fechar</button>
        </div>
      </div>
    `;

    // Handlers
    this.modalEl.querySelector('#btn-close-apk-modal')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });
    this.modalEl.querySelector('#btn-footer-close-apk')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });

    this.modalEl.querySelector('#btn-download-bundle')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.triggerBundleDownload();
    });
  }

  private triggerBundleDownload() {
    const htmlContent = document.documentElement.outerHTML;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'truckers-of-europe-3-offline.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('Arquivo offline baixado com sucesso!');
  }
}
