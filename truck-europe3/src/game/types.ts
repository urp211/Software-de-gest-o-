export type WeatherType = 'sunny' | 'rainy' | 'foggy' | 'sunset' | 'night';

export type CameraView = 'chase' | 'cabin' | 'top' | 'cinematic' | 'walk';

export type TransmissionMode = 'D' | 'N' | 'R' | 'P';

export type SteeringMode = 'wheel' | 'buttons' | 'tilt';

export interface CabinSeatSettings {
  height: number; // -0.2 to +0.3
  distance: number; // -0.3 to +0.3 (forward/backward)
  lateral: number; // -0.15 to +0.15 (left/right)
  pitch: number; // -0.2 to +0.2 (look angle)
  fov: number; // 50 to 85 degrees
}

export interface TruckStats {
  id: string;
  name: string;
  brand: string;
  price: number;
  engineHp: number;
  torque: number;
  topSpeed: number;
  fuelCapacity: number;
  chassis: '4x2' | '6x2' | '6x4';
  color: string;
  metallic: number;
  roughness: number;
}

export interface CargoJob {
  id: string;
  title: string;
  cargoType: string;
  trailerType: 'curtain' | 'container' | 'tanker' | 'refrigerated';
  weightTonnes: number;
  reward: number;
  xpReward: number;
  origin: string;
  destination: string;
  destCoordinates: { x: number; z: number };
  distanceKm: number;
  timeLimitSec: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PlayerProfile {
  money: number;
  xp: number;
  level: number;
  currentTruckId: string;
  ownedTruckIds: string[];
  customizations: {
    [truckId: string]: {
      color: string;
      metallic: number;
      engineTier: number;
      rimStyle: number;
    }
  };
  seatSettings: CabinSeatSettings;
  steeringMode: SteeringMode;
  completedJobsCount: number;
  totalDistanceDriven: number;
}

export interface VehicleInputs {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (left) to +1 (right)
  handbrake: boolean;
  gear: TransmissionMode;
  engineRunning: boolean;
  headlights: 0 | 1 | 2; // 0: off, 1: low, 2: high
  leftIndicator: boolean;
  rightIndicator: boolean;
  hazardLights: boolean;
  wipers: boolean;
  horn: boolean;
  cruiseControl: boolean;
  cruiseSpeed: number;
}

export interface CharacterInputs {
  moveForward: number; // -1 to 1
  moveRight: number; // -1 to 1
  lookX: number;
  lookY: number;
  isSprinting: boolean;
  interact: boolean;
}
