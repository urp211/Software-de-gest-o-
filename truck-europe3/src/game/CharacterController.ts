import * as THREE from 'three';
import type { CharacterInputs } from './types';
import { SoundManager } from '../audio/SoundManager';

export class CharacterController {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public heading: number = 0; // Look horizontal angle
  public pitch: number = 0; // Look vertical angle
  public isWalking: boolean = false;
  public isActive: boolean = false;
  public characterMesh: THREE.Group;

  private velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private soundManager: SoundManager;
  private walkSpeed: number = 4.8;
  private sprintSpeed: number = 8.5;
  private headBobTimer: number = 0;
  public headBobOffset: number = 0;

  constructor(scene: THREE.Scene, soundManager: SoundManager) {
    this.soundManager = soundManager;
    this.characterMesh = this.createDriverMesh();
    this.characterMesh.visible = false;
    scene.add(this.characterMesh);
  }

  private createDriverMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PlayerDriverMesh';

    const clothesMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const jacketMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }); // High-vis orange trucker vest
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69, roughness: 0.6 });
    const capMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.5 });

    // Legs
    const legL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), clothesMat);
    legL.position.set(-0.14, 0.4, 0);
    const legR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.22), clothesMat);
    legR.position.set(0.14, 0.4, 0);

    // Torso / High-Vis Jacket
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.28), jacketMat);
    torso.position.set(0, 1.15, 0);

    // High-vis reflective stripes
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.49, 0.08, 0.29), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    stripe.position.set(0, 1.15, 0);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.26, 0.24), skinMat);
    head.position.set(0, 1.62, 0);

    // Trucker Cap
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.1, 0.32), capMat);
    cap.position.set(0, 1.76, 0.04);

    group.add(legL, legR, torso, stripe, head, cap);
    group.castShadow = true;
    return group;
  }

  public exitTruck(truckPos: THREE.Vector3, truckHeading: number) {
    this.isActive = true;
    this.characterMesh.visible = true;

    // Step out of driver's side door
    const exitOffset = new THREE.Vector3(-1.8, 0, 0.8);
    exitOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), truckHeading);
    this.position.copy(truckPos).add(exitOffset);
    this.position.y = 0;

    this.heading = truckHeading - Math.PI / 2;
    this.pitch = 0;
    this.velocity.set(0, 0, 0);
    this.soundManager.playDoorSound(true);
  }

  public enterTruck(): boolean {
    this.isActive = false;
    this.characterMesh.visible = false;
    this.soundManager.playDoorSound(false);
    return true;
  }

  public update(dt: number, inputs: CharacterInputs) {
    if (!this.isActive) return;

    const safeDt = Math.min(dt, 0.1);

    // Update Look rotation
    this.heading -= inputs.lookX * 2.2 * safeDt;
    this.pitch = Math.max(-1.1, Math.min(1.1, this.pitch - inputs.lookY * 2.2 * safeDt));

    // Movement direction vectors relative to current look heading
    const forward = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    const right = new THREE.Vector3(Math.cos(this.heading), 0, -Math.sin(this.heading));

    const moveDir = new THREE.Vector3();
    moveDir.addScaledVector(forward, inputs.moveForward);
    moveDir.addScaledVector(right, inputs.moveRight);

    if (moveDir.lengthSq() > 0.01) {
      moveDir.normalize();
      const speed = inputs.isSprinting ? this.sprintSpeed : this.walkSpeed;
      this.velocity.copy(moveDir).multiplyScalar(speed);
      this.isWalking = true;

      // Head bobbing & footsteps
      this.headBobTimer += safeDt * (inputs.isSprinting ? 14 : 9);
      this.headBobOffset = Math.sin(this.headBobTimer) * 0.06;

      if (Math.sin(this.headBobTimer) > 0.85) {
        this.soundManager.playFootstep();
      }
    } else {
      this.velocity.set(0, 0, 0);
      this.isWalking = false;
      this.headBobOffset *= 0.8;
    }

    // Apply movement
    this.position.addScaledVector(this.velocity, safeDt);
    this.position.y = 0; // Stay grounded

    // Update 3D mesh
    this.characterMesh.position.copy(this.position);
    this.characterMesh.rotation.y = this.heading;
  }

  public getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + 1.65 + this.headBobOffset,
      this.position.z
    );
  }

  public checkDistanceToTruck(truckPos: THREE.Vector3): number {
    return this.position.distanceTo(truckPos);
  }
}
