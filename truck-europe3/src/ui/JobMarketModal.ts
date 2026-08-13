import { MissionManager } from '../game/MissionManager';
import { SoundManager } from '../audio/SoundManager';
import type { CargoJob } from '../game/types';

export class JobMarketModal {
  private modalEl: HTMLElement;
  private missionManager: MissionManager;
  private soundManager: SoundManager;
  public onJobSelected?: (job: CargoJob) => void;

  constructor(missionManager: MissionManager, soundManager: SoundManager) {
    this.missionManager = missionManager;
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-job-market';
    this.modalEl.className = 'fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 hidden select-none';
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
    const jobs = MissionManager.JOBS_CATALOG;

    const cardsHtml = jobs.map((job) => {
      const isCurrent = this.missionManager.currentJob?.id === job.id;
      const typeIcons: { [key: string]: string } = {
        curtain: '📦 Curtainside Semi-Trailer',
        container: '🚢 40ft Shipping Container',
        tanker: '⛽ ADR Hazardous Tanker',
        refrigerated: '❄️ Cold Chain Thermo-Box'
      };

      return `
        <div class="bg-slate-900 border ${isCurrent ? 'border-emerald-500 ring-2 ring-emerald-500/50' : 'border-slate-800 hover:border-slate-600'} rounded-2xl p-4 flex flex-col justify-between transition-all shadow-xl">
          <div>
            <div class="flex justify-between items-start mb-2">
              <span class="text-xs font-bold text-sky-400 uppercase tracking-wide">${typeIcons[job.trailerType] || job.trailerType}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                job.difficulty === 'easy' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                job.difficulty === 'medium' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                'bg-red-950 text-red-400 border border-red-800'
              }">${job.difficulty}</span>
            </div>

            <h3 class="text-base font-black text-white mb-1">${job.title}</h3>
            
            <div class="grid grid-cols-2 gap-2 my-3 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
              <div><span class="text-slate-500">From:</span> <b class="text-slate-200">${job.origin}</b></div>
              <div><span class="text-slate-500">To:</span> <b class="text-slate-200">${job.destination}</b></div>
              <div><span class="text-slate-500">Weight:</span> <b class="text-amber-400">${job.weightTonnes} Tonnes</b></div>
              <div><span class="text-slate-500">Distance:</span> <b class="text-sky-400">${job.distanceKm} km</b></div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <div>
              <div class="text-[10px] text-slate-400 uppercase">Contract Payment</div>
              <div class="text-lg font-black text-emerald-400">€${job.reward.toLocaleString()} <span class="text-xs text-slate-400 font-normal">(+${job.xpReward} XP)</span></div>
            </div>

            <button data-job-id="${job.id}" class="btn-select-job px-4 py-2 rounded-xl font-bold text-xs ${
              isCurrent ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
            } transition-all shadow-md">
              ${isCurrent ? 'Active Contract' : 'Accept Job'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.modalEl.innerHTML = `
      <div class="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500 flex items-center justify-center text-xl">
              🚛
            </div>
            <div>
              <h2 class="text-lg font-black text-white">European Freight Dispatch Market</h2>
              <p class="text-xs text-slate-400">Select freight contracts to transport across Europe</p>
            </div>
          </div>

          <button id="btn-close-jobs" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base transition-all">✕</button>
        </div>

        <!-- Jobs Grid -->
        <div class="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          ${cardsHtml}
        </div>

        <!-- Footer Info -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400 flex justify-between items-center">
          <span>💡 Tip: Navigate to origin loading dock and press <b>SPACE</b> to couple trailer.</span>
          <button id="btn-footer-close-jobs" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all">Close</button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#btn-close-jobs')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });
    this.modalEl.querySelector('#btn-footer-close-jobs')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });

    const selectBtns = this.modalEl.querySelectorAll('.btn-select-job');
    selectBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const jobId = (e.currentTarget as HTMLElement).getAttribute('data-job-id');
        if (jobId) {
          const job = MissionManager.JOBS_CATALOG.find(j => j.id === jobId);
          if (job) {
            this.soundManager.playButtonClick();
            this.onJobSelected?.(job);
            this.hide();
          }
        }
      });
    });
  }
}
