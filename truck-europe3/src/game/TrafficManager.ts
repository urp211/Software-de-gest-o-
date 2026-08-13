import * as THREE from 'three';

export interface TrafficCar {
  mesh: THREE.Group;
  lane: 'north_left' | 'north_right' | 'south_left' | 'south_right';
  x: number;
  z: number;
  speed: number;
  targetSpeed: number;
  direction: number; // +1 or -1
  type: string;
}

export class TrafficManager {
  private cars: TrafficCar[] = [];
  public trafficGroup: THREE.Group;

  constructor(scene: THREE.Scene) {
    this.trafficGroup = new THREE.Group();
    this.trafficGroup.name = 'AITraffic';
    scene.add(this.trafficGroup);
    this.initTraffic();
  }

  private initTraffic() {
    const laneConfigs: Array<{ lane: TrafficCar['lane']; x: number; dir: number }> = [
      { lane: 'north_left', x: -6.5, dir: -1 },
      { lane: 'north_right', x: -2.5, dir: -1 },
      { lane: 'south_left', x: 2.5, dir: 1 },
      { lane: 'south_right', x: 6.5, dir: 1 }
    ];

    const carColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0xffffff, 0x1e293b, 0xd97706];

    for (let i = 0; i < 18; i++) {
      const cfg = laneConfigs[i % laneConfigs.length];
      const z = -400 + Math.random() * 800;
      const speedKmh = 70 + Math.random() * 30;
      const color = carColors[Math.floor(Math.random() * carColors.length)];

      const isVan = Math.random() > 0.7;
      const mesh = isVan ? this.createDeliveryVan(color) : this.createSedanCar(color);
      mesh.position.set(cfg.x, 0, z);
      mesh.rotation.y = cfg.dir === 1 ? 0 : Math.PI;

      this.trafficGroup.add(mesh);
      this.cars.push({
        mesh,
        lane: cfg.lane,
        x: cfg.x,
        z,
        speed: speedKmh / 3.6,
        targetSpeed: speedKmh / 3.6,
        direction: cfg.dir,
        type: isVan ? 'van' : 'car'
      });
    }
  }

  private createSedanCar(color: number): THREE.Group {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.6 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const glassMat = new THREE.MeshPhysicalMaterial({ color: 0x223344, transparent: true, opacity: 0.4 });

    // Lower chassis
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.65, 4.4), bodyMat);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    car.add(body);

    // Cabin / Roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 2.3), bodyMat);
    roof.position.set(0, 1.1, -0.2);
    car.add(roof);

    // Windows
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.5, 2.2), glassMat);
    glass.position.set(0, 1.08, -0.2);
    car.add(glass);

    // Headlights
    const headL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffee }));
    headL.position.set(-0.65, 0.6, 2.2);
    const headR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xffffee }));
    headR.position.set(0.65, 0.6, 2.2);
    car.add(headL, headR);

    // Taillights
    const tailL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tailL.position.set(-0.65, 0.65, -2.2);
    const tailR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
    tailR.position.set(0.65, 0.65, -2.2);
    car.add(tailL, tailR);

    // Wheels
    for (let x of [-0.9, 0.9]) {
      for (let z of [-1.3, 1.3]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 16), darkMat);
        wheel.rotateZ(Math.PI / 2);
        wheel.position.set(x, 0.32, z);
        wheel.castShadow = true;
        car.add(wheel);
      }
    }

    return car;
  }

  private createDeliveryVan(color: number): THREE.Group {
    const van = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });

    // Main Van Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.9, 5.4), bodyMat);
    body.position.set(0, 1.25, -0.2);
    body.castShadow = true;
    van.add(body);

    // Front Hood
    const hood = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.85, 1.4), bodyMat);
    hood.position.set(0, 0.75, 2.2);
    van.add(hood);

    // Wheels
    for (let x of [-0.95, 0.95]) {
      for (let z of [-1.8, 1.6]) {
        const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.25, 16), darkMat);
        wheel.rotateZ(Math.PI / 2);
        wheel.position.set(x, 0.38, z);
        wheel.castShadow = true;
        van.add(wheel);
      }
    }

    return van;
  }

  public update(dt: number, playerTruckPos: THREE.Vector3) {
    const safeDt = Math.min(dt, 0.1);

    this.cars.forEach((car) => {
      // Check distance to player truck
      const dx = playerTruckPos.x - car.mesh.position.x;
      const dz = playerTruckPos.z - car.mesh.position.z;

      // Simple collision avoidance / braking if player is directly ahead in same lane
      let shouldBrake = false;
      if (Math.abs(dx) < 2.5) {
        if (car.direction === 1 && dz > 0 && dz < 25) {
          shouldBrake = true;
        } else if (car.direction === -1 && dz < 0 && dz > -25) {
          shouldBrake = true;
        }
      }

      if (shouldBrake) {
        car.speed = Math.max(0, car.speed - 12.0 * safeDt);
      } else {
        car.speed += (car.targetSpeed - car.speed) * 2.0 * safeDt;
      }

      // Move car along Z axis
      car.mesh.position.z += car.direction * car.speed * safeDt;

      // Loop car around when it travels beyond highway limits
      if (car.mesh.position.z > 450) {
        car.mesh.position.z = -440;
      } else if (car.mesh.position.z < -450) {
        car.mesh.position.z = 440;
      }
    });
  }
}
