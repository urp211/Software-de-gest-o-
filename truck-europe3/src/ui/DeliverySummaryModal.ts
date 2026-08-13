import confetti from 'canvas-confetti';
import type { CargoJob } from '../game/types';
import { SoundManager } from '../audio/SoundManager';

export class DeliverySummaryModal {
  private modalEl: HTMLElement;
  private soundManager: SoundManager;
  public onContinue?: () => void;

  constructor(soundManager: SoundManager) {
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-delivery-summary';
    this.modalEl.className = 'fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden select-none';
    document.body.appendChild(this.modalEl);
  }

  public show(job: CargoJob, reward: number, xp: number) {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    this.modalEl.innerHTML = `
      <div class="bg-slate-950 border-2 border-emerald-500/80 rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
        
        <!-- Trophy / Badge -->
        <div class="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-2xl mb-4">
          <div class="w-full h-full bg-slate-950 rounded-3xl flex items-center justify-center text-4xl">
            🏆
          </div>
        </div>

        <h2 class="text-2xl font-black text-white tracking-tight">Delivery Completed!</h2>
        <p class="text-xs text-emerald-400 font-semibold uppercase tracking-wider mt-0.5 mb-4">Cargo Delivered Safely & On Time</p>

        <!-- Rating Stars -->
        <div class="flex gap-1.5 text-amber-400 text-xl mb-4">
          <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
        </div>

        <!-- Job Details Card -->
        <div class="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-left space-y-2 mb-5">
          <div class="text-xs text-slate-400">Cargo: <b class="text-slate-200">${job.title}</b></div>
          <div class="text-xs text-slate-400">Route: <b class="text-slate-200">${job.origin} ➔ ${job.destination}</b></div>
          <div class="text-xs text-slate-400">Cargo Weight: <b class="text-amber-400">${job.weightTonnes} Tonnes</b></div>
          
          <div class="border-t border-slate-800 pt-2 flex justify-between items-center">
            <span class="text-xs font-bold text-slate-300">Total Payment:</span>
            <span class="text-xl font-black text-emerald-400">+€${reward.toLocaleString()}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs font-bold text-slate-300">Driver Experience:</span>
            <span class="text-base font-black text-sky-400">+${xp} XP</span>
          </div>
        </div>

        <!-- Continue Button -->
        <button id="btn-delivery-continue" class="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm tracking-wide shadow-xl active:scale-95 transition-all cursor-pointer">
          Claim Rewards & Continue ➔
        </button>
      </div>
    `;

    this.modalEl.classList.remove('hidden');

    this.modalEl.querySelector('#btn-delivery-continue')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.modalEl.classList.add('hidden');
      this.onContinue?.();
    });
  }
}
