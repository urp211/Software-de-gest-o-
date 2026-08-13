import { EconomyManager } from '../game/EconomyManager';
import { SoundManager } from '../audio/SoundManager';

export class GarageModal {
  private modalEl: HTMLElement;
  private economy: EconomyManager;
  private soundManager: SoundManager;
  public onTruckCustomized?: (truckId: string, color: string, metallic: number) => void;
  public onTruckChanged?: (truckId: string) => void;

  constructor(economy: EconomyManager, soundManager: SoundManager) {
    this.economy = economy;
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-garage';
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
    const profile = this.economy.getProfile();
    const currentTruck = EconomyManager.AVAILABLE_TRUCKS.find(t => t.id === profile.currentTruckId) || EconomyManager.AVAILABLE_TRUCKS[0];
    const userCustom = profile.customizations[currentTruck.id] || { color: currentTruck.color, metallic: currentTruck.metallic };

    const trucksHtml = EconomyManager.AVAILABLE_TRUCKS.map((truck) => {
      const isOwned = profile.ownedTruckIds.includes(truck.id);
      const isSelected = profile.currentTruckId === truck.id;

      return `
        <div class="bg-slate-900 border ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/50' : 'border-slate-800'} rounded-2xl p-4 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-xs font-bold text-amber-400 uppercase">${truck.brand}</span>
              <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">${truck.chassis}</span>
            </div>
            <h3 class="text-base font-black text-white mb-2">${truck.name}</h3>

            <div class="space-y-1.5 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 mb-3">
              <div class="flex justify-between"><span>Power:</span> <b class="text-emerald-400">${truck.engineHp} HP</b></div>
              <div class="flex justify-between"><span>Torque:</span> <b class="text-sky-400">${truck.torque} Nm</b></div>
              <div class="flex justify-between"><span>Top Speed:</span> <b class="text-amber-400">${truck.topSpeed} km/h</b></div>
              <div class="flex justify-between"><span>Fuel Tank:</span> <b class="text-slate-200">${truck.fuelCapacity} L</b></div>
            </div>
          </div>

          <div class="flex items-center justify-between pt-2 border-t border-slate-800">
            <div class="text-base font-black ${isOwned ? 'text-slate-400' : 'text-emerald-400'}">
              ${isOwned ? 'OWNED' : `€${truck.price.toLocaleString()}`}
            </div>

            ${isSelected ? `
              <span class="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs">Active</span>
            ` : isOwned ? `
              <button data-select-truck="${truck.id}" class="btn-select-truck px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs transition-all active:scale-95">Drive</button>
            ` : `
              <button data-buy-truck="${truck.id}" class="btn-buy-truck px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95">Buy</button>
            `}
          </div>
        </div>
      `;
    }).join('');

    const presetColors = ['#dc2626', '#2563eb', '#059669', '#d97706', '#7c3aed', '#0f172a', '#f8fafc', '#475569'];
    const colorSwatchesHtml = presetColors.map(c => `
      <button data-color="${c}" class="btn-color-swatch w-8 h-8 rounded-full border-2 ${userCustom.color === c ? 'border-white scale-110' : 'border-slate-700'} shadow-md transition-all active:scale-90" style="background-color: ${c}"></button>
    `).join('');

    this.modalEl.innerHTML = `
      <div class="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500 flex items-center justify-center text-xl">
              🏢
            </div>
            <div>
              <h2 class="text-lg font-black text-white">Truck Dealership & Custom Workshop</h2>
              <p class="text-xs text-slate-400">Balance: <b class="text-emerald-400">€${profile.money.toLocaleString()}</b></p>
            </div>
          </div>

          <button id="btn-close-garage" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base transition-all">✕</button>
        </div>

        <!-- Body Split: Dealership & Workshop -->
        <div class="p-6 overflow-y-auto space-y-6">
          
          <!-- Dealership Section -->
          <div>
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider mb-3">Available Trucks</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              ${trucksHtml}
            </div>
          </div>

          <!-- Paint & Tuning Workshop Section -->
          <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h3 class="text-sm font-black text-slate-200 uppercase tracking-wider mb-3">Paint Shop & Tuning (${currentTruck.name})</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Colors -->
              <div>
                <label class="text-xs text-slate-400 block mb-2 font-semibold">Custom Paint Color</label>
                <div class="flex items-center gap-2 mb-3">
                  ${colorSwatchesHtml}
                </div>
                <div class="flex items-center gap-3">
                  <input type="color" id="picker-color" value="${userCustom.color}" class="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0">
                  <span class="text-xs text-slate-300 font-mono" id="label-hex">${userCustom.color}</span>
                </div>
              </div>

              <!-- Metallic / Finish Slider -->
              <div>
                <label class="text-xs text-slate-400 block mb-2 font-semibold">Metallic Gloss Finish</label>
                <input type="range" id="slider-metallic" min="0" max="1" step="0.05" value="${userCustom.metallic}" class="w-full accent-amber-500 cursor-pointer">
                <div class="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Matte (0%)</span>
                  <span>Gloss Metallic (100%)</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400 flex justify-end">
          <button id="btn-footer-close-garage" class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95">Save & Drive</button>
        </div>
      </div>
    `;

    // Event Handlers
    this.modalEl.querySelector('#btn-close-garage')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });
    this.modalEl.querySelector('#btn-footer-close-garage')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });

    // Color Swatches
    this.modalEl.querySelectorAll('.btn-color-swatch').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const color = (e.currentTarget as HTMLElement).getAttribute('data-color');
        if (color) {
          this.soundManager.playButtonClick();
          this.economy.updateTruckColor(currentTruck.id, color, userCustom.metallic);
          this.onTruckCustomized?.(currentTruck.id, color, userCustom.metallic);
          this.render();
        }
      });
    });

    // Color Picker
    const picker = this.modalEl.querySelector('#picker-color') as HTMLInputElement;
    picker?.addEventListener('input', (e) => {
      const color = (e.target as HTMLInputElement).value;
      const hexLabel = this.modalEl.querySelector('#label-hex');
      if (hexLabel) hexLabel.textContent = color;
      this.economy.updateTruckColor(currentTruck.id, color, userCustom.metallic);
      this.onTruckCustomized?.(currentTruck.id, color, userCustom.metallic);
    });

    // Metallic slider
    const slider = this.modalEl.querySelector('#slider-metallic') as HTMLInputElement;
    slider?.addEventListener('input', (e) => {
      const metallic = parseFloat((e.target as HTMLInputElement).value);
      this.economy.updateTruckColor(currentTruck.id, userCustom.color, metallic);
      this.onTruckCustomized?.(currentTruck.id, userCustom.color, metallic);
    });

    // Buy Truck
    this.modalEl.querySelectorAll('.btn-buy-truck').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const truckId = (e.currentTarget as HTMLElement).getAttribute('data-buy-truck');
        if (truckId) {
          if (this.economy.buyTruck(truckId)) {
            this.soundManager.playJobSuccess();
            this.onTruckChanged?.(truckId);
            this.render();
          } else {
            alert('Insufficient funds to purchase this truck!');
          }
        }
      });
    });

    // Select Truck
    this.modalEl.querySelectorAll('.btn-select-truck').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const truckId = (e.currentTarget as HTMLElement).getAttribute('data-select-truck');
        if (truckId) {
          this.soundManager.playButtonClick();
          this.economy.selectTruck(truckId);
          this.onTruckChanged?.(truckId);
          this.render();
        }
      });
    });
  }
}
