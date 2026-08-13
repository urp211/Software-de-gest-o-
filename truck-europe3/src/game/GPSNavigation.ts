import * as THREE from 'three';
import { MissionManager } from './MissionManager';

export class GPSNavigation {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private missionManager: MissionManager;
  public distanceRemainingKm: number = 0;
  public nextInstruction: string = 'Follow GPS Route';
  public currentSpeedLimit: number = 80;

  constructor(canvas: HTMLCanvasElement, missionManager: MissionManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.missionManager = missionManager;
  }

  public update(truckPos: THREE.Vector3, truckHeading: number) {
    const dest = this.missionManager.getDestination();
    const dx = dest.x - truckPos.x;
    const dz = dest.z - truckPos.z;
    const distMeters = Math.sqrt(dx * dx + dz * dz);
    this.distanceRemainingKm = parseFloat((distMeters / 100).toFixed(1));

    // Dynamic Guidance Instruction
    if (!this.missionManager.currentJob) {
      this.nextInstruction = 'No Active Job - Visit Freight Market';
      this.currentSpeedLimit = 80;
    } else if (this.missionManager.jobStage === 'hook_trailer') {
      this.nextInstruction = 'Reverse & Couple Trailer at Loading Dock';
      this.currentSpeedLimit = 30;
    } else if (this.missionManager.jobStage === 'deliver_to_dest') {
      if (Math.abs(truckPos.x) < 10 && truckPos.z < 120) {
        this.nextInstruction = 'Follow A1 European Highway (Speed: 80 km/h)';
        this.currentSpeedLimit = 80;
      } else if (truckPos.z >= 120 && truckPos.x < 150) {
        this.nextInstruction = 'Take Exit 14 towards East Logistics (Right)';
        this.currentSpeedLimit = 60;
      } else {
        this.nextInstruction = `Approaching ${this.missionManager.currentJob.destination}`;
        this.currentSpeedLimit = 50;
      }
    } else if (this.missionManager.jobStage === 'park_in_bay') {
      this.nextInstruction = 'PARK TRAILER IN MARKED BAY [PRESS UNHOOK]';
      this.currentSpeedLimit = 20;
    }

    // Render GPS Canvas
    this.renderMiniMap(truckPos, truckHeading, dest);
  }

  private renderMiniMap(truckPos: THREE.Vector3, truckHeading: number, dest: { x: number; z: number }) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;

    // Background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);

    // Save context for truck-centric rotation
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-truckHeading);

    const scale = 0.45; // pixels per world unit

    // 1. Draw Terrain / Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = -300; i <= 300; i += 50) {
      ctx.beginPath();
      ctx.moveTo((i - truckPos.x) * scale, (-300 - truckPos.z) * scale);
      ctx.lineTo((i - truckPos.x) * scale, (300 - truckPos.z) * scale);
      ctx.stroke();
    }

    // 2. Draw Highway & Roads
    // Main N-S Highway (x = 0, z: -450 to 450)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 18 * scale;
    ctx.beginPath();
    ctx.moveTo((0 - truckPos.x) * scale, (-450 - truckPos.z) * scale);
    ctx.lineTo((0 - truckPos.x) * scale, (450 - truckPos.z) * scale);
    ctx.stroke();

    // Road to Depot A
    ctx.beginPath();
    ctx.moveTo((-35 - truckPos.x) * scale, (-320 - truckPos.z) * scale);
    ctx.lineTo((0 - truckPos.x) * scale, (-320 - truckPos.z) * scale);
    ctx.stroke();

    // Road to Depot B
    ctx.beginPath();
    ctx.moveTo((0 - truckPos.x) * scale, (180 - truckPos.z) * scale);
    ctx.lineTo((320 - truckPos.x) * scale, (180 - truckPos.z) * scale);
    ctx.stroke();

    // 3. Draw Active Route Line (Cyan glowing path)
    if (this.missionManager.currentJob) {
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();

      if (this.missionManager.jobStage === 'hook_trailer') {
        ctx.moveTo((0 - truckPos.x) * scale, (0 - truckPos.z) * scale);
        ctx.lineTo((-35 - truckPos.x) * scale, (-305 - truckPos.z) * scale);
      } else {
        ctx.moveTo((truckPos.x - truckPos.x) * scale, (truckPos.z - truckPos.z) * scale);
        if (truckPos.z < 180) {
          ctx.lineTo((0 - truckPos.x) * scale, (180 - truckPos.z) * scale);
        }
        ctx.lineTo((dest.x - truckPos.x) * scale, (dest.z - truckPos.z) * scale);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Destination Marker
    if (this.missionManager.currentJob) {
      const destPx = (dest.x - truckPos.x) * scale;
      const destPz = (dest.z - truckPos.z) * scale;
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(destPx, destPz, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();

    // 5. Draw Player Truck Marker (fixed at center facing UP)
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(7, 8);
    ctx.lineTo(0, 4);
    ctx.lineTo(-7, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}
