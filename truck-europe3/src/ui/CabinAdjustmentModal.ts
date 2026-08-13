import type { CabinSeatSettings } from '../game/types';
import { SoundManager } from '../audio/SoundManager';
import { EconomyManager } from '../game/EconomyManager';

export class CabinAdjustmentModal {
  private modalEl: HTMLElement;
  private economy: EconomyManager;
  private soundManager: SoundManager;
  public onSettingsChanged?: (settings: CabinSeatSettings) => void;

  constructor(economy: EconomyManager, soundManager: SoundManager) {
    this.economy = economy;
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-cabin-adjust';
    this.modalEl.className = 'fixed top-4 right-4 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-5 shadow-2xl z-50 hidden select-none max-w-xs w-full';
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

  public toggle(): boolean {
    if (this.modalEl.classList.contains('hidden')) {
      this.show();
      return true;
    } else {
      this.hide();
      return false;
    }
  }

  private render() {
    const profile = this.economy.getProfile();
    const s = profile.seatSettings || {
      height: 0,
      distance: 0,
      lateral: 0,
      pitch: 0,
      fov: 65
    };

    this.modalEl.innerHTML = `
      <div class="flex justify-between items-center mb-4 border-b border-slate-800 pb-2.5">
        <div class="flex items-center gap-2">
          <span class="text-lg">💺</span>
          <h3 class="text-sm font-black text-white uppercase tracking-wider">Ajuste de Cabine</h3>
        </div>
        <button id="btn-close-cabin-adjust" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all">✕</button>
      </div>

      <div class="space-y-3.5 text-xs text-slate-300">
        <!-- Altura do Banco (Height) -->
        <div>
          <div class="flex justify-between font-semibold mb-1">
            <span>Altura do Banco (Y)</span>
            <span id="val-seat-height" class="font-mono text-sky-400">${(s.height * 100).toFixed(0)} cm</span>
          </div>
          <input type="range" id="seat-height" min="-0.25" max="0.30" step="0.02" value="${s.height}" class="w-full accent-sky-500 cursor-pointer">
        </div>

        <!-- Distância Frente / Trás (Distance) -->
        <div>
          <div class="flex justify-between font-semibold mb-1">
            <span>Distância Volante (Z)</span>
            <span id="val-seat-dist" class="font-mono text-sky-400">${(s.distance * 100).toFixed(0)} cm</span>
          </div>
          <input type="range" id="seat-dist" min="-0.30" max="0.35" step="0.02" value="${s.distance}" class="w-full accent-sky-500 cursor-pointer">
        </div>

        <!-- Posição Lateral (Lateral) -->
        <div>
          <div class="flex justify-between font-semibold mb-1">
            <span>Posição Lateral (X)</span>
            <span id="val-seat-lat" class="font-mono text-sky-400">${(s.lateral * 100).toFixed(0)} cm</span>
          </div>
          <input type="range" id="seat-lat" min="-0.15" max="0.15" step="0.01" value="${s.lateral}" class="w-full accent-sky-500 cursor-pointer">
        </div>

        <!-- Campo de Visão (FOV) -->
        <div>
          <div class="flex justify-between font-semibold mb-1">
            <span>Campo de Visão (FOV)</span>
            <span id="val-seat-fov" class="font-mono text-sky-400">${s.fov}°</span>
          </div>
          <input type="range" id="seat-fov" min="50" max="85" step="1" value="${s.fov}" class="w-full accent-amber-500 cursor-pointer">
        </div>

        <!-- Inclinação do Olhar (Pitch) -->
        <div>
          <div class="flex justify-between font-semibold mb-1">
            <span>Inclinação do Olhar</span>
            <span id="val-seat-pitch" class="font-mono text-sky-400">${(s.pitch * 50).toFixed(0)}°</span>
          </div>
          <input type="range" id="seat-pitch" min="-0.2" max="0.2" step="0.02" value="${s.pitch}" class="w-full accent-sky-500 cursor-pointer">
        </div>
      </div>

      <div class="flex gap-2 mt-4 pt-3 border-t border-slate-800">
        <button id="btn-reset-seat" class="flex-1 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all active:scale-95">Reset</button>
        <button id="btn-save-seat" class="flex-1 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-xs transition-all active:scale-95 shadow-md">Salvar</button>
      </div>
    `;

    // Event Handlers
    this.modalEl.querySelector('#btn-close-cabin-adjust')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });

    const updateFromInputs = () => {
      const height = parseFloat((this.modalEl.querySelector('#seat-height') as HTMLInputElement).value);
      const distance = parseFloat((this.modalEl.querySelector('#seat-dist') as HTMLInputElement).value);
      const lateral = parseFloat((this.modalEl.querySelector('#seat-lat') as HTMLInputElement).value);
      const fov = parseInt((this.modalEl.querySelector('#seat-fov') as HTMLInputElement).value, 10);
      const pitch = parseFloat((this.modalEl.querySelector('#seat-pitch') as HTMLInputElement).value);

      (this.modalEl.querySelector('#val-seat-height') as HTMLElement).innerText = `${(height * 100).toFixed(0)} cm`;
      (this.modalEl.querySelector('#val-seat-dist') as HTMLElement).innerText = `${(distance * 100).toFixed(0)} cm`;
      (this.modalEl.querySelector('#val-seat-lat') as HTMLElement).innerText = `${(lateral * 100).toFixed(0)} cm`;
      (this.modalEl.querySelector('#val-seat-fov') as HTMLElement).innerText = `${fov}°`;
      (this.modalEl.querySelector('#val-seat-pitch') as HTMLElement).innerText = `${(pitch * 50).toFixed(0)}°`;

      const settings: CabinSeatSettings = { height, distance, lateral, fov, pitch };
      this.economy.getProfile().seatSettings = settings;
      this.economy.save();
      this.onSettingsChanged?.(settings);
      this.soundManager.playSeatAdjustSound();
    };

    ['#seat-height', '#seat-dist', '#seat-lat', '#seat-fov', '#seat-pitch'].forEach((id) => {
      this.modalEl.querySelector(id)?.addEventListener('input', updateFromInputs);
    });

    this.modalEl.querySelector('#btn-reset-seat')?.addEventListener('click', () => {
      const def: CabinSeatSettings = { height: 0, distance: 0, lateral: 0, pitch: 0, fov: 65 };
      this.economy.getProfile().seatSettings = def;
      this.economy.save();
      this.render();
      this.onSettingsChanged?.(def);
      this.soundManager.playSeatAdjustSound();
    });

    this.modalEl.querySelector('#btn-save-seat')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });
  }
}
