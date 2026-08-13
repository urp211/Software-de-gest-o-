import type { PlayerProfile, TruckStats, CabinSeatSettings, SteeringMode } from './types';

export class EconomyManager {
  private profile: PlayerProfile;

  public static readonly AVAILABLE_TRUCKS: TruckStats[] = [
    {
      id: 'streamliner_v8',
      name: 'Streamliner V8 Euro-6',
      brand: 'Scania Style',
      price: 0, // Starter truck
      engineHp: 520,
      torque: 2700,
      topSpeed: 120,
      fuelCapacity: 600,
      chassis: '4x2',
      color: '#dc2626', // Red
      metallic: 0.65,
      roughness: 0.35
    },
    {
      id: 'euro_titan_6x4',
      name: 'EuroTitan 750 Heavy Duty',
      brand: 'Volvo Style',
      price: 135000,
      engineHp: 750,
      torque: 3550,
      topSpeed: 140,
      fuelCapacity: 900,
      chassis: '6x4',
      color: '#0284c7', // Sapphire Blue
      metallic: 0.8,
      roughness: 0.25
    },
    {
      id: 'continental_lux',
      name: 'Continental Actros Star',
      brand: 'Mercedes Style',
      price: 180000,
      engineHp: 630,
      torque: 3000,
      topSpeed: 130,
      fuelCapacity: 800,
      chassis: '6x2',
      color: '#0f172a', // Midnight Black
      metallic: 0.9,
      roughness: 0.2
    }
  ];

  constructor() {
    const saved = localStorage.getItem('toe3_player_profile');
    if (saved) {
      try {
        this.profile = JSON.parse(saved);
        if (!this.profile.seatSettings) {
          this.profile.seatSettings = { height: 0, distance: 0, lateral: 0, pitch: 0, fov: 65 };
        }
        if (!this.profile.steeringMode) {
          this.profile.steeringMode = 'wheel';
        }
      } catch {
        this.profile = this.getDefaultProfile();
      }
    } else {
      this.profile = this.getDefaultProfile();
    }
  }

  private getDefaultProfile(): PlayerProfile {
    return {
      money: 12500,
      xp: 450,
      level: 1,
      currentTruckId: 'streamliner_v8',
      ownedTruckIds: ['streamliner_v8'],
      customizations: {
        streamliner_v8: {
          color: '#dc2626',
          metallic: 0.65,
          engineTier: 1,
          rimStyle: 1
        }
      },
      seatSettings: {
        height: 0,
        distance: 0,
        lateral: 0,
        pitch: 0,
        fov: 65
      },
      steeringMode: 'wheel',
      completedJobsCount: 0,
      totalDistanceDriven: 0
    };
  }

  public save() {
    localStorage.setItem('toe3_player_profile', JSON.stringify(this.profile));
  }

  public getProfile(): PlayerProfile {
    return this.profile;
  }

  public addMoney(amount: number) {
    this.profile.money += amount;
    this.save();
  }

  public deductMoney(amount: number): boolean {
    if (this.profile.money >= amount) {
      this.profile.money -= amount;
      this.save();
      return true;
    }
    return false;
  }

  public addXp(amount: number): { leveledUp: boolean; newLevel: number } {
    this.profile.xp += amount;
    const nextLevelXp = this.profile.level * 1000;
    let leveledUp = false;
    if (this.profile.xp >= nextLevelXp) {
      this.profile.level += 1;
      leveledUp = true;
    }
    this.save();
    return { leveledUp, newLevel: this.profile.level };
  }

  public buyTruck(truckId: string): boolean {
    const truck = EconomyManager.AVAILABLE_TRUCKS.find(t => t.id === truckId);
    if (!truck) return false;
    if (this.profile.ownedTruckIds.includes(truckId)) return true;

    if (this.deductMoney(truck.price)) {
      this.profile.ownedTruckIds.push(truckId);
      this.profile.currentTruckId = truckId;
      if (!this.profile.customizations[truckId]) {
        this.profile.customizations[truckId] = {
          color: truck.color,
          metallic: truck.metallic,
          engineTier: 1,
          rimStyle: 1
        };
      }
      this.save();
      return true;
    }
    return false;
  }

  public selectTruck(truckId: string) {
    if (this.profile.ownedTruckIds.includes(truckId)) {
      this.profile.currentTruckId = truckId;
      this.save();
    }
  }

  public updateTruckColor(truckId: string, hexColor: string, metallic: number) {
    if (!this.profile.customizations[truckId]) {
      this.profile.customizations[truckId] = { color: hexColor, metallic, engineTier: 1, rimStyle: 1 };
    } else {
      this.profile.customizations[truckId].color = hexColor;
      this.profile.customizations[truckId].metallic = metallic;
    }
    this.save();
  }

  public setSeatSettings(settings: CabinSeatSettings) {
    this.profile.seatSettings = settings;
    this.save();
  }

  public setSteeringMode(mode: SteeringMode) {
    this.profile.steeringMode = mode;
    this.save();
  }
}
