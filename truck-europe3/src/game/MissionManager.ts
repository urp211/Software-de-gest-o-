import * as THREE from 'three';
import type { CargoJob } from './types';
import { TrailerModelBuilder, type TrailerMeshGroup } from './TrailerModel';
import { EconomyManager } from './EconomyManager';
import { SoundManager } from '../audio/SoundManager';

export class MissionManager {
  public currentJob: CargoJob | null = null;
  public jobStage: 'none' | 'hook_trailer' | 'deliver_to_dest' | 'park_in_bay' | 'completed' = 'none';
  public spawnedTrailer: TrailerMeshGroup | null = null;
  
  private scene: THREE.Scene;
  private economy: EconomyManager;
  private soundManager: SoundManager;
  private destinationCoords: { x: number; z: number } = { x: 300, z: 190 };
  private onJobCompletedCallback?: (job: CargoJob, reward: number, xp: number) => void;

  public static readonly JOBS_CATALOG: CargoJob[] = [
    {
      id: 'job_heavy_machinery',
      title: 'Industrial Heavy Machinery',
      cargoType: 'Machinery Parts',
      trailerType: 'curtain',
      weightTonnes: 24.5,
      reward: 6400,
      xpReward: 850,
      origin: 'Berlin Depot A',
      destination: 'Rotterdam Logistics B',
      destCoordinates: { x: 300, z: 190 },
      distanceKm: 6.8,
      timeLimitSec: 480,
      difficulty: 'medium'
    },
    {
      id: 'job_auto_engines',
      title: 'Automotive Engine Blocks',
      cargoType: 'Engine Components',
      trailerType: 'container',
      weightTonnes: 19.2,
      reward: 5800,
      xpReward: 720,
      origin: 'Munich Warehouse A',
      destination: 'Rotterdam Logistics B',
      destCoordinates: { x: 300, z: 190 },
      distanceKm: 6.8,
      timeLimitSec: 420,
      difficulty: 'easy'
    },
    {
      id: 'job_refined_fuel',
      title: 'Refined Diesel & Biofuel',
      cargoType: 'Hazardous Liquids (ADR)',
      trailerType: 'tanker',
      weightTonnes: 28.0,
      reward: 9200,
      xpReward: 1200,
      origin: 'Hamburg Refinery A',
      destination: 'Rotterdam Logistics B',
      destCoordinates: { x: 300, z: 190 },
      distanceKm: 6.8,
      timeLimitSec: 540,
      difficulty: 'hard'
    },
    {
      id: 'job_frozen_food',
      title: 'Refrigerated Fresh Goods',
      cargoType: 'Perishable Food Supplies',
      trailerType: 'refrigerated',
      weightTonnes: 16.0,
      reward: 5100,
      xpReward: 650,
      origin: 'Amsterdam Logistics A',
      destination: 'Rotterdam Logistics B',
      destCoordinates: { x: 300, z: 190 },
      distanceKm: 6.8,
      timeLimitSec: 360,
      difficulty: 'easy'
    }
  ];

  constructor(scene: THREE.Scene, economy: EconomyManager, soundManager: SoundManager) {
    this.scene = scene;
    this.economy = economy;
    this.soundManager = soundManager;
  }

  public setOnJobCompleted(cb: (job: CargoJob, reward: number, xp: number) => void) {
    this.onJobCompletedCallback = cb;
  }

  public startJob(jobId: string, _truckHitchPos?: THREE.Vector3): boolean {
    const job = MissionManager.JOBS_CATALOG.find(j => j.id === jobId);
    if (!job) return false;

    // Clear old trailer if any
    this.clearCurrentTrailer();

    this.currentJob = job;
    this.destinationCoords = job.destCoordinates;
    this.jobStage = 'hook_trailer';

    // Spawn trailer near Depot A loading dock
    this.spawnedTrailer = TrailerModelBuilder.createTrailer(job.trailerType);
    this.spawnedTrailer.position.set(-35, 0, -305);
    this.spawnedTrailer.rotation.y = 0;
    this.scene.add(this.spawnedTrailer);

    return true;
  }

  public clearCurrentTrailer() {
    if (this.spawnedTrailer) {
      this.scene.remove(this.spawnedTrailer);
      this.spawnedTrailer = null;
    }
    this.currentJob = null;
    this.jobStage = 'none';
  }

  public checkTrailerHitchDistance(truckHitchPos: THREE.Vector3): { canHitch: boolean; distance: number } {
    if (!this.spawnedTrailer) return { canHitch: false, distance: 999 };

    // Trailer hitch pin world coordinates
    const trailerHitchWorld = new THREE.Vector3(0, 0.88, 0.5);
    trailerHitchWorld.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.spawnedTrailer.rotation.y);
    trailerHitchWorld.add(this.spawnedTrailer.position);

    const dist = truckHitchPos.distanceTo(trailerHitchWorld);
    return { canHitch: dist < 3.2, distance: dist };
  }

  public checkDeliveryBayArrival(truckPos: THREE.Vector3, hasTrailer: boolean): boolean {
    if (!this.currentJob || this.jobStage !== 'deliver_to_dest' || !hasTrailer) return false;

    const dx = truckPos.x - this.destinationCoords.x;
    const dz = truckPos.z - this.destinationCoords.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 22) {
      this.jobStage = 'park_in_bay';
      return true;
    }
    return false;
  }

  public completeDelivery(): { reward: number; xp: number } | null {
    if (!this.currentJob) return null;

    const reward = this.currentJob.reward;
    const xp = this.currentJob.xpReward;

    this.economy.addMoney(reward);
    this.economy.addXp(xp);
    this.soundManager.playJobSuccess();

    const completed = this.currentJob;
    this.clearCurrentTrailer();
    this.jobStage = 'completed';

    if (this.onJobCompletedCallback) {
      this.onJobCompletedCallback(completed, reward, xp);
    }

    return { reward, xp };
  }

  public getDestination(): { x: number; z: number } {
    return this.destinationCoords;
  }
}
