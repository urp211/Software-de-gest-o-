import type { VehicleInputs, CharacterInputs, CameraView, TransmissionMode, SteeringMode } from '../game/types';
import { SoundManager } from '../audio/SoundManager';
import { EconomyManager } from '../game/EconomyManager';
import { MissionManager } from '../game/MissionManager';

export class HUD {
  private container: HTMLElement;
  private soundManager: SoundManager;
  private economy: EconomyManager;
  private missionManager: MissionManager;
  
  public inputs: VehicleInputs;
  public charInputs: CharacterInputs;
  public currentCameraView: CameraView = 'chase';
  public isWalkingMode: boolean = false;

  // UI Element references
  private speedText!: HTMLElement;
  private rpmText!: HTMLElement;
  private gearText!: HTMLElement;
  private fuelBarFill!: HTMLElement;
  private fuelText!: HTMLElement;
  private moneyText!: HTMLElement;
  private levelText!: HTMLElement;
  private gpsCanvas!: HTMLCanvasElement;
  private gpsInstructionText!: HTMLElement;
  private speedLimitBadge!: HTMLElement;
  private distanceText!: HTMLElement;
  private engineBtn!: HTMLElement;
  private lightsBtn!: HTMLElement;
  private leftBlinkerBtn!: HTMLElement;
  private rightBlinkerBtn!: HTMLElement;
  private hazardBtn!: HTMLElement;
  private wiperBtn!: HTMLElement;
  private hornBtn!: HTMLElement;
  private hitchBtn!: HTMLElement;
  private cameraBtn!: HTMLElement;
  private exitTruckBtn!: HTMLElement;
  private adjustCabinBtn!: HTMLElement;
  private steeringModeBtn!: HTMLElement;

  // Truck Driving UI Group & Walking UI Group
  private drivingUIGroup!: HTMLElement;
  private walkingUIGroup!: HTMLElement;

  // Steering wheel elements
  private steeringWheelEl!: HTMLElement;
  private steeringWheelContainer!: HTMLElement;
  private steeringButtonsContainer!: HTMLElement;
  private isSteeringDragging: boolean = false;
  private steeringCenter = { x: 0, y: 0 };

  // Virtual Walking Joystick
  private joystickThumb!: HTMLElement;
  private joystickBase!: HTMLElement;
  private isJoystickActive: boolean = false;
  private joystickCenter = { x: 0, y: 0 };

  // Callbacks
  public onOpenJobs?: () => void;
  public onOpenGarage?: () => void;
  public onOpenSettings?: () => void;
  public onToggleCabinAdjust?: () => void;
  public onCameraChange?: (view: CameraView) => void;
  public onHitchAction?: () => void;
  public onToggleExitTruck?: () => void;
  public onDownloadApp?: () => void;

  constructor(
    container: HTMLElement,
    soundManager: SoundManager,
    economy: EconomyManager,
    missionManager: MissionManager
  ) {
    this.container = container;
    this.soundManager = soundManager;
    this.economy = economy;
    this.missionManager = missionManager;

    this.inputs = {
      throttle: 0,
      brake: 0,
      steer: 0,
      handbrake: false,
      gear: 'D',
      engineRunning: true,
      headlights: 1,
      leftIndicator: false,
      rightIndicator: false,
      hazardLights: false,
      wipers: false,
      horn: false,
      cruiseControl: false,
      cruiseSpeed: 0
    };

    this.charInputs = {
      moveForward: 0,
      moveRight: 0,
      lookX: 0,
      lookY: 0,
      isSprinting: false,
      interact: false
    };

    this.buildHUD();
    this.setupKeyboardListeners();
    this.setupOrientationHelper();
  }

  public getGPSCanvas(): HTMLCanvasElement {
    return this.gpsCanvas;
  }

  private buildHUD() {
    const profile = this.economy.getProfile();
    const steeringMode: SteeringMode = profile.steeringMode || 'wheel';

    this.container.innerHTML = `
      <div class="hud-overlay select-none pointer-events-none w-full h-full absolute inset-0 flex flex-col justify-between p-2 md:p-4 overflow-hidden font-sans">
        
        <!-- ROTATE PHONE NOTICE (For Portrait Mode) -->
        <div id="portrait-notice" class="fixed inset-0 bg-slate-950/95 z-50 flex-col items-center justify-center text-center p-6 hidden pointer-events-auto">
          <div class="w-16 h-16 rounded-3xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-3xl mb-4 animate-bounce">
            📱🔄
          </div>
          <h2 class="text-xl font-black text-white mb-1">Gire o Celular na Horizontal</h2>
          <p class="text-xs text-slate-400 max-w-xs">Para uma melhor experiência de condução e controles em tela cheia, use o modo paisagem.</p>
        </div>

        <!-- TOP STATUS BAR -->
        <div class="flex justify-between items-start pointer-events-auto w-full gap-2 z-20">
          
          <!-- Left: GPS Navigation HUD -->
          <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 md:p-2.5 shadow-2xl flex gap-2.5 items-center">
            <div class="relative w-20 h-20 md:w-24 md:h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shrink-0">
              <canvas id="gps-canvas" width="96" height="96" class="w-full h-full"></canvas>
            </div>
            <div class="flex flex-col justify-between h-20 md:h-24 py-0.5 max-w-[150px] md:max-w-[200px]">
              <div>
                <div class="flex items-center gap-1.5">
                  <span class="inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-red-500 bg-white text-slate-900 font-extrabold text-[10px] md:text-xs shadow-inner" id="speed-limit-badge">80</span>
                  <span class="text-[10px] md:text-xs font-black text-emerald-400 uppercase tracking-wider">GPS</span>
                </div>
                <div class="text-[11px] md:text-xs text-slate-200 font-bold mt-1 leading-tight line-clamp-2" id="gps-instruction">
                  Siga pela Rodovia A1
                </div>
              </div>
              <div class="text-[10px] md:text-[11px] text-sky-400 font-mono">
                DEST: <span id="gps-distance" class="font-bold text-white">6.8 km</span>
              </div>
            </div>
          </div>

          <!-- Center: Active Freight Job Info -->
          <div id="job-banner" class="hidden lg:flex items-center gap-3 bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-4 py-2 shadow-xl">
            <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <div>
              <div class="text-[10px] text-slate-400 uppercase font-semibold">Carga Ativa</div>
              <div class="text-xs font-bold text-slate-100" id="job-title-hud">Maquinário Pesado para Roterdã</div>
            </div>
            <div class="border-l border-slate-700 pl-3">
              <div class="text-[10px] text-slate-400">Pagamento</div>
              <div class="text-xs font-bold text-emerald-400" id="job-reward-hud">€6,400</div>
            </div>
          </div>

          <!-- Right: Action Buttons & Currency -->
          <div class="flex items-center gap-1.5 md:gap-2">
            <!-- Player Currency & Level -->
            <div class="bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-xl">
              <div class="flex items-center gap-1">
                <span class="text-emerald-400 font-extrabold text-sm">€</span>
                <span class="text-white font-black text-xs md:text-sm tracking-wide" id="money-display">12,500</span>
              </div>
              <div class="h-3.5 w-px bg-slate-700"></div>
              <div class="flex items-center gap-1">
                <span class="text-[10px] text-slate-400 font-medium">LVL</span>
                <span class="text-sky-400 font-extrabold text-xs" id="level-display">1</span>
              </div>
            </div>

            <!-- Install / Download APK Button -->
            <button id="btn-download-apk" class="hud-btn bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold p-2 md:p-2.5 rounded-2xl border border-emerald-400/50 shadow-lg flex items-center gap-1 transition-all active:scale-95 text-xs cursor-pointer" title="Instalar App / APK Offline">
              <span>📲</span>
              <span class="hidden sm:inline">APK</span>
            </button>

            <!-- Freight Market Button -->
            <button id="btn-open-jobs" class="hud-btn bg-blue-600/90 hover:bg-blue-500 text-white font-bold p-2 md:p-2.5 rounded-2xl border border-blue-400/50 shadow-lg flex items-center gap-1 transition-all active:scale-95 text-xs cursor-pointer">
              <span>🚛</span>
              <span class="hidden sm:inline">Fretes</span>
            </button>

            <!-- Garage / Customizer Button -->
            <button id="btn-open-garage" class="hud-btn bg-amber-600/90 hover:bg-amber-500 text-white font-bold p-2 md:p-2.5 rounded-2xl border border-amber-400/50 shadow-lg flex items-center gap-1 transition-all active:scale-95 text-xs cursor-pointer">
              <span>🏢</span>
              <span class="hidden sm:inline">Garagem</span>
            </button>

            <!-- Settings Button -->
            <button id="btn-open-settings" class="hud-btn bg-slate-800/90 hover:bg-slate-700 text-white font-bold p-2 md:p-2.5 rounded-2xl border border-slate-600 shadow-lg flex items-center justify-center transition-all active:scale-95 text-xs cursor-pointer">
              ⚙️
            </button>
          </div>
        </div>

        <!-- HITCH / INTERACTION NOTIFICATION PROMPT -->
        <div id="hitch-prompt-container" class="self-center pointer-events-auto hidden z-30">
          <button id="btn-hitch-action" class="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs md:text-sm px-6 py-2.5 rounded-full shadow-2xl border-2 border-white animate-bounce flex items-center gap-2 cursor-pointer">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/></svg>
            <span id="hitch-btn-text">ENGATAR CARRETA [ESPAÇO]</span>
          </button>
        </div>

        <!-- WALKING MODE HUD (When driver exits truck) -->
        <div id="walking-hud-group" class="hidden flex justify-between items-end w-full pointer-events-auto z-20">
          <!-- Left: Virtual Movement Joystick -->
          <div id="joystick-base" class="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-900/80 border-4 border-slate-700/80 shadow-2xl flex items-center justify-center touch-none select-none">
            <div id="joystick-thumb" class="w-14 h-14 md:w-16 md:h-16 rounded-full bg-sky-500/80 border-2 border-white shadow-lg flex items-center justify-center text-xs font-black text-white pointer-events-none">
              🚶
            </div>
          </div>

          <!-- Center: Walk Mode Notice & Interact prompt -->
          <div class="bg-slate-950/85 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl text-center">
            <div class="text-xs font-bold text-emerald-400">Modo Motorista a Pé</div>
            <div class="text-[10px] text-slate-400">Arraste a tela para olhar ao redor</div>
          </div>

          <!-- Right: Sprint & Enter Truck Buttons -->
          <div class="flex flex-col gap-2 items-end">
            <button id="btn-sprint" class="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-600/90 border-2 border-amber-400 text-white font-black flex flex-col items-center justify-center text-xs shadow-xl active:scale-95 transition-all cursor-pointer">
              <span class="text-lg">⚡</span>
              <span>CORRER</span>
            </button>

            <button id="btn-enter-truck" class="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-white text-white font-black flex items-center gap-2 text-xs md:text-sm shadow-2xl active:scale-95 transition-all cursor-pointer animate-pulse">
              <span>🚪</span>
              <span>ENTRAR NO CAMINHÃO</span>
            </button>
          </div>
        </div>

        <!-- DRIVING MODE HUD (When inside truck) -->
        <div id="driving-hud-group" class="flex justify-between items-end gap-2 md:gap-3 w-full pointer-events-auto z-20">
          
          <!-- Left: Steering Wheel / Buttons & Auxiliary Buttons -->
          <div class="flex items-end gap-2 md:gap-3">
            
            <!-- 1. Steering Wheel (Touch & Drag) -->
            <div id="steering-wheel-container" class="${steeringMode === 'wheel' ? 'flex' : 'hidden'} relative w-32 h-32 md:w-40 md:h-40 items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none">
              <div id="steering-wheel-visual" class="w-full h-full rounded-full border-8 border-slate-700 bg-slate-900/80 shadow-2xl flex items-center justify-center transform transition-transform duration-75 relative">
                <div class="w-full h-3 bg-slate-700 absolute"></div>
                <div class="h-full w-3 bg-slate-700 absolute"></div>
                <div class="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-800 border-4 border-slate-600 flex items-center justify-center text-[9px] md:text-[10px] font-black text-sky-400 z-10 shadow-inner text-center leading-none">
                  TRUCK<br>SIM
                </div>
              </div>
            </div>

            <!-- 2. Touch Direction Arrows (Alternative steering) -->
            <div id="steering-buttons-container" class="${steeringMode === 'buttons' ? 'flex' : 'hidden'} gap-2">
              <button id="btn-steer-left" class="w-16 h-24 md:w-20 md:h-28 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-sky-400 active:bg-sky-500/20 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 touch-none select-none cursor-pointer">
                ◀
              </button>
              <button id="btn-steer-right" class="w-16 h-24 md:w-20 md:h-28 rounded-2xl bg-slate-900/90 border-2 border-slate-700 active:border-sky-400 active:bg-sky-500/20 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 touch-none select-none cursor-pointer">
                ▶
              </button>
            </div>

            <!-- Aux Controls Column -->
            <div class="flex flex-col gap-1.5">
              <!-- Exit Truck Button -->
              <button id="btn-exit-truck" class="w-10 h-10 md:w-11 md:h-11 bg-red-600/90 hover:bg-red-500 text-white rounded-2xl border border-red-400 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs font-bold cursor-pointer" title="Descer do Caminhão">
                🚪
              </button>
              <!-- Seat Adjustment (In Cockpit View) -->
              <button id="btn-cabin-adjust" class="w-10 h-10 md:w-11 md:h-11 bg-sky-600/90 hover:bg-sky-500 text-white rounded-2xl border border-sky-400 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs font-bold cursor-pointer" title="Ajustar Banco do Motorista">
                💺
              </button>
              <!-- Horn -->
              <button id="btn-horn" class="w-10 h-10 md:w-11 md:h-11 bg-slate-800/85 hover:bg-slate-700 active:bg-amber-600 text-white rounded-2xl border border-slate-600 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs font-bold cursor-pointer" title="Buzina [H]">
                📢
              </button>
              <!-- Wipers -->
              <button id="btn-wipers" class="w-10 h-10 md:w-11 md:h-11 bg-slate-800/85 hover:bg-slate-700 text-white rounded-2xl border border-slate-600 flex items-center justify-center shadow-lg active:scale-95 transition-all text-xs font-bold cursor-pointer" title="Limpadores [W]">
                🌧️
              </button>
              <!-- Camera Switch -->
              <button id="btn-camera" class="w-10 h-10 md:w-11 md:h-11 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-2xl border border-indigo-400 shadow-lg flex items-center justify-center active:scale-95 transition-all text-xs font-bold cursor-pointer" title="Câmera [C]">
                📹
              </button>
            </div>
          </div>

          <!-- Center: Realistic Truck Dashboard Gauge Cluster -->
          <div class="bg-slate-950/90 backdrop-blur-xl border-2 border-slate-700/80 rounded-2xl md:rounded-3xl p-2 md:p-3 shadow-2xl flex flex-col items-center gap-1 md:gap-1.5 max-w-[260px] sm:max-w-[320px] md:max-w-[380px] w-full">
            
            <!-- Dashboard Warning Lights & Indicators -->
            <div class="flex justify-between items-center w-full px-2 py-0.5 border-b border-slate-800/80 text-xs md:text-sm">
              <button id="btn-left-indicator" class="text-slate-600 font-bold transition-colors cursor-pointer hover:text-amber-400">◀</button>
              
              <div class="flex items-center gap-2 md:gap-3">
                <button id="btn-engine" class="w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 text-[10px] md:text-xs font-extrabold flex items-center justify-center cursor-pointer active:scale-90" title="Ligar/Desligar Motor [E]">
                  PWR
                </button>
                <button id="btn-lights" class="text-amber-400 text-xs md:text-sm font-bold cursor-pointer" title="Faróis [L]">
                  💡
                </button>
                <button id="btn-hazard" class="text-red-500 text-xs md:text-sm font-bold cursor-pointer animate-pulse" title="Pisca Alerta [J]">
                  ⚠️
                </button>
                <!-- Steering mode toggle (Wheel vs Buttons) -->
                <button id="btn-toggle-steer-mode" class="text-sky-400 text-xs font-bold cursor-pointer bg-slate-800 px-1.5 py-0.5 rounded" title="Alternar Volante / Botões">
                  ${steeringMode === 'wheel' ? '🎯 Volante' : '🔲 Botões'}
                </button>
              </div>

              <button id="btn-right-indicator" class="text-slate-600 font-bold transition-colors cursor-pointer hover:text-amber-400">▶</button>
            </div>

            <!-- Gauges Row: Speedometer, Gear, RPM -->
            <div class="flex items-center justify-around w-full py-0.5">
              <!-- Digital & Analog Speed -->
              <div class="text-center">
                <div class="text-2xl md:text-4xl font-black text-sky-400 font-mono tracking-tighter" id="speed-value">0</div>
                <div class="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">KM/H</div>
              </div>

              <!-- Transmission Gear Selector Display -->
              <div class="flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 shadow-inner">
                <div class="text-[10px] text-slate-400 font-bold tracking-wider">MARCHA</div>
                <div class="text-xl md:text-2xl font-black text-emerald-400 font-mono" id="gear-value">D1</div>
              </div>

              <!-- RPM & Engine Load -->
              <div class="text-center">
                <div class="text-xl md:text-2xl font-black text-amber-400 font-mono" id="rpm-value">800</div>
                <div class="text-[9px] md:text-[10px] text-slate-400 font-bold tracking-widest uppercase">RPM</div>
              </div>
            </div>

            <!-- Fuel Bar & Stats -->
            <div class="w-full flex items-center gap-2 pt-0.5 border-t border-slate-800/80 text-[10px] md:text-[11px] text-slate-300">
              <span class="text-xs font-bold">⛽</span>
              <div class="w-full h-2 md:h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div id="fuel-bar-fill" class="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300" style="width: 92%"></div>
              </div>
              <span id="fuel-text" class="font-mono font-bold text-[10px] md:text-xs">92%</span>
            </div>
          </div>

          <!-- Right: Transmission Selector, Throttle & Brake Pedals -->
          <div class="flex items-end gap-2 md:gap-3">
            <!-- Gear Shifter Buttons (P, R, N, D) -->
            <div class="flex flex-col gap-1 bg-slate-900/85 backdrop-blur-md p-1 rounded-2xl border border-slate-700">
              <button data-gear="P" class="gear-btn w-8 h-8 md:w-9 md:h-9 rounded-xl font-black text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-all active:scale-95">P</button>
              <button data-gear="R" class="gear-btn w-8 h-8 md:w-9 md:h-9 rounded-xl font-black text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-all active:scale-95">R</button>
              <button data-gear="N" class="gear-btn w-8 h-8 md:w-9 md:h-9 rounded-xl font-black text-xs text-slate-400 hover:text-white bg-slate-800 border border-slate-700 transition-all active:scale-95">N</button>
              <button data-gear="D" class="gear-btn active w-8 h-8 md:w-9 md:h-9 rounded-xl font-black text-xs text-emerald-400 bg-emerald-500/20 border border-emerald-500 transition-all active:scale-95">D</button>
            </div>

            <!-- Pedals (Brake & Throttle) -->
            <div class="flex gap-1.5 md:gap-2 items-end">
              <!-- Wide Foot Brake Pedal -->
              <div id="pedal-brake" class="w-14 h-24 md:w-18 md:h-32 bg-gradient-to-b from-red-950 to-red-800 hover:from-red-900 hover:to-red-700 border-2 border-red-500/60 rounded-2xl shadow-2xl flex flex-col items-center justify-between py-2 text-white font-extrabold cursor-pointer active:scale-95 touch-none select-none">
                <div class="w-8 h-1 bg-red-400/50 rounded-full"></div>
                <div class="text-[10px] md:text-xs tracking-wider">FREIO</div>
                <div class="w-8 h-1 bg-red-400/50 rounded-full"></div>
              </div>

              <!-- Tall Throttle Gas Pedal -->
              <div id="pedal-throttle" class="w-12 h-32 md:w-16 md:h-40 bg-gradient-to-b from-emerald-950 to-emerald-800 hover:from-emerald-900 hover:to-emerald-700 border-2 border-emerald-500/60 rounded-2xl shadow-2xl flex flex-col items-center justify-between py-3 text-white font-extrabold cursor-pointer active:scale-95 touch-none select-none">
                <div class="w-6 h-1 bg-emerald-400/50 rounded-full"></div>
                <div class="text-[10px] md:text-xs tracking-wider">GAS</div>
                <div class="w-6 h-1 bg-emerald-400/50 rounded-full"></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    // Cache elements
    this.speedText = this.container.querySelector('#speed-value')!;
    this.rpmText = this.container.querySelector('#rpm-value')!;
    this.gearText = this.container.querySelector('#gear-value')!;
    this.fuelBarFill = this.container.querySelector('#fuel-bar-fill')!;
    this.fuelText = this.container.querySelector('#fuel-text')!;
    this.moneyText = this.container.querySelector('#money-display')!;
    this.levelText = this.container.querySelector('#level-display')!;
    this.gpsCanvas = this.container.querySelector('#gps-canvas') as HTMLCanvasElement;
    this.gpsInstructionText = this.container.querySelector('#gps-instruction')!;
    this.speedLimitBadge = this.container.querySelector('#speed-limit-badge')!;
    this.distanceText = this.container.querySelector('#gps-distance')!;
    this.engineBtn = this.container.querySelector('#btn-engine')!;
    this.lightsBtn = this.container.querySelector('#btn-lights')!;
    this.leftBlinkerBtn = this.container.querySelector('#btn-left-indicator')!;
    this.rightBlinkerBtn = this.container.querySelector('#btn-right-indicator')!;
    this.hazardBtn = this.container.querySelector('#btn-hazard')!;
    this.wiperBtn = this.container.querySelector('#btn-wipers')!;
    this.hornBtn = this.container.querySelector('#btn-horn')!;
    this.hitchBtn = this.container.querySelector('#btn-hitch-action')!;
    this.cameraBtn = this.container.querySelector('#btn-camera')!;
    this.exitTruckBtn = this.container.querySelector('#btn-exit-truck')!;
    this.adjustCabinBtn = this.container.querySelector('#btn-cabin-adjust')!;
    this.steeringModeBtn = this.container.querySelector('#btn-toggle-steer-mode')!;
    this.steeringWheelEl = this.container.querySelector('#steering-wheel-visual')!;
    this.steeringWheelContainer = this.container.querySelector('#steering-wheel-container')!;
    this.steeringButtonsContainer = this.container.querySelector('#steering-buttons-container')!;

    this.drivingUIGroup = this.container.querySelector('#driving-hud-group')!;
    this.walkingUIGroup = this.container.querySelector('#walking-hud-group')!;
    this.joystickBase = this.container.querySelector('#joystick-base')!;
    this.joystickThumb = this.container.querySelector('#joystick-thumb')!;

    this.bindButtons();
    this.setupTouchPedalsAndSteering();
    this.setupWalkingJoystick();
  }

  private setupOrientationHelper() {
    const notice = this.container.querySelector('#portrait-notice') as HTMLElement;
    const checkOrientation = () => {
      if (window.innerHeight > window.innerWidth && window.innerWidth < 640) {
        notice.classList.remove('hidden');
        notice.classList.add('flex');
      } else {
        notice.classList.add('hidden');
        notice.classList.remove('flex');
      }
    };
    window.addEventListener('resize', checkOrientation);
    checkOrientation();
  }

  public setWalkingMode(walking: boolean) {
    this.isWalkingMode = walking;
    if (walking) {
      this.drivingUIGroup.classList.add('hidden');
      this.drivingUIGroup.classList.remove('flex');
      this.walkingUIGroup.classList.remove('hidden');
      this.walkingUIGroup.classList.add('flex');
    } else {
      this.walkingUIGroup.classList.add('hidden');
      this.walkingUIGroup.classList.remove('flex');
      this.drivingUIGroup.classList.remove('hidden');
      this.drivingUIGroup.classList.add('flex');
    }
  }

  private bindButtons() {
    this.container.querySelector('#btn-open-jobs')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.onOpenJobs?.();
    });
    this.container.querySelector('#btn-open-garage')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.onOpenGarage?.();
    });
    this.container.querySelector('#btn-open-settings')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.onOpenSettings?.();
    });
    this.container.querySelector('#btn-download-apk')?.addEventListener('click', () => {
      this.soundManager.playButtonClick();
      this.onDownloadApp?.();
    });

    this.engineBtn.addEventListener('click', () => {
      this.inputs.engineRunning = !this.inputs.engineRunning;
      this.soundManager.setEngineRunning(this.inputs.engineRunning);
      this.updateEngineBtnVisual();
    });

    this.lightsBtn.addEventListener('click', () => {
      this.inputs.headlights = ((this.inputs.headlights + 1) % 3) as 0 | 1 | 2;
      this.soundManager.playButtonClick();
    });

    this.leftBlinkerBtn.addEventListener('click', () => {
      this.inputs.leftIndicator = !this.inputs.leftIndicator;
      if (this.inputs.leftIndicator) this.inputs.rightIndicator = false;
      this.soundManager.playIndicatorTick();
    });
    this.rightBlinkerBtn.addEventListener('click', () => {
      this.inputs.rightIndicator = !this.inputs.rightIndicator;
      if (this.inputs.rightIndicator) this.inputs.leftIndicator = false;
      this.soundManager.playIndicatorTick();
    });
    this.hazardBtn.addEventListener('click', () => {
      this.inputs.hazardLights = !this.inputs.hazardLights;
      this.soundManager.playIndicatorTick();
    });

    this.wiperBtn.addEventListener('click', () => {
      this.inputs.wipers = !this.inputs.wipers;
      this.soundManager.playButtonClick();
    });

    // Exit Truck / Enter Truck
    this.exitTruckBtn.addEventListener('click', () => {
      this.onToggleExitTruck?.();
    });
    this.container.querySelector('#btn-enter-truck')?.addEventListener('click', () => {
      this.onToggleExitTruck?.();
    });

    // Adjust Cabin Seat
    this.adjustCabinBtn.addEventListener('click', () => {
      this.onToggleCabinAdjust?.();
    });

    // Toggle Steering Mode (Wheel vs Buttons)
    this.steeringModeBtn.addEventListener('click', () => {
      const current = this.economy.getProfile().steeringMode || 'wheel';
      const nextMode: SteeringMode = current === 'wheel' ? 'buttons' : 'wheel';
      this.economy.setSteeringMode(nextMode);
      this.steeringModeBtn.innerText = nextMode === 'wheel' ? '🎯 Volante' : '🔲 Botões';

      if (nextMode === 'wheel') {
        this.steeringWheelContainer.classList.remove('hidden');
        this.steeringWheelContainer.classList.add('flex');
        this.steeringButtonsContainer.classList.add('hidden');
        this.steeringButtonsContainer.classList.remove('flex');
      } else {
        this.steeringWheelContainer.classList.add('hidden');
        this.steeringWheelContainer.classList.remove('flex');
        this.steeringButtonsContainer.classList.remove('hidden');
        this.steeringButtonsContainer.classList.add('flex');
      }
      this.soundManager.playButtonClick();
    });

    const startHorn = () => {
      this.inputs.horn = true;
      this.soundManager.startHorn();
    };
    const stopHorn = () => {
      this.inputs.horn = false;
      this.soundManager.stopHorn();
    };
    this.hornBtn.addEventListener('mousedown', startHorn);
    this.hornBtn.addEventListener('mouseup', stopHorn);
    this.hornBtn.addEventListener('touchstart', (e) => { e.preventDefault(); startHorn(); });
    this.hornBtn.addEventListener('touchend', stopHorn);

    this.cameraBtn.addEventListener('click', () => {
      const views: CameraView[] = ['chase', 'cabin', 'top', 'cinematic'];
      const nextIdx = (views.indexOf(this.currentCameraView) + 1) % views.length;
      this.currentCameraView = views[nextIdx];
      this.soundManager.playButtonClick();
      this.onCameraChange?.(this.currentCameraView);
    });

    const gearButtons = this.container.querySelectorAll('.gear-btn');
    gearButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const gear = btn.getAttribute('data-gear') as TransmissionMode;
        if (gear) {
          this.inputs.gear = gear;
          this.soundManager.playGearShift();
          gearButtons.forEach(b => {
            b.classList.remove('active', 'text-emerald-400', 'bg-emerald-500/20', 'border-emerald-500');
            b.classList.add('text-slate-400', 'bg-slate-800', 'border-slate-700');
          });
          btn.classList.add('active', 'text-emerald-400', 'bg-emerald-500/20', 'border-emerald-500');
          btn.classList.remove('text-slate-400', 'bg-slate-800', 'border-slate-700');
        }
      });
    });

    this.hitchBtn.addEventListener('click', () => {
      this.onHitchAction?.();
    });

    // Sprint Button in Walk Mode
    const sprintBtn = this.container.querySelector('#btn-sprint');
    sprintBtn?.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.charInputs.isSprinting = true;
      this.soundManager.triggerHaptic(20);
    });
    sprintBtn?.addEventListener('touchend', () => {
      this.charInputs.isSprinting = false;
    });
    sprintBtn?.addEventListener('mousedown', () => {
      this.charInputs.isSprinting = true;
    });
    window.addEventListener('mouseup', () => {
      this.charInputs.isSprinting = false;
    });
  }

  private setupTouchPedalsAndSteering() {
    const throttleEl = this.container.querySelector('#pedal-throttle') as HTMLElement;
    const brakeEl = this.container.querySelector('#pedal-brake') as HTMLElement;
    const wheelContainer = this.steeringWheelContainer;
    const steerLeftBtn = this.container.querySelector('#btn-steer-left') as HTMLElement;
    const steerRightBtn = this.container.querySelector('#btn-steer-right') as HTMLElement;

    // Throttle
    const pressThrottle = (e: Event) => {
      e.preventDefault();
      this.inputs.throttle = 1.0;
      this.soundManager.triggerHaptic(15);
    };
    const releaseThrottle = (e: Event) => {
      e.preventDefault();
      this.inputs.throttle = 0;
    };
    throttleEl.addEventListener('mousedown', pressThrottle);
    window.addEventListener('mouseup', releaseThrottle);
    throttleEl.addEventListener('touchstart', pressThrottle, { passive: false });
    window.addEventListener('touchend', releaseThrottle);

    // Brake
    const pressBrake = (e: Event) => {
      e.preventDefault();
      this.inputs.brake = 1.0;
      this.soundManager.triggerHaptic(20);
    };
    const releaseBrake = (e: Event) => {
      e.preventDefault();
      this.inputs.brake = 0;
    };
    brakeEl.addEventListener('mousedown', pressBrake);
    window.addEventListener('mouseup', releaseBrake);
    brakeEl.addEventListener('touchstart', pressBrake, { passive: false });
    window.addEventListener('touchend', releaseBrake);

    // Button Steer Left / Right
    steerLeftBtn.addEventListener('mousedown', () => { this.inputs.steer = -1.0; });
    steerLeftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.inputs.steer = -1.0; }, { passive: false });
    steerRightBtn.addEventListener('mousedown', () => { this.inputs.steer = 1.0; });
    steerRightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.inputs.steer = 1.0; }, { passive: false });
    const releaseSteerBtn = () => { this.inputs.steer = 0; };
    steerLeftBtn.addEventListener('mouseup', releaseSteerBtn);
    steerLeftBtn.addEventListener('touchend', releaseSteerBtn);
    steerRightBtn.addEventListener('mouseup', releaseSteerBtn);
    steerRightBtn.addEventListener('touchend', releaseSteerBtn);

    // Rotatable Wheel
    const onStartSteer = () => {
      this.isSteeringDragging = true;
      const rect = wheelContainer.getBoundingClientRect();
      this.steeringCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
    };

    const onMoveSteer = (clientX: number, clientY: number) => {
      if (!this.isSteeringDragging) return;
      const dx = clientX - this.steeringCenter.x;
      const dy = clientY - this.steeringCenter.y;
      let angle = Math.atan2(dy, dx) + Math.PI / 2;
      while (angle > Math.PI) angle -= Math.PI * 2;
      while (angle < -Math.PI) angle += Math.PI * 2;

      const maxRad = (120 * Math.PI) / 180;
      angle = Math.max(-maxRad, Math.min(maxRad, angle));

      this.inputs.steer = angle / maxRad;
      this.steeringWheelEl.style.transform = `rotate(${angle}rad)`;
    };

    const onEndSteer = () => {
      this.isSteeringDragging = false;
      this.inputs.steer = 0;
      this.steeringWheelEl.style.transform = `rotate(0rad)`;
    };

    wheelContainer.addEventListener('mousedown', () => onStartSteer());
    window.addEventListener('mousemove', (e) => onMoveSteer(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEndSteer);

    wheelContainer.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onStartSteer();
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isSteeringDragging) return;
      const touch = e.touches[0];
      onMoveSteer(touch.clientX, touch.clientY);
    }, { passive: false });

    window.addEventListener('touchend', onEndSteer);
  }

  private setupWalkingJoystick() {
    const onStartJoy = (clientX: number, clientY: number) => {
      this.isJoystickActive = true;
      const rect = this.joystickBase.getBoundingClientRect();
      this.joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      this.updateJoystickPos(clientX, clientY);
    };

    const onMoveJoy = (clientX: number, clientY: number) => {
      if (!this.isJoystickActive) return;
      this.updateJoystickPos(clientX, clientY);
    };

    const onEndJoy = () => {
      this.isJoystickActive = false;
      this.joystickThumb.style.transform = `translate(0px, 0px)`;
      this.charInputs.moveForward = 0;
      this.charInputs.moveRight = 0;
    };

    this.joystickBase.addEventListener('mousedown', (e) => onStartJoy(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onMoveJoy(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEndJoy);

    this.joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      onStartJoy(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.isJoystickActive) return;
      const t = e.touches[0];
      onMoveJoy(t.clientX, t.clientY);
    }, { passive: false });

    window.addEventListener('touchend', onEndJoy);
  }

  private updateJoystickPos(clientX: number, clientY: number) {
    const maxRadius = 45;
    let dx = clientX - this.joystickCenter.x;
    let dy = clientY - this.joystickCenter.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }

    this.joystickThumb.style.transform = `translate(${dx}px, ${dy}px)`;
    this.charInputs.moveRight = dx / maxRadius;
    this.charInputs.moveForward = -dy / maxRadius;
  }

  private setupKeyboardListeners() {
    const keysDown: { [key: string]: boolean } = {};

    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keysDown[e.code] = true;

      // In Walk Mode
      if (this.isWalkingMode) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp') this.charInputs.moveForward = 1.0;
        if (e.code === 'KeyS' || e.code === 'ArrowDown') this.charInputs.moveForward = -1.0;
        if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.charInputs.moveRight = -1.0;
        if (e.code === 'KeyD' || e.code === 'ArrowRight') this.charInputs.moveRight = 1.0;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.charInputs.isSprinting = true;
        if (e.code === 'KeyE' || e.code === 'KeyF') this.onToggleExitTruck?.();
        return;
      }

      // In Driving Mode
      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.inputs.throttle = 1.0;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.inputs.brake = 1.0;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') {
        this.inputs.steer = -1.0;
      }
      if (e.code === 'KeyD' || e.code === 'ArrowRight') {
        this.inputs.steer = 1.0;
      }
      if (e.code === 'Space') {
        this.inputs.handbrake = true;
        this.onHitchAction?.();
      }
      if (e.code === 'KeyE') {
        this.inputs.engineRunning = !this.inputs.engineRunning;
        this.soundManager.setEngineRunning(this.inputs.engineRunning);
        this.updateEngineBtnVisual();
      }
      if (e.code === 'KeyF') {
        this.onToggleExitTruck?.();
      }
      if (e.code === 'KeyL') {
        this.inputs.headlights = ((this.inputs.headlights + 1) % 3) as 0 | 1 | 2;
        this.soundManager.playButtonClick();
      }
      if (e.code === 'KeyC') {
        this.cameraBtn.click();
      }
      if (e.code === 'KeyH') {
        if (!this.inputs.horn) {
          this.inputs.horn = true;
          this.soundManager.startHorn();
        }
      }
      if (e.code === 'KeyQ') {
        this.leftBlinkerBtn.click();
      }
      if (e.code === 'KeyR' && !e.ctrlKey) {
        this.inputs.gear = this.inputs.gear === 'R' ? 'D' : 'R';
        this.soundManager.playGearShift();
      }
    });

    window.addEventListener('keyup', (e) => {
      keysDown[e.code] = false;
      if (this.isWalkingMode) {
        if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'KeyS' || e.code === 'ArrowDown') {
          if (!keysDown['KeyW'] && !keysDown['ArrowUp'] && !keysDown['KeyS'] && !keysDown['ArrowDown']) {
            this.charInputs.moveForward = 0;
          }
        }
        if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') {
          if (!keysDown['KeyA'] && !keysDown['ArrowLeft'] && !keysDown['KeyD'] && !keysDown['ArrowRight']) {
            this.charInputs.moveRight = 0;
          }
        }
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.charInputs.isSprinting = false;
        return;
      }

      if (e.code === 'KeyW' || e.code === 'ArrowUp') {
        this.inputs.throttle = 0;
      }
      if (e.code === 'KeyS' || e.code === 'ArrowDown') {
        this.inputs.brake = 0;
      }
      if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'KeyD' || e.code === 'ArrowRight') {
        if (!keysDown['KeyA'] && !keysDown['ArrowLeft'] && !keysDown['KeyD'] && !keysDown['ArrowRight']) {
          this.inputs.steer = 0;
        }
      }
      if (e.code === 'Space') {
        this.inputs.handbrake = false;
      }
      if (e.code === 'KeyH') {
        this.inputs.horn = false;
        this.soundManager.stopHorn();
      }
    });
  }

  private updateEngineBtnVisual() {
    if (this.inputs.engineRunning) {
      this.engineBtn.className = 'w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 text-[10px] md:text-xs font-extrabold flex items-center justify-center cursor-pointer active:scale-90';
    } else {
      this.engineBtn.className = 'w-7 h-7 md:w-8 md:h-8 rounded-full bg-red-500/20 border-2 border-red-500 text-red-400 text-[10px] md:text-xs font-extrabold flex items-center justify-center cursor-pointer active:scale-90';
    }
  }

  public update(
    speedKmh: number,
    rpm: number,
    fuelPercent: number,
    currentGear: number,
    distanceKm: number,
    instruction: string,
    speedLimit: number,
    canHitch: boolean,
    hasTrailer: boolean
  ) {
    const absSpeed = Math.abs(Math.round(speedKmh));
    this.speedText.innerText = absSpeed.toString();
    this.rpmText.innerText = Math.round(rpm).toString();

    if (this.inputs.gear === 'D') {
      this.gearText.innerText = `D${Math.max(1, currentGear)}`;
    } else if (this.inputs.gear === 'R') {
      this.gearText.innerText = 'R';
    } else {
      this.gearText.innerText = this.inputs.gear;
    }

    const roundedFuel = Math.round(fuelPercent);
    this.fuelBarFill.style.width = `${roundedFuel}%`;
    this.fuelText.innerText = `${roundedFuel}%`;

    const profile = this.economy.getProfile();
    this.moneyText.innerText = profile.money.toLocaleString();
    this.levelText.innerText = profile.level.toString();

    this.gpsInstructionText.innerText = instruction;
    this.speedLimitBadge.innerText = speedLimit.toString();
    this.distanceText.innerText = `${distanceKm} km`;

    // Hitch prompt
    const hitchContainer = this.container.querySelector('#hitch-prompt-container') as HTMLElement;
    const hitchText = this.container.querySelector('#hitch-btn-text') as HTMLElement;
    if (canHitch && !hasTrailer) {
      hitchContainer.classList.remove('hidden');
      hitchText.innerText = 'ENGATAR CARRETA [ESPAÇO]';
    } else if (hasTrailer && this.missionManager.jobStage === 'park_in_bay') {
      hitchContainer.classList.remove('hidden');
      hitchText.innerText = 'ENTREGAR CARGA [DESENGATAR]';
    } else {
      hitchContainer.classList.add('hidden');
    }

    // Job Banner
    const jobBanner = this.container.querySelector('#job-banner') as HTMLElement;
    const jobTitle = this.container.querySelector('#job-title-hud') as HTMLElement;
    const jobReward = this.container.querySelector('#job-reward-hud') as HTMLElement;
    if (this.missionManager.currentJob) {
      jobBanner.classList.remove('hidden');
      jobTitle.innerText = `${this.missionManager.currentJob.title} (${this.missionManager.currentJob.destination})`;
      jobReward.innerText = `€${this.missionManager.currentJob.reward.toLocaleString()}`;
    } else {
      jobBanner.classList.add('hidden');
    }

    // Blinker visual flashing
    const blinkPhase = Math.floor(Date.now() / 350) % 2 === 0;
    if ((this.inputs.leftIndicator || this.inputs.hazardLights) && blinkPhase) {
      this.leftBlinkerBtn.classList.add('text-amber-400');
    } else {
      this.leftBlinkerBtn.classList.remove('text-amber-400');
    }

    if ((this.inputs.rightIndicator || this.inputs.hazardLights) && blinkPhase) {
      this.rightBlinkerBtn.classList.add('text-amber-400');
    } else {
      this.rightBlinkerBtn.classList.remove('text-amber-400');
    }
  }
}
