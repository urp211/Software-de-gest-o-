import * as THREE from 'three';
import type { VehicleInputs } from './types';
import type { TruckMeshGroup } from './TruckModel';
import type { TrailerMeshGroup } from './TrailerModel';

export class PhysicsEngine {
  // Truck state
  public position: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public heading: number = 0; // In radians (0 = facing +Z)
  public speedKmh: number = 0; // km/h (positive forward, negative reverse)
  public rpm: number = 800; // Idle 600 - 800, max 2400
  public currentGear: number = 1; // 1 to 12 in D, -1 in R, 0 in N/P
  public steeringAngle: number = 0; // In radians
  public maxSteerAngle: number = 0.55; // ~31 degrees

  // Trailer state
  public hasTrailer: boolean = false;
  public trailerPosition: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  public trailerHeading: number = 0;
  public trailerAngleDiff: number = 0; // Relative angle to truck
  private trailerWheelbase: number = 7.5; // Distance from kingpin to trailer axle center

  // Suspension & Body Lean
  public bodyPitch: number = 0;
  public bodyRoll: number = 0;

  // Fuel & Stats
  public fuelLevel: number = 92.5; // percentage 0-100%
  public fuelConsumptionRate: number = 0.0008; // % per second base
  public damagePercent: number = 0;

  // Constants
  private readonly maxSpeedForwardKmh = 110;
  private readonly maxSpeedReverseKmh = 25;
  private readonly enginePowerHp = 520;
  private readonly brakePower = 45;
  private readonly handbrakePower = 80;
  private readonly dragCoefficient = 0.003;
  private readonly rollingResistance = 0.08;
  private readonly truckWheelbase = 4.2;

  constructor() {
    this.position.set(0, 0, 0);
    this.heading = 0;
  }

  public setInitialPosition(x: number, z: number, headingRad: number) {
    this.position.set(x, 0, z);
    this.heading = headingRad;
    this.velocity.set(0, 0, 0);
    this.speedKmh = 0;
    this.steeringAngle = 0;
    this.updateTrailerPosition(true);
  }

  public attachTrailer(trailerGroup: TrailerMeshGroup) {
    this.hasTrailer = true;
    this.trailerHeading = this.heading;
    this.updateTrailerPosition(true);
    if (trailerGroup.landingGear) {
      trailerGroup.landingGear.position.y = 0.4; // Retract landing gear
    }
  }

  public detachTrailer(trailerGroup: TrailerMeshGroup) {
    this.hasTrailer = false;
    if (trailerGroup.landingGear) {
      trailerGroup.landingGear.position.y = 0.0; // Lower landing gear
    }
  }

  public update(
    dt: number,
    inputs: VehicleInputs,
    truckGroup: TruckMeshGroup,
    trailerGroup: TrailerMeshGroup | null
  ) {
    // Clamp delta time to avoid large physics steps
    const safeDt = Math.min(dt, 0.1);

    // 1. STEERING CALCULATION
    const targetSteer = inputs.steer * this.maxSteerAngle;
    // Speed sensitivity (higher speed reduces maximum steering sensitivity for stability)
    const speedFactor = Math.max(0.3, 1.0 - (Math.abs(this.speedKmh) / 130) * 0.6);
    const effectiveTargetSteer = targetSteer * speedFactor;
    
    // Smooth interpolation with return-to-center spring effect
    const steerSpeed = inputs.steer !== 0 ? 3.5 : 5.0;
    this.steeringAngle += (effectiveTargetSteer - this.steeringAngle) * steerSpeed * safeDt;

    // 2. ENGINE & TRANSMISSION
    if (!inputs.engineRunning || this.fuelLevel <= 0) {
      this.rpm = Math.max(0, this.rpm - 1500 * safeDt);
    } else {
      // Automatic transmission logic
      if (inputs.gear === 'D') {
        const speed = Math.max(0, this.speedKmh);
        // Automatic 12-speed shifting thresholds
        const targetGear = Math.min(12, Math.max(1, Math.floor(speed / 8) + 1));
        this.currentGear = targetGear;

        // RPM calculation based on speed in current gear
        const gearRatio = 14.0 / (this.currentGear * 1.15 + 1);
        const engineTargetRpm = 650 + (speed * gearRatio * 3.2) + (inputs.throttle * 400);
        this.rpm += (engineTargetRpm - this.rpm) * 6.0 * safeDt;
      } else if (inputs.gear === 'R') {
        this.currentGear = -1;
        const revSpeed = Math.abs(this.speedKmh);
        const engineTargetRpm = 650 + (revSpeed * 50) + (inputs.throttle * 400);
        this.rpm += (engineTargetRpm - this.rpm) * 6.0 * safeDt;
      } else {
        // N or P: Neutral idle with throttle revving
        this.currentGear = 0;
        const targetRpm = 650 + inputs.throttle * 1500;
        this.rpm += (targetRpm - this.rpm) * 8.0 * safeDt;
      }

      this.rpm = Math.min(2400, Math.max(650, this.rpm));

      // Fuel consumption
      const loadFactor = 1.0 + (inputs.throttle * 2.5) + (this.hasTrailer ? 0.8 : 0);
      this.fuelLevel = Math.max(0, this.fuelLevel - this.fuelConsumptionRate * loadFactor * safeDt);
    }

    // 3. ACCELERATION & BRAKING FORCES
    let accel = 0;
    const currentSpeedMs = (this.speedKmh / 3.6);

    if (inputs.engineRunning && this.fuelLevel > 0) {
      if (inputs.gear === 'D') {
        if (inputs.throttle > 0 && this.speedKmh < this.maxSpeedForwardKmh) {
          // Horsepower & torque curve
          const powerCurve = (this.enginePowerHp / 500) * (this.hasTrailer ? 4.2 : 6.5);
          accel += inputs.throttle * powerCurve;
        }
      } else if (inputs.gear === 'R') {
        if (inputs.throttle > 0 && Math.abs(this.speedKmh) < this.maxSpeedReverseKmh) {
          accel -= inputs.throttle * 3.8;
        }
      }
    }

    // Foot Brake
    if (inputs.brake > 0) {
      if (this.speedKmh > 0.5) {
        accel -= inputs.brake * this.brakePower;
      } else if (this.speedKmh < -0.5) {
        accel += inputs.brake * this.brakePower;
      } else {
        this.speedKmh = 0;
      }
    }

    // Handbrake / Parking Brake (P)
    if (inputs.handbrake || inputs.gear === 'P') {
      if (Math.abs(this.speedKmh) > 0.2) {
        accel -= Math.sign(this.speedKmh) * this.handbrakePower;
      } else {
        this.speedKmh = 0;
      }
    }

    // Drag & Rolling Resistance
    const drag = Math.sign(this.speedKmh) * (this.speedKmh * this.speedKmh * this.dragCoefficient + this.rollingResistance);
    accel -= drag;

    // Apply acceleration to speed
    let newSpeedMs = currentSpeedMs + accel * safeDt;

    // Stop vibration when nearly stopped and no throttle
    if (Math.abs(newSpeedMs) < 0.1 && inputs.throttle === 0 && (inputs.brake > 0 || inputs.handbrake || inputs.gear === 'P')) {
      newSpeedMs = 0;
    }

    this.speedKmh = newSpeedMs * 3.6;

    // 4. TURNING & HEADING KINEMATICS (Bicycle / Ackermann Model)
    if (Math.abs(this.speedKmh) > 0.05) {
      const turnRate = (newSpeedMs / this.truckWheelbase) * Math.tan(this.steeringAngle);
      this.heading += turnRate * safeDt;
    }

    // 5. POSITION INTEGRATION
    const forwardVec = new THREE.Vector3(Math.sin(this.heading), 0, Math.cos(this.heading));
    this.velocity.copy(forwardVec).multiplyScalar(newSpeedMs);
    this.position.addScaledVector(this.velocity, safeDt);

    // Keep truck grounded
    this.position.y = 0;

    // 6. TRAILER ARTICULATION PHYSICS
    if (this.hasTrailer && trailerGroup) {
      this.updateTrailerPhysics(safeDt);
    }

    // 7. BODY ROLL & PITCH (Dynamic visual suspension response)
    const targetPitch = (accel / 20) * 0.04 - (inputs.brake * 0.03);
    this.bodyPitch += (targetPitch - this.bodyPitch) * 6.0 * safeDt;

    const lateralG = (this.speedKmh / 3.6) * (this.speedKmh / 3.6) * Math.tan(this.steeringAngle) / this.truckWheelbase;
    const targetRoll = Math.max(-0.12, Math.min(0.12, -lateralG * 0.015));
    this.bodyRoll += (targetRoll - this.bodyRoll) * 6.0 * safeDt;

    // 8. UPDATE 3D MESH TRANSFORMS
    this.syncTruckMesh(truckGroup, inputs);
    if (this.hasTrailer && trailerGroup) {
      this.syncTrailerMesh(trailerGroup, inputs);
    }
  }

  private updateTrailerPhysics(dt: number) {
    // Calculate 5th wheel hitch world position on truck
    const hitchOffset = new THREE.Vector3(0, 0.88, -2.1);
    hitchOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
    const hitchWorldPos = this.position.clone().add(hitchOffset);

    // Vector from trailer axle center to hitch
    const trailerAxleToHitch = hitchWorldPos.clone().sub(this.trailerPosition);
    const currentDistance = trailerAxleToHitch.length();

    if (currentDistance > 0.001) {
      // Realistic trailing kinematic equation
      const targetTrailerHeading = Math.atan2(trailerAxleToHitch.x, trailerAxleToHitch.z);
      
      let angleDiff = targetTrailerHeading - this.trailerHeading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Rate of trailer rotation depends on speed and direction
      const forwardSpeed = this.speedKmh / 3.6;
      if (forwardSpeed >= 0) {
        // Forward driving: trailer naturally aligns smoothly
        const followSpeed = Math.max(1.5, Math.abs(forwardSpeed) / (this.trailerWheelbase * 0.7));
        this.trailerHeading += angleDiff * Math.min(1.0, followSpeed * dt);
      } else {
        // Reverse driving: trailer articulates and can jackknife!
        const reverseSensitivity = 2.2;
        this.trailerHeading += (this.heading - this.trailerHeading + this.steeringAngle * 1.5) * Math.abs(forwardSpeed) * dt * reverseSensitivity;
      }

      // Constrain trailer position so kingpin stays attached to hitch
      const trailerDir = new THREE.Vector3(Math.sin(this.trailerHeading), 0, Math.cos(this.trailerHeading));
      this.trailerPosition.copy(hitchWorldPos).sub(trailerDir.clone().multiplyScalar(this.trailerWheelbase * 0.65));
      this.trailerPosition.y = 0;

      // Calculate relative angle difference between truck and trailer
      let diff = this.trailerHeading - this.heading;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.trailerAngleDiff = diff;
    }
  }

  public updateTrailerPosition(forceSnap: boolean = false) {
    const hitchOffset = new THREE.Vector3(0, 0.88, -2.1);
    hitchOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.heading);
    const hitchWorldPos = this.position.clone().add(hitchOffset);

    if (forceSnap) {
      this.trailerHeading = this.heading;
      const trailerDir = new THREE.Vector3(Math.sin(this.trailerHeading), 0, Math.cos(this.trailerHeading));
      this.trailerPosition.copy(hitchWorldPos).sub(trailerDir.clone().multiplyScalar(this.trailerWheelbase * 0.65));
      this.trailerPosition.y = 0;
    }
  }

  private syncTruckMesh(truckGroup: TruckMeshGroup, inputs: VehicleInputs) {
    truckGroup.position.copy(this.position);
    truckGroup.rotation.y = this.heading;
    truckGroup.rotation.x = this.bodyPitch;
    truckGroup.rotation.z = this.bodyRoll;

    // Turn steering wheel
    if (truckGroup.steeringWheel) {
      truckGroup.steeringWheel.rotation.z = -this.steeringAngle * 3.5;
    }

    // Front wheels steering angle & rotation
    const wheelRotSpeed = (this.speedKmh / 3.6) / 0.5; // v / r
    if (truckGroup.frontWheelLeft) {
      truckGroup.frontWheelLeft.rotation.y = this.steeringAngle;
      truckGroup.frontWheelLeft.rotation.x += wheelRotSpeed * 0.016;
    }
    if (truckGroup.frontWheelRight) {
      truckGroup.frontWheelRight.rotation.y = this.steeringAngle;
      truckGroup.frontWheelRight.rotation.x += wheelRotSpeed * 0.016;
    }

    // Rear wheels rotation
    if (truckGroup.rearWheels) {
      truckGroup.rearWheels.forEach((wheelGroup) => {
        wheelGroup.rotation.x += wheelRotSpeed * 0.016;
      });
    }

    // Wipers animation
    if (truckGroup.wiperLeft && truckGroup.wiperRight) {
      if (inputs.wipers) {
        const wiperCycle = Math.sin(Date.now() * 0.006);
        const wiperAngle = wiperCycle * 0.7 - 0.2;
        truckGroup.wiperLeft.rotation.z = wiperAngle;
        truckGroup.wiperRight.rotation.z = wiperAngle;
      } else {
        truckGroup.wiperLeft.rotation.z = -0.3;
        truckGroup.wiperRight.rotation.z = -0.3;
      }
    }

    // Headlights
    const headlightIntensity = inputs.headlights === 2 ? 5.5 : (inputs.headlights === 1 ? 2.5 : 0);
    if (truckGroup.headlightLeft && truckGroup.headlightRight) {
      truckGroup.headlightLeft.intensity = headlightIntensity;
      truckGroup.headlightRight.intensity = headlightIntensity;
    }

    if (truckGroup.headlightMaterials) {
      const emissiveHex = inputs.headlights > 0 ? 0xffffff : 0x222222;
      truckGroup.headlightMaterials.forEach(m => m.emissive.setHex(emissiveHex));
    }

    // Brake Lights (glowing red when braking or handbrake active)
    const isBraking = inputs.brake > 0.05 || inputs.handbrake;
    const brakeColor = isBraking ? 0xff0000 : (inputs.headlights > 0 ? 0x660000 : 0x220000);
    if (truckGroup.brakeLightMaterials) {
      truckGroup.brakeLightMaterials.forEach(m => m.emissive.setHex(brakeColor));
    }

    // Reverse Lights
    const isReverse = inputs.gear === 'R';
    if (truckGroup.reverseLightMaterials) {
      truckGroup.reverseLightMaterials.forEach(m => m.emissive.setHex(isReverse ? 0xdddddd : 0x000000));
    }

    // Blinkers (Amber pulsating ~1.5Hz)
    const blinkPhase = Math.floor(Date.now() / 350) % 2 === 0;
    const leftOn = (inputs.leftIndicator || inputs.hazardLights) && blinkPhase;
    const rightOn = (inputs.rightIndicator || inputs.hazardLights) && blinkPhase;

    if (truckGroup.leftIndicatorMaterials) {
      truckGroup.leftIndicatorMaterials.forEach(m => m.emissive.setHex(leftOn ? 0xff8800 : 0x000000));
    }
    if (truckGroup.rightIndicatorMaterials) {
      truckGroup.rightIndicatorMaterials.forEach(m => m.emissive.setHex(rightOn ? 0xff8800 : 0x000000));
    }
  }

  private syncTrailerMesh(trailerGroup: TrailerMeshGroup, inputs: VehicleInputs) {
    trailerGroup.position.copy(this.trailerPosition);
    trailerGroup.rotation.y = this.trailerHeading;

    // Trailer wheels rotation
    const wheelRotSpeed = (this.speedKmh / 3.6) / 0.5;
    if (trailerGroup.wheels) {
      trailerGroup.wheels.forEach(w => {
        w.rotation.x += wheelRotSpeed * 0.016;
      });
    }

    // Trailer Brake Lights sync
    const isBraking = inputs.brake > 0.05 || inputs.handbrake;
    const brakeColor = isBraking ? 0xff0000 : (inputs.headlights > 0 ? 0x660000 : 0x220000);
    if (trailerGroup.brakeLightMaterials) {
      trailerGroup.brakeLightMaterials.forEach(m => m.emissive.setHex(brakeColor));
    }

    // Trailer Blinkers sync
    const blinkPhase = Math.floor(Date.now() / 350) % 2 === 0;
    const leftOn = (inputs.leftIndicator || inputs.hazardLights) && blinkPhase;
    const rightOn = (inputs.rightIndicator || inputs.hazardLights) && blinkPhase;

    if (trailerGroup.leftIndicatorMaterials) {
      trailerGroup.leftIndicatorMaterials.forEach(m => m.emissive.setHex(leftOn ? 0xff8800 : 0x000000));
    }
    if (trailerGroup.rightIndicatorMaterials) {
      trailerGroup.rightIndicatorMaterials.forEach(m => m.emissive.setHex(rightOn ? 0xff8800 : 0x000000));
    }
  }
}
