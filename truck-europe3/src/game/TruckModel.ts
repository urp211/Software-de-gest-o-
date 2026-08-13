import * as THREE from 'three';

export interface TruckMeshGroup extends THREE.Group {
  steeringWheel?: THREE.Group;
  wiperLeft?: THREE.Group;
  wiperRight?: THREE.Group;
  frontWheelLeft?: THREE.Group;
  frontWheelRight?: THREE.Group;
  rearWheels?: THREE.Group[];
  headlightLeft?: THREE.SpotLight;
  headlightRight?: THREE.SpotLight;
  headlightTargetL?: THREE.Object3D;
  headlightTargetR?: THREE.Object3D;
  brakeLightMaterials?: THREE.MeshStandardMaterial[];
  reverseLightMaterials?: THREE.MeshStandardMaterial[];
  leftIndicatorMaterials?: THREE.MeshStandardMaterial[];
  rightIndicatorMaterials?: THREE.MeshStandardMaterial[];
  headlightMaterials?: THREE.MeshStandardMaterial[];
  bodyMaterials?: THREE.MeshStandardMaterial[];
  gpsScreenMaterial?: THREE.MeshBasicMaterial;
  dashboardSpeedText?: HTMLCanvasElement;
  dashboardCanvasTexture?: THREE.CanvasTexture;
  hitchPoint?: THREE.Vector3;
}

export class TruckModelBuilder {
  public static createEuroTruck(
    color: string = '#d32f2f',
    metallic: number = 0.6,
    roughness: number = 0.35,
    chassisType: '4x2' | '6x2' | '6x4' = '4x2'
  ): TruckMeshGroup {
    const truck = new THREE.Group() as TruckMeshGroup;
    truck.name = 'EuroTruck';

    const bodyMaterials: THREE.MeshStandardMaterial[] = [];
    const brakeLightMaterials: THREE.MeshStandardMaterial[] = [];
    const reverseLightMaterials: THREE.MeshStandardMaterial[] = [];
    const leftIndicatorMaterials: THREE.MeshStandardMaterial[] = [];
    const rightIndicatorMaterials: THREE.MeshStandardMaterial[] = [];
    const headlightMaterials: THREE.MeshStandardMaterial[] = [];

    // Base materials
    const paintMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      metalness: metallic,
      roughness: roughness,
      envMapIntensity: 1.2
    });
    bodyMaterials.push(paintMaterial);

    const darkPlastic = new THREE.MeshStandardMaterial({
      color: 0x1f2428,
      roughness: 0.85,
      metalness: 0.1
    });

    const chrome = new THREE.MeshStandardMaterial({
      color: 0xeeeeee,
      metalness: 0.95,
      roughness: 0.1
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x334455,
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5
    });

    const rubberMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.95,
      metalness: 0.05
    });

    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.8,
      roughness: 0.25
    });

    // --- 1. CHASSIS FRAME ---
    const chassis = new THREE.Group();
    const frameGeo = new THREE.BoxGeometry(1.6, 0.35, 6.2);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x2a2d32, roughness: 0.8 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.set(0, 0.65, -0.6);
    frameMesh.castShadow = true;
    frameMesh.receiveShadow = true;
    chassis.add(frameMesh);

    // Fuel tanks (Left and Right)
    const tankGeo = new THREE.CylinderGeometry(0.38, 0.38, 2.2, 24);
    tankGeo.rotateZ(Math.PI / 2);
    const tankMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.85, roughness: 0.25 });
    
    const tankLeft = new THREE.Mesh(tankGeo, tankMat);
    tankLeft.position.set(-0.95, 0.65, -0.8);
    tankLeft.castShadow = true;
    chassis.add(tankLeft);

    const tankRight = new THREE.Mesh(tankGeo, tankMat);
    tankRight.position.set(0.95, 0.65, -0.8);
    tankRight.castShadow = true;
    chassis.add(tankRight);

    // Battery box / air tanks
    const batteryGeo = new THREE.BoxGeometry(0.5, 0.4, 0.9);
    const batteryMesh = new THREE.Mesh(batteryGeo, darkPlastic);
    batteryMesh.position.set(0.95, 0.65, 0.8);
    chassis.add(batteryMesh);

    // Fifth Wheel Coupling Plate (Hitch)
    const hitchBaseGeo = new THREE.CylinderGeometry(0.48, 0.52, 0.12, 20);
    const hitchMat = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.95, metalness: 0.5 });
    const hitchMesh = new THREE.Mesh(hitchBaseGeo, hitchMat);
    hitchMesh.position.set(0, 0.88, -2.1);
    hitchMesh.castShadow = true;
    chassis.add(hitchMesh);
    truck.hitchPoint = new THREE.Vector3(0, 0.88, -2.1);

    // Rear Bumper and Mudflaps
    const rearBumperGeo = new THREE.BoxGeometry(2.3, 0.25, 0.15);
    const rearBumper = new THREE.Mesh(rearBumperGeo, darkPlastic);
    rearBumper.position.set(0, 0.55, -3.65);
    rearBumper.castShadow = true;
    chassis.add(rearBumper);

    // Mudflaps with hazard stripes
    const flapGeo = new THREE.BoxGeometry(0.7, 0.5, 0.04);
    const flapMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const flapL = new THREE.Mesh(flapGeo, flapMat);
    flapL.position.set(-0.8, 0.45, -3.7);
    const flapR = new THREE.Mesh(flapGeo, flapMat);
    flapR.position.set(0.8, 0.45, -3.7);
    chassis.add(flapL, flapR);

    // Rear Taillights
    const rearLightGeo = new THREE.BoxGeometry(0.45, 0.14, 0.05);

    // Brake / Tail
    const brakeMatL = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0x440000, roughness: 0.3 });
    const brakeLightL = new THREE.Mesh(rearLightGeo, brakeMatL);
    brakeLightL.position.set(-0.8, 0.55, -3.73);
    chassis.add(brakeLightL);
    brakeLightMaterials.push(brakeMatL);

    const brakeMatR = new THREE.MeshStandardMaterial({ color: 0x550000, emissive: 0x440000, roughness: 0.3 });
    const brakeLightR = new THREE.Mesh(rearLightGeo, brakeMatR);
    brakeLightR.position.set(0.8, 0.55, -3.73);
    chassis.add(brakeLightR);
    brakeLightMaterials.push(brakeMatR);

    // Reverse light
    const revMat = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0x000000, roughness: 0.3 });
    const revLight = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.05), revMat);
    revLight.position.set(0.3, 0.55, -3.73);
    chassis.add(revLight);
    reverseLightMaterials.push(revMat);

    // Rear Indicators
    const rearIndMatL = new THREE.MeshStandardMaterial({ color: 0x442200, emissive: 0x000000, roughness: 0.3 });
    const rearIndL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), rearIndMatL);
    rearIndL.position.set(-1.05, 0.55, -3.73);
    chassis.add(rearIndL);
    leftIndicatorMaterials.push(rearIndMatL);

    const rearIndMatR = new THREE.MeshStandardMaterial({ color: 0x442200, emissive: 0x000000, roughness: 0.3 });
    const rearIndR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), rearIndMatR);
    rearIndR.position.set(1.05, 0.55, -3.73);
    chassis.add(rearIndR);
    rightIndicatorMaterials.push(rearIndMatR);

    truck.add(chassis);

    // --- 2. CABIN (European Cab-over style) ---
    const cabGroup = new THREE.Group();
    cabGroup.name = 'Cabin';

    // Main Cab Shell
    const cabMainGeo = new THREE.BoxGeometry(2.4, 2.3, 2.5);
    const cabMesh = new THREE.Mesh(cabMainGeo, paintMaterial);
    cabMesh.position.set(0, 2.05, 1.0);
    cabMesh.castShadow = true;
    cabMesh.receiveShadow = true;
    cabGroup.add(cabMesh);

    // Aerodynamic roof slope / spoiler
    const roofDeflectorGeo = new THREE.BoxGeometry(2.35, 0.45, 1.8);
    const roofDeflector = new THREE.Mesh(roofDeflectorGeo, paintMaterial);
    roofDeflector.position.set(0, 3.25, 0.8);
    roofDeflector.rotation.x = -0.12;
    roofDeflector.castShadow = true;
    cabGroup.add(roofDeflector);

    // Sun Visor above Windshield
    const visorGeo = new THREE.BoxGeometry(2.42, 0.22, 0.5);
    const visor = new THREE.Mesh(visorGeo, darkPlastic);
    visor.position.set(0, 3.05, 2.3);
    visor.rotation.x = 0.25;
    cabGroup.add(visor);

    // Roof Auxiliary Lights (Top Bar)
    const topBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.2, 12);
    topBarGeo.rotateZ(Math.PI / 2);
    const topBar = new THREE.Mesh(topBarGeo, chrome);
    topBar.position.set(0, 3.5, 1.6);
    cabGroup.add(topBar);

    for (let i = -3; i <= 3; i += 2) {
      const spotLightLampGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.14, 16);
      spotLightLampGeo.rotateX(Math.PI / 2);
      const spotLamp = new THREE.Mesh(spotLightLampGeo, chrome);
      spotLamp.position.set(i * 0.3, 3.55, 1.6);
      cabGroup.add(spotLamp);
    }

    // Dual Air Horns on Roof
    const hornL = this.createAirHornMesh(chrome);
    hornL.position.set(-0.7, 3.48, 1.1);
    const hornR = this.createAirHornMesh(chrome);
    hornR.position.set(0.7, 3.48, 1.1);
    cabGroup.add(hornL, hornR);

    // European V-Style Front Grille
    const grilleMesh = this.createFrontGrille(darkPlastic, chrome);
    grilleMesh.position.set(0, 1.55, 2.28);
    cabGroup.add(grilleMesh);

    // Lower Front Bumper
    const frontBumperGeo = new THREE.BoxGeometry(2.46, 0.6, 0.4);
    const frontBumper = new THREE.Mesh(frontBumperGeo, darkPlastic);
    frontBumper.position.set(0, 0.65, 2.25);
    frontBumper.castShadow = true;
    cabGroup.add(frontBumper);

    // Windshield (Front Glass)
    const windshieldGeo = new THREE.PlaneGeometry(2.2, 1.05);
    const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
    windshield.position.set(0, 2.45, 2.27);
    windshield.rotation.x = -0.15;
    cabGroup.add(windshield);

    // Side Windows
    const sideWinGeo = new THREE.PlaneGeometry(1.2, 0.75);
    const sideWinL = new THREE.Mesh(sideWinGeo, glassMaterial);
    sideWinL.position.set(-1.21, 2.4, 1.3);
    sideWinL.rotation.y = -Math.PI / 2;
    const sideWinR = new THREE.Mesh(sideWinGeo, glassMaterial);
    sideWinR.position.set(1.21, 2.4, 1.3);
    sideWinR.rotation.y = Math.PI / 2;
    cabGroup.add(sideWinL, sideWinR);

    // Side Mirrors
    const mirrorL = this.createSideMirrorMesh(paintMaterial, darkPlastic, chrome, true);
    mirrorL.position.set(-1.38, 2.45, 1.95);
    const mirrorR = this.createSideMirrorMesh(paintMaterial, darkPlastic, chrome, false);
    mirrorR.position.set(1.38, 2.45, 1.95);
    cabGroup.add(mirrorL, mirrorR);

    // Windshield Wipers
    const wiperLeft = this.createWiperGroup();
    wiperLeft.position.set(-0.55, 1.96, 2.3);
    cabGroup.add(wiperLeft);
    truck.wiperLeft = wiperLeft;

    const wiperRight = this.createWiperGroup();
    wiperRight.position.set(0.35, 1.96, 2.3);
    cabGroup.add(wiperRight);
    truck.wiperRight = wiperRight;

    // Headlights (LED clusters)
    const headlightGeo = new THREE.BoxGeometry(0.42, 0.22, 0.1);
    const headMatL = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222222, roughness: 0.1 });
    const headLightMeshL = new THREE.Mesh(headlightGeo, headMatL);
    headLightMeshL.position.set(-0.9, 0.8, 2.45);
    cabGroup.add(headLightMeshL);
    headlightMaterials.push(headMatL);

    const headMatR = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x222222, roughness: 0.1 });
    const headLightMeshR = new THREE.Mesh(headlightGeo, headMatR);
    headLightMeshR.position.set(0.9, 0.8, 2.45);
    cabGroup.add(headLightMeshR);
    headlightMaterials.push(headMatR);

    // Front Indicators
    const frontIndGeo = new THREE.BoxGeometry(0.18, 0.12, 0.1);
    const frontIndMatL = new THREE.MeshStandardMaterial({ color: 0x442200, emissive: 0x000000, roughness: 0.2 });
    const frontIndL = new THREE.Mesh(frontIndGeo, frontIndMatL);
    frontIndL.position.set(-1.15, 0.8, 2.42);
    cabGroup.add(frontIndL);
    leftIndicatorMaterials.push(frontIndMatL);

    const frontIndMatR = new THREE.MeshStandardMaterial({ color: 0x442200, emissive: 0x000000, roughness: 0.2 });
    const frontIndR = new THREE.Mesh(frontIndGeo, frontIndMatR);
    frontIndR.position.set(1.15, 0.8, 2.42);
    cabGroup.add(frontIndR);
    rightIndicatorMaterials.push(frontIndMatR);

    // SpotLights for 3D night driving beams
    const spotL = new THREE.SpotLight(0xfff4e0, 0, 90, Math.PI / 6, 0.35, 1.2);
    spotL.position.set(-0.85, 0.85, 2.4);
    spotL.castShadow = true;
    spotL.shadow.mapSize.width = 1024;
    spotL.shadow.mapSize.height = 1024;
    spotL.shadow.camera.near = 0.5;
    spotL.shadow.camera.far = 80;

    const targetL = new THREE.Object3D();
    targetL.position.set(-0.85, 0.0, 35.0);
    cabGroup.add(targetL);
    spotL.target = targetL;
    cabGroup.add(spotL);
    truck.headlightLeft = spotL;
    truck.headlightTargetL = targetL;

    const spotR = new THREE.SpotLight(0xfff4e0, 0, 90, Math.PI / 6, 0.35, 1.2);
    spotR.position.set(0.85, 0.85, 2.4);
    spotR.castShadow = true;
    spotR.shadow.mapSize.width = 1024;
    spotR.shadow.mapSize.height = 1024;
    spotR.shadow.camera.near = 0.5;
    spotR.shadow.camera.far = 80;

    const targetR = new THREE.Object3D();
    targetR.position.set(0.85, 0.0, 35.0);
    cabGroup.add(targetR);
    spotR.target = targetR;
    cabGroup.add(spotR);
    truck.headlightRight = spotR;
    truck.headlightTargetR = targetR;

    // --- 3. DETAILED CABIN INTERIOR ---
    const interior = this.createCabinInterior(darkPlastic, chrome);
    interior.group.position.set(0, 1.45, 0.7);
    cabGroup.add(interior.group);
    truck.steeringWheel = interior.steeringWheel;
    truck.gpsScreenMaterial = interior.gpsMaterial;
    truck.dashboardCanvasTexture = interior.dashTexture;

    truck.add(cabGroup);

    // --- 4. WHEELS ---
    const wheels = this.createTruckWheels(chassisType, rubberMaterial, rimMaterial);
    truck.frontWheelLeft = wheels.frontL;
    truck.frontWheelRight = wheels.frontR;
    truck.rearWheels = wheels.rearWheels;
    truck.add(wheels.group);

    truck.brakeLightMaterials = brakeLightMaterials;
    truck.reverseLightMaterials = reverseLightMaterials;
    truck.leftIndicatorMaterials = leftIndicatorMaterials;
    truck.rightIndicatorMaterials = rightIndicatorMaterials;
    truck.headlightMaterials = headlightMaterials;
    truck.bodyMaterials = bodyMaterials;

    return truck;
  }

  private static createAirHornMesh(chromeMat: THREE.Material): THREE.Group {
    const hornGroup = new THREE.Group();
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.09, 0.8, 12);
    tubeGeo.rotateX(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeo, chromeMat);
    tube.position.set(0, 0, 0);

    const bellGeo = new THREE.CylinderGeometry(0.09, 0.16, 0.25, 16);
    bellGeo.rotateX(Math.PI / 2);
    const bell = new THREE.Mesh(bellGeo, chromeMat);
    bell.position.set(0, 0, 0.45);

    hornGroup.add(tube, bell);
    return hornGroup;
  }

  private static createFrontGrille(plasticMat: THREE.Material, chromeMat: THREE.Material): THREE.Group {
    const group = new THREE.Group();
    const bgGeo = new THREE.BoxGeometry(1.8, 1.3, 0.08);
    const bg = new THREE.Mesh(bgGeo, plasticMat);
    group.add(bg);

    // Chrome horizontal slats
    for (let i = -3; i <= 3; i++) {
      const slatGeo = new THREE.BoxGeometry(1.7, 0.05, 0.12);
      const slat = new THREE.Mesh(slatGeo, chromeMat);
      slat.position.set(0, i * 0.16, 0.02);
      group.add(slat);
    }

    // Euro Truck emblem in center
    const emblemGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 24);
    emblemGeo.rotateX(Math.PI / 2);
    const emblem = new THREE.Mesh(emblemGeo, chromeMat);
    emblem.position.set(0, 0.1, 0.06);
    group.add(emblem);

    return group;
  }

  private static createSideMirrorMesh(bodyMat: THREE.Material, plasticMat: THREE.Material, mirrorMat: THREE.Material, isLeft: boolean): THREE.Group {
    const group = new THREE.Group();

    // Mirror Arm Mount
    const armGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.35, 8);
    armGeo.rotateZ(isLeft ? -Math.PI / 4 : Math.PI / 4);
    const arm = new THREE.Mesh(armGeo, plasticMat);
    arm.position.set(isLeft ? 0.1 : -0.1, 0, 0);
    group.add(arm);

    // Mirror Housing
    const houseGeo = new THREE.BoxGeometry(0.16, 0.65, 0.22);
    const house = new THREE.Mesh(houseGeo, bodyMat);
    house.position.set(isLeft ? -0.12 : 0.12, 0, 0);
    group.add(house);

    // Glass Face
    const glassGeo = new THREE.PlaneGeometry(0.14, 0.6);
    const glass = new THREE.Mesh(glassGeo, mirrorMat);
    glass.position.set(isLeft ? -0.12 : 0.12, 0, -0.115);
    glass.rotation.y = Math.PI;
    group.add(glass);

    return group;
  }

  private static createWiperGroup(): THREE.Group {
    const group = new THREE.Group();
    const armGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.55, 6);
    armGeo.translate(0, 0.275, 0);
    const bladeGeo = new THREE.BoxGeometry(0.02, 0.5, 0.02);
    bladeGeo.translate(0, 0.3, 0.01);

    const mat = new THREE.MeshBasicMaterial({ color: 0x111111 });
    const arm = new THREE.Mesh(armGeo, mat);
    const blade = new THREE.Mesh(bladeGeo, mat);

    group.add(arm, blade);
    group.rotation.z = -0.3;
    group.rotation.x = -0.15;
    return group;
  }

  private static createCabinInterior(darkMat: THREE.Material, chromeMat: THREE.Material) {
    const group = new THREE.Group();

    // Dashboard console curved around driver
    const dashGeo = new THREE.BoxGeometry(2.1, 0.45, 0.7);
    const dashMesh = new THREE.Mesh(dashGeo, darkMat);
    dashMesh.position.set(0, 0.6, 1.05);
    group.add(dashMesh);

    // Instrument Cluster Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 256);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, 492, 236);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('0 KM/H', 50, 120);
    ctx.font = '24px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('RPM: 800  [D1]', 50, 180);

    const dashTexture = new THREE.CanvasTexture(canvas);
    const clusterGeo = new THREE.PlaneGeometry(0.45, 0.22);
    const clusterMat = new THREE.MeshBasicMaterial({ map: dashTexture });
    const clusterMesh = new THREE.Mesh(clusterGeo, clusterMat);
    clusterMesh.position.set(-0.55, 0.8, 0.88);
    clusterMesh.rotation.x = -0.4;
    group.add(clusterMesh);

    // Center GPS Display
    const gpsCanvas = document.createElement('canvas');
    gpsCanvas.width = 256;
    gpsCanvas.height = 256;
    const gctx = gpsCanvas.getContext('2d')!;
    gctx.fillStyle = '#1e293b';
    gctx.fillRect(0, 0, 256, 256);
    gctx.strokeStyle = '#0284c7';
    gctx.lineWidth = 6;
    gctx.beginPath();
    gctx.moveTo(128, 230);
    gctx.lineTo(128, 100);
    gctx.lineTo(190, 40);
    gctx.stroke();
    gctx.fillStyle = '#e2e8f0';
    gctx.font = 'bold 22px sans-serif';
    gctx.fillText('GPS NAV', 20, 40);
    gctx.fillStyle = '#38bdf8';
    gctx.fillText('ROUTE: DEPOT B', 20, 70);

    const gpsTexture = new THREE.CanvasTexture(gpsCanvas);
    const gpsMat = new THREE.MeshBasicMaterial({ map: gpsTexture });
    const gpsMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.32), gpsMat);
    gpsMesh.position.set(0.05, 0.75, 0.9);
    gpsMesh.rotation.x = -0.3;
    gpsMesh.rotation.y = -0.2;
    group.add(gpsMesh);

    // Steering Column & Steering Wheel
    const columnGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.45, 12);
    columnGeo.rotateX(Math.PI / 4);
    const column = new THREE.Mesh(columnGeo, darkMat);
    column.position.set(-0.55, 0.62, 0.65);
    group.add(column);

    const steeringWheel = new THREE.Group();
    steeringWheel.position.set(-0.55, 0.78, 0.5);
    steeringWheel.rotation.x = -0.65;

    // Rim
    const rimTorus = new THREE.TorusGeometry(0.24, 0.028, 12, 32);
    const wheelRim = new THREE.Mesh(rimTorus, darkMat);
    steeringWheel.add(wheelRim);

    // Spokes
    const spokeGeo = new THREE.BoxGeometry(0.42, 0.04, 0.03);
    const spokeH = new THREE.Mesh(spokeGeo, darkMat);
    const spokeVGeo = new THREE.BoxGeometry(0.04, 0.22, 0.03);
    const spokeV = new THREE.Mesh(spokeVGeo, darkMat);
    spokeV.position.set(0, -0.1, 0);

    const hubGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.04, 16);
    hubGeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, chromeMat);

    steeringWheel.add(spokeH, spokeV, hub);
    group.add(steeringWheel);

    // Driver Seat (Left side for European LHD standard)
    const driverSeat = this.createSeatMesh(darkMat);
    driverSeat.position.set(-0.55, 0.2, -0.1);
    group.add(driverSeat);

    // Passenger Seat
    const passengerSeat = this.createSeatMesh(darkMat);
    passengerSeat.position.set(0.55, 0.2, -0.1);
    group.add(passengerSeat);

    // Sleeper bunk behind seats
    const bunkGeo = new THREE.BoxGeometry(2.1, 0.45, 0.85);
    const bunkMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.9 });
    const bunk = new THREE.Mesh(bunkGeo, bunkMat);
    bunk.position.set(0, 0.4, -0.75);
    group.add(bunk);

    return {
      group,
      steeringWheel,
      gpsMaterial: gpsMat,
      dashTexture
    };
  }

  private static createSeatMesh(material: THREE.Material): THREE.Group {
    const seat = new THREE.Group();
    // Cushion
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.2, 0.58), material);
    base.position.set(0, 0.25, 0);
    // Backrest
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.75, 0.16), material);
    back.position.set(0, 0.65, -0.22);
    back.rotation.x = -0.1;
    // Headrest
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.12), material);
    head.position.set(0, 1.08, -0.26);

    seat.add(base, back, head);
    return seat;
  }

  private static createTruckWheels(chassisType: string, rubberMat: THREE.Material, rimMat: THREE.Material) {
    const group = new THREE.Group();

    // Front Left & Right (Steerable)
    const frontL = this.createWheelAssembly(rubberMat, rimMat, true);
    frontL.position.set(-1.08, 0.5, 1.4);
    const frontR = this.createWheelAssembly(rubberMat, rimMat, false);
    frontR.position.set(1.08, 0.5, 1.4);

    group.add(frontL, frontR);

    // Rear Dual Wheels (Drive Axles)
    const rearWheels: THREE.Group[] = [];

    // Axle 1
    const rear1L = this.createDualWheelAssembly(rubberMat, rimMat, true);
    rear1L.position.set(-1.02, 0.5, -2.1);
    const rear1R = this.createDualWheelAssembly(rubberMat, rimMat, false);
    rear1R.position.set(1.02, 0.5, -2.1);
    group.add(rear1L, rear1R);
    rearWheels.push(rear1L, rear1R);

    if (chassisType === '6x2' || chassisType === '6x4') {
      const rear2L = this.createDualWheelAssembly(rubberMat, rimMat, true);
      rear2L.position.set(-1.02, 0.5, -3.4);
      const rear2R = this.createDualWheelAssembly(rubberMat, rimMat, false);
      rear2R.position.set(1.02, 0.5, -3.4);
      group.add(rear2L, rear2R);
      rearWheels.push(rear2L, rear2R);
    }

    return {
      group,
      frontL,
      frontR,
      rearWheels
    };
  }

  public static createWheelAssembly(rubberMat: THREE.Material, rimMat: THREE.Material, _isLeft: boolean = true): THREE.Group {
    const wheel = new THREE.Group();
    // Tire
    const tireGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.32, 24);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, rubberMat);
    tire.castShadow = true;
    wheel.add(tire);

    // Rim
    const rimGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.34, 18);
    rimGeo.rotateZ(Math.PI / 2);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheel.add(rim);

    // Hubcap center
    const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.38, 12);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, rimMat);
    wheel.add(hub);

    return wheel;
  }

  private static createDualWheelAssembly(rubberMat: THREE.Material, rimMat: THREE.Material, isLeft: boolean): THREE.Group {
    const group = new THREE.Group();
    const wheel1 = this.createWheelAssembly(rubberMat, rimMat, isLeft);
    wheel1.position.x = isLeft ? -0.16 : 0.16;
    const wheel2 = this.createWheelAssembly(rubberMat, rimMat, isLeft);
    wheel2.position.x = isLeft ? 0.16 : -0.16;
    group.add(wheel1, wheel2);
    return group;
  }
}
