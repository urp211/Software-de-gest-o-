import * as THREE from 'three';
import { TruckModelBuilder, type TruckMeshGroup } from './TruckModel';
import { PhysicsEngine } from './PhysicsEngine';
import { WorldBuilder, type WorldObjects } from './World';
import { TrafficManager } from './TrafficManager';
import { WeatherSystem } from './WeatherSystem';
import { MissionManager } from './MissionManager';
import { EconomyManager } from './EconomyManager';
import { GPSNavigation } from './GPSNavigation';
import { CharacterController } from './CharacterController';
import { SoundManager } from '../audio/SoundManager';
import { HUD } from '../ui/HUD';
import { JobMarketModal } from '../ui/JobMarketModal';
import { GarageModal } from '../ui/GarageModal';
import { PauseSettingsModal } from '../ui/PauseSettingsModal';
import { DeliverySummaryModal } from '../ui/DeliverySummaryModal';
import { CabinAdjustmentModal } from '../ui/CabinAdjustmentModal';
import { ApkDownloadModal } from '../ui/ApkDownloadModal';
import type { CameraView, CabinSeatSettings } from './types';

export class Game {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  // Systems
  private soundManager: SoundManager;
  private economy: EconomyManager;
  private missionManager: MissionManager;
  private physics: PhysicsEngine;
  private weatherSystem: WeatherSystem;
  private trafficManager: TrafficManager;
  private worldObjects: WorldObjects;
  private gpsNav: GPSNavigation;
  private characterController: CharacterController;

  // UI
  private hud: HUD;
  private jobMarketModal: JobMarketModal;
  private garageModal: GarageModal;
  private pauseModal: PauseSettingsModal;
  private deliveryModal: DeliverySummaryModal;
  private cabinAdjustModal: CabinAdjustmentModal;
  private apkModal: ApkDownloadModal;

  // 3D Meshes
  private truckGroup: TruckMeshGroup;
  private clock: THREE.Clock;

  // Camera settings
  private currentCameraView: CameraView = 'chase';
  private cameraOrbitAngleX: number = 0;
  private cameraOrbitAngleY: number = 0.2;
  private isPointerDown: boolean = false;
  private pointerPrevPos = { x: 0, y: 0 };
  private seatSettings: CabinSeatSettings;

  constructor(container: HTMLElement) {
    this.container = container;
    this.clock = new THREE.Clock();

    // 1. Scene & Renderer Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1500);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // 2. Audio & Economy
    this.soundManager = new SoundManager();
    this.economy = new EconomyManager();
    this.seatSettings = this.economy.getProfile().seatSettings || {
      height: 0,
      distance: 0,
      lateral: 0,
      pitch: 0,
      fov: 65
    };

    // 3. World & Environment
    this.worldObjects = WorldBuilder.createEuropeanWorld();
    this.scene.add(this.worldObjects.group);

    this.weatherSystem = new WeatherSystem(this.scene, this.soundManager, this.worldObjects.streetlights);
    this.trafficManager = new TrafficManager(this.scene);
    this.characterController = new CharacterController(this.scene, this.soundManager);

    // 4. Truck & Physics
    this.physics = new PhysicsEngine();
    const profile = this.economy.getProfile();
    const currentTruckStat = EconomyManager.AVAILABLE_TRUCKS.find(t => t.id === profile.currentTruckId) || EconomyManager.AVAILABLE_TRUCKS[0];
    const custom = profile.customizations[currentTruckStat.id] || { color: currentTruckStat.color, metallic: currentTruckStat.metallic };

    this.truckGroup = TruckModelBuilder.createEuroTruck(custom.color, custom.metallic, 0.35, currentTruckStat.chassis);
    this.scene.add(this.truckGroup);

    // Initial Truck Spawn Position (near Depot A)
    this.physics.setInitialPosition(-35, -290, 0);

    // 5. Missions & GPS
    this.missionManager = new MissionManager(this.scene, this.economy, this.soundManager);

    // 6. UI HUD & Modals
    const hudContainer = document.createElement('div');
    hudContainer.id = 'hud-root';
    this.container.appendChild(hudContainer);

    this.hud = new HUD(hudContainer, this.soundManager, this.economy, this.missionManager);
    this.gpsNav = new GPSNavigation(this.hud.getGPSCanvas(), this.missionManager);

    this.jobMarketModal = new JobMarketModal(this.missionManager, this.soundManager);
    this.garageModal = new GarageModal(this.economy, this.soundManager);
    this.pauseModal = new PauseSettingsModal(this.weatherSystem, this.soundManager);
    this.deliveryModal = new DeliverySummaryModal(this.soundManager);
    this.cabinAdjustModal = new CabinAdjustmentModal(this.economy, this.soundManager);
    this.apkModal = new ApkDownloadModal(this.soundManager);

    this.setupUIEvents();
    this.setupCameraInteraction();
    this.setupResizeListener();

    // Auto-start initial job preview
    this.missionManager.startJob('job_heavy_machinery', this.truckGroup.position);

    // Start Game Loop
    this.animate();
  }

  private setupUIEvents() {
    // Open Modals
    this.hud.onOpenJobs = () => this.jobMarketModal.show();
    this.hud.onOpenGarage = () => this.garageModal.show();
    this.hud.onOpenSettings = () => this.pauseModal.show();
    this.hud.onDownloadApp = () => this.apkModal.show();

    // Cabin Adjustment Modal
    this.hud.onToggleCabinAdjust = () => {
      this.cabinAdjustModal.toggle();
    };
    this.cabinAdjustModal.onSettingsChanged = (settings) => {
      this.seatSettings = settings;
      if (this.currentCameraView === 'cabin') {
        this.camera.fov = settings.fov;
        this.camera.updateProjectionMatrix();
      }
    };

    // Camera Switch from HUD / Settings
    this.hud.onCameraChange = (view) => {
      this.currentCameraView = view;
      if (view === 'cabin') {
        this.camera.fov = this.seatSettings.fov;
      } else {
        this.camera.fov = 65;
      }
      this.camera.updateProjectionMatrix();
    };

    this.pauseModal.onCameraSelected = (view) => {
      this.currentCameraView = view;
      this.hud.currentCameraView = view;
      if (view === 'cabin') {
        this.camera.fov = this.seatSettings.fov;
      } else {
        this.camera.fov = 65;
      }
      this.camera.updateProjectionMatrix();
    };

    // Exit Truck / Enter Truck
    this.hud.onToggleExitTruck = () => {
      if (this.characterController.isActive) {
        // Check distance to truck
        const dist = this.characterController.checkDistanceToTruck(this.physics.position);
        if (dist < 6.0) {
          this.characterController.enterTruck();
          this.hud.setWalkingMode(false);
          this.currentCameraView = 'chase';
        } else {
          alert('Aproxime-se da porta do caminhão para entrar!');
        }
      } else {
        // Exit truck
        this.characterController.exitTruck(this.physics.position, this.physics.heading);
        this.hud.setWalkingMode(true);
        this.currentCameraView = 'walk';
      }
    };

    // Job Selection from Freight Market
    this.jobMarketModal.onJobSelected = (job) => {
      this.missionManager.startJob(job.id, this.truckGroup.position);
    };

    // Truck Customization & Change from Garage
    this.garageModal.onTruckCustomized = (truckId, color, metallic) => {
      this.rebuildTruckModel(truckId, color, metallic);
    };
    this.garageModal.onTruckChanged = (truckId) => {
      const profile = this.economy.getProfile();
      const custom = profile.customizations[truckId] || { color: '#dc2626', metallic: 0.7 };
      this.rebuildTruckModel(truckId, custom.color, custom.metallic);
    };

    // Hitch / Unhitch Action
    this.hud.onHitchAction = () => {
      this.handleHitchAction();
    };

    // Mission Completion Callback
    this.missionManager.setOnJobCompleted((job, reward, xp) => {
      this.physics.hasTrailer = false;
      this.deliveryModal.show(job, reward, xp);
    });

    this.deliveryModal.onContinue = () => {
      this.jobMarketModal.show();
    };
  }

  private handleHitchAction() {
    this.soundManager.init();

    const checkPos = this.characterController.isActive ? this.characterController.position : this.truckGroup.position;

    if (!this.physics.hasTrailer && this.missionManager.spawnedTrailer) {
      const hitchCheck = this.missionManager.checkTrailerHitchDistance(checkPos);
      if (hitchCheck.canHitch) {
        this.physics.attachTrailer(this.missionManager.spawnedTrailer);
        this.missionManager.jobStage = 'deliver_to_dest';
        this.soundManager.playHitchSound();
      }
    } else if (this.physics.hasTrailer && this.missionManager.spawnedTrailer) {
      if (this.missionManager.jobStage === 'park_in_bay') {
        this.missionManager.completeDelivery();
      } else {
        this.physics.detachTrailer(this.missionManager.spawnedTrailer);
        this.soundManager.playHitchSound();
      }
    }
  }

  private rebuildTruckModel(truckId: string, color: string, metallic: number) {
    const truckStat = EconomyManager.AVAILABLE_TRUCKS.find(t => t.id === truckId) || EconomyManager.AVAILABLE_TRUCKS[0];
    this.scene.remove(this.truckGroup);
    this.truckGroup = TruckModelBuilder.createEuroTruck(color, metallic, 0.35, truckStat.chassis);
    this.scene.add(this.truckGroup);
  }

  private setupCameraInteraction() {
    window.addEventListener('mousedown', (e) => {
      if ((e.target as HTMLElement)?.closest('#hud-root') || (e.target as HTMLElement)?.closest('.fixed')) return;
      this.isPointerDown = true;
      this.pointerPrevPos = { x: e.clientX, y: e.clientY };
      this.soundManager.init();
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPointerDown) return;
      const dx = e.clientX - this.pointerPrevPos.x;
      const dy = e.clientY - this.pointerPrevPos.y;

      if (this.characterController.isActive) {
        this.hud.charInputs.lookX = dx * 1.5;
        this.hud.charInputs.lookY = dy * 1.5;
      } else {
        this.cameraOrbitAngleX -= dx * 0.005;
        this.cameraOrbitAngleY = Math.max(0.05, Math.min(1.2, this.cameraOrbitAngleY + dy * 0.005));
      }
      this.pointerPrevPos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isPointerDown = false;
      this.hud.charInputs.lookX = 0;
      this.hud.charInputs.lookY = 0;
    });

    window.addEventListener('touchstart', (e) => {
      if ((e.target as HTMLElement)?.closest('#hud-root') || (e.target as HTMLElement)?.closest('.fixed')) return;
      this.isPointerDown = true;
      const t = e.touches[0];
      this.pointerPrevPos = { x: t.clientX, y: t.clientY };
      this.soundManager.init();
    });

    window.addEventListener('touchmove', (e) => {
      if (!this.isPointerDown) return;
      const t = e.touches[0];
      const dx = t.clientX - this.pointerPrevPos.x;
      const dy = t.clientY - this.pointerPrevPos.y;

      if (this.characterController.isActive) {
        this.hud.charInputs.lookX = dx * 1.8;
        this.hud.charInputs.lookY = dy * 1.8;
      } else {
        this.cameraOrbitAngleX -= dx * 0.005;
        this.cameraOrbitAngleY = Math.max(0.05, Math.min(1.2, this.cameraOrbitAngleY + dy * 0.005));
      }
      this.pointerPrevPos = { x: t.clientX, y: t.clientY };
    });

    window.addEventListener('touchend', () => {
      this.isPointerDown = false;
      this.hud.charInputs.lookX = 0;
      this.hud.charInputs.lookY = 0;
    });
  }

  private setupResizeListener() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  private updateCamera() {
    const truckPos = this.physics.position;
    const truckHeading = this.physics.heading;

    if (this.characterController.isActive || this.currentCameraView === 'walk') {
      // First-Person Walk Camera
      const eyePos = this.characterController.getEyePosition();
      this.camera.position.copy(eyePos);

      const lookTarget = new THREE.Vector3(
        eyePos.x + Math.sin(this.characterController.heading) * 10 * Math.cos(this.characterController.pitch),
        eyePos.y + Math.sin(this.characterController.pitch) * 10,
        eyePos.z + Math.cos(this.characterController.heading) * 10 * Math.cos(this.characterController.pitch)
      );
      this.camera.lookAt(lookTarget);
    } else if (this.currentCameraView === 'chase') {
      // 3rd Person Orbital Chase Camera
      const followDist = this.physics.hasTrailer ? 15.0 : 11.5;
      const totalAngle = truckHeading + this.cameraOrbitAngleX;

      const camX = truckPos.x - Math.sin(totalAngle) * followDist * Math.cos(this.cameraOrbitAngleY);
      const camY = truckPos.y + followDist * Math.sin(this.cameraOrbitAngleY) + 3.0;
      const camZ = truckPos.z - Math.cos(totalAngle) * followDist * Math.cos(this.cameraOrbitAngleY);

      this.camera.position.set(camX, camY, camZ);
      this.camera.lookAt(truckPos.x, truckPos.y + 2.0, truckPos.z);
    } else if (this.currentCameraView === 'cabin') {
      // 1st Person Cockpit Interior Camera with Seat Adjustments
      const baseOffset = new THREE.Vector3(
        -0.55 + (this.seatSettings.lateral || 0),
        2.45 + (this.seatSettings.height || 0),
        0.85 + (this.seatSettings.distance || 0)
      );
      baseOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), truckHeading);
      const camPos = truckPos.clone().add(baseOffset);
      this.camera.position.copy(camPos);

      const pitchOffset = this.seatSettings.pitch || 0;
      const lookOffset = new THREE.Vector3(
        Math.sin(truckHeading + this.cameraOrbitAngleX * 0.8) * 15,
        -this.cameraOrbitAngleY * 2.0 + pitchOffset * 10,
        Math.cos(truckHeading + this.cameraOrbitAngleX * 0.8) * 15
      );
      this.camera.lookAt(camPos.clone().add(lookOffset));
    } else if (this.currentCameraView === 'top') {
      this.camera.position.set(truckPos.x, truckPos.y + 36, truckPos.z);
      this.camera.lookAt(truckPos.x, truckPos.y, truckPos.z);
    } else if (this.currentCameraView === 'cinematic') {
      const bumperOffset = new THREE.Vector3(0, 0.85, 2.5);
      bumperOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), truckHeading);
      const camPos = truckPos.clone().add(bumperOffset);
      this.camera.position.copy(camPos);

      const lookTarget = camPos.clone().add(new THREE.Vector3(Math.sin(truckHeading) * 20, 0.3, Math.cos(truckHeading) * 20));
      this.camera.lookAt(lookTarget);
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);

    const dt = this.clock.getDelta();

    // 1. Update Walking Character or Truck Physics
    if (this.characterController.isActive) {
      this.characterController.update(dt, this.hud.charInputs);
    } else {
      const trailerGroup = this.physics.hasTrailer ? this.missionManager.spawnedTrailer : null;
      this.physics.update(dt, this.hud.inputs, this.truckGroup, trailerGroup);
    }

    // 2. Animate Wind Turbines
    this.worldObjects.windmills.forEach((turbine) => {
      const rotor = (turbine as unknown as { rotorGroup: THREE.Group }).rotorGroup;
      if (rotor) rotor.rotation.z += 0.8 * dt;
    });

    // 3. Update AI Traffic
    const activePlayerPos = this.characterController.isActive ? this.characterController.position : this.physics.position;
    this.trafficManager.update(dt, activePlayerPos);

    // 4. Update Dynamic Weather & Sky
    this.weatherSystem.update(dt, this.camera.position);

    // 5. Gas Station Fuel Refill Check
    const distToGasStation = new THREE.Vector2(
      this.physics.position.x - this.worldObjects.fuelStationTrigger.x,
      this.physics.position.z - this.worldObjects.fuelStationTrigger.z
    ).length();

    if (distToGasStation < this.worldObjects.fuelStationTrigger.radius && this.physics.speedKmh < 1.0) {
      if (this.physics.fuelLevel < 99) {
        this.physics.fuelLevel = Math.min(100, this.physics.fuelLevel + 25 * dt);
      }
    }

    // 6. Check Delivery Bay Arrival
    if (this.physics.hasTrailer) {
      this.missionManager.checkDeliveryBayArrival(this.physics.position, true);
    }

    // 7. Check Trailer Hitch Distance
    const hitchStatus = this.missionManager.checkTrailerHitchDistance(activePlayerPos);

    // 8. Update Audio
    if (!this.characterController.isActive) {
      this.soundManager.updateEngine(this.physics.rpm, this.hud.inputs.throttle, this.physics.speedKmh);
    }

    // 9. Update GPS & Mini-Map
    this.gpsNav.update(this.physics.position, this.physics.heading);

    // 10. Update UI HUD
    this.hud.update(
      this.physics.speedKmh,
      this.physics.rpm,
      this.physics.fuelLevel,
      this.physics.currentGear,
      this.gpsNav.distanceRemainingKm,
      this.gpsNav.nextInstruction,
      this.gpsNav.currentSpeedLimit,
      hitchStatus.canHitch,
      this.physics.hasTrailer
    );

    // 11. Update Camera Position & Orientation
    this.updateCamera();

    // 12. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  };
}
