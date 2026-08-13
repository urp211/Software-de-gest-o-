import { WeatherSystem } from '../game/WeatherSystem';
import { SoundManager } from '../audio/SoundManager';
import type { WeatherType, CameraView } from '../game/types';

export class PauseSettingsModal {
  private modalEl: HTMLElement;
  private weatherSystem: WeatherSystem;
  private soundManager: SoundManager;
  public onCameraSelected?: (view: CameraView) => void;

  constructor(weatherSystem: WeatherSystem, soundManager: SoundManager) {
    this.weatherSystem = weatherSystem;
    this.soundManager = soundManager;

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'modal-settings';
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
    const weatherOptions: { type: WeatherType; label: string; icon: string }[] = [
      { type: 'sunny', label: 'Clear Noon', icon: '☀️' },
      { type: 'rainy', label: 'Heavy Rain', icon: '🌧️' },
      { type: 'sunset', label: 'Golden Sunset', icon: '🌅' },
      { type: 'night', label: 'Midnight', icon: '🌙' },
      { type: 'foggy', label: 'Misty Fog', icon: '🌫️' }
    ];

    const weatherButtonsHtml = weatherOptions.map(w => `
      <button data-weather="${w.type}" class="btn-set-weather flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${
        this.weatherSystem.currentWeather === w.type ? 'bg-sky-600/30 border-sky-400 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
      } text-xs font-bold transition-all active:scale-95">
        <span class="text-base">${w.icon}</span>
        <span>${w.label}</span>
      </button>
    `).join('');

    const cameras: { view: CameraView; label: string; desc: string }[] = [
      { view: 'chase', label: 'Chase Camera (3rd Person)', desc: 'Orbit exterior truck view' },
      { view: 'cabin', label: 'Cockpit View (1st Person)', desc: 'Driver seat interior with turning steering wheel' },
      { view: 'top', label: 'Top-Down Drone', desc: 'Overhead view for docking & parking' },
      { view: 'cinematic', label: 'Cinematic Bumper', desc: 'Low-angle dynamic speed view' }
    ];

    const cameraButtonsHtml = cameras.map(c => `
      <button data-camera="${c.view}" class="btn-set-camera w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-left transition-all active:scale-98">
        <div>
          <div class="text-xs font-bold text-white">${c.label}</div>
          <div class="text-[10px] text-slate-400">${c.desc}</div>
        </div>
        <span class="text-sky-400 font-bold text-xs">Select ➜</span>
      </button>
    `).join('');

    this.modalEl.innerHTML = `
      <div class="bg-slate-950 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <!-- Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <h2 class="text-lg font-black text-white">Configurações & Controles</h2>
              <p class="text-xs text-slate-400">Truck Simulator 3D</p>
            </div>
          </div>

          <button id="btn-close-settings" class="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-base transition-all">✕</button>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-6">
          
          <!-- Weather / Sky Selection -->
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">Atmosphere & Weather</h3>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              ${weatherButtonsHtml}
            </div>
          </div>

          <!-- Camera Views -->
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">Camera Presets</h3>
            <div class="space-y-2">
              ${cameraButtonsHtml}
            </div>
          </div>

          <!-- Audio Settings -->
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">Audio Engine</h3>
            <div class="bg-slate-900 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <span class="text-xs text-slate-300 font-semibold">Mute / Unmute Sounds</span>
              <button id="btn-toggle-mute" class="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all">
                Toggle Sound 🔊
              </button>
            </div>
          </div>

          <!-- Controls Guide -->
          <div>
            <h3 class="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5">Full Driving Controls</h3>
            <div class="bg-slate-900/70 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-[11px] text-slate-300 font-mono">
              <div><b class="text-sky-400">W / Up Arrow:</b> Accelerate</div>
              <div><b class="text-red-400">S / Down Arrow:</b> Brake</div>
              <div><b class="text-sky-400">A / D:</b> Steer Left / Right</div>
              <div><b class="text-amber-400">SPACE:</b> Handbrake / Hitch</div>
              <div><b class="text-emerald-400">E:</b> Engine Start/Stop</div>
              <div><b class="text-yellow-300">L:</b> Headlights (Off/Low/High)</div>
              <div><b class="text-indigo-400">C:</b> Switch Camera</div>
              <div><b class="text-amber-400">H:</b> Dual Air Horn</div>
              <div><b class="text-slate-300">Q / E:</b> Turn Indicators</div>
              <div><b class="text-sky-300">Touch/Mouse:</b> Touch Wheel & Pedals</div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/40 text-xs text-slate-400 flex justify-end">
          <button id="btn-resume-game" class="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95">Resume Driving</button>
        </div>
      </div>
    `;

    this.modalEl.querySelector('#btn-close-settings')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });
    this.modalEl.querySelector('#btn-resume-game')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.hide();
    });

    this.modalEl.querySelectorAll('.btn-set-weather').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = (e.currentTarget as HTMLElement).getAttribute('data-weather') as WeatherType;
        if (type) {
          this.soundManager.playButtonClick();
          this.weatherSystem.setWeather(type);
          this.render();
        }
      });
    });

    this.modalEl.querySelectorAll('.btn-set-camera').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = (e.currentTarget as HTMLElement).getAttribute('data-camera') as CameraView;
        if (view) {
          this.soundManager.playButtonClick();
          this.onCameraSelected?.(view);
          this.hide();
        }
      });
    });

    this.modalEl.querySelector('#btn-toggle-mute')?.addEventListener('click', () => {
      const isMuted = this.soundManager.toggleMute();
      alert(isMuted ? 'Audio Muted' : 'Audio Enabled');
    });
  }
}
