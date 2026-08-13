import * as THREE from 'three';

export interface WorldObjects {
  group: THREE.Group;
  streetlights: THREE.Light[];
  windmills: THREE.Group[];
  deliveryDropBay: THREE.Mesh;
  fuelStationTrigger: { x: number; z: number; radius: number };
  depotOriginCoords: { x: number; z: number };
  depotDestCoords: { x: number; z: number };
  roadWaypoints: THREE.Vector3[];
}

export class WorldBuilder {
  public static createEuropeanWorld(): WorldObjects {
    const worldGroup = new THREE.Group();
    worldGroup.name = 'EuropeanWorld';

    const streetlights: THREE.Light[] = [];
    const windmills: THREE.Group[] = [];

    // --- 1. TERRAIN & GROUND ---
    const terrainGeo = new THREE.PlaneGeometry(1200, 1200, 32, 32);
    terrainGeo.rotateX(-Math.PI / 2);

    // Subtle height variations for rolling hills outside roads
    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      // Keep main road corridors flat (near x=0 or central avenues)
      if (Math.abs(x) > 60 || Math.abs(z) > 400) {
        const hill = Math.sin(x * 0.015) * Math.cos(z * 0.015) * 12 + Math.sin(x * 0.03) * 6;
        posAttr.setY(i, Math.max(0, hill));
      }
    }
    terrainGeo.computeVertexNormals();

    const grassMat = new THREE.MeshStandardMaterial({
      color: 0x3b6e2d,
      roughness: 0.9,
      metalness: 0.05
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, grassMat);
    terrainMesh.receiveShadow = true;
    worldGroup.add(terrainMesh);

    // --- 2. ROAD NETWORK SYSTEM ---
    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x222629,
      roughness: 0.7,
      metalness: 0.1
    });

    const roadLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const roadYellowMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });

    // Main European North-South Highway (z: -450 to +450, 4 lanes, width 18m)
    const mainHwyGeo = new THREE.PlaneGeometry(18, 900);
    mainHwyGeo.rotateX(-Math.PI / 2);
    const mainHwy = new THREE.Mesh(mainHwyGeo, roadMat);
    mainHwy.position.set(0, 0.02, 0);
    mainHwy.receiveShadow = true;
    worldGroup.add(mainHwy);

    // Highway Road Markings (Solid White Borders, Dashed White Lanes, Yellow Median)
    for (let z = -440; z <= 440; z += 12) {
      // Dashed lane lines
      const dashL = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 6), roadLineMat);
      dashL.rotateX(-Math.PI / 2);
      dashL.position.set(-4.5, 0.03, z);
      const dashR = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 6), roadLineMat);
      dashR.rotateX(-Math.PI / 2);
      dashR.position.set(4.5, 0.03, z);
      worldGroup.add(dashL, dashR);
    }

    // Yellow Double Median Line
    const medianL = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 900), roadYellowMat);
    medianL.rotateX(-Math.PI / 2);
    medianL.position.set(-0.2, 0.03, 0);
    const medianR = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 900), roadYellowMat);
    medianR.rotateX(-Math.PI / 2);
    medianR.position.set(0.2, 0.03, 0);
    worldGroup.add(medianL, medianR);

    // Guardrails along highway
    for (let z = -430; z <= 430; z += 16) {
      const guardL = this.createGuardrailSegment();
      guardL.position.set(-9.4, 0, z);
      const guardR = this.createGuardrailSegment();
      guardR.position.set(9.4, 0, z);
      worldGroup.add(guardL, guardR);
    }

    // East-West Connecting Highway at z = 180 (leading to Destination Logistics Hub)
    const eastHwyGeo = new THREE.PlaneGeometry(350, 16);
    eastHwyGeo.rotateX(-Math.PI / 2);
    const eastHwy = new THREE.Mesh(eastHwyGeo, roadMat);
    eastHwy.position.set(175, 0.02, 180);
    worldGroup.add(eastHwy);

    // Highway Curve connecting Main Hwy to East Hwy
    const curveGeo = new THREE.RingGeometry(20, 36, 16, 1, 0, Math.PI / 2);
    curveGeo.rotateX(-Math.PI / 2);
    const curveRoad = new THREE.Mesh(curveGeo, roadMat);
    curveRoad.position.set(20, 0.02, 160);
    worldGroup.add(curveRoad);

    // --- 3. HIGHWAY STREETLIGHTS ---
    for (let z = -400; z <= 400; z += 60) {
      const lightPole = this.createStreetlight();
      lightPole.group.position.set(-10.2, 0, z);
      worldGroup.add(lightPole.group);
      streetlights.push(lightPole.light);

      const lightPoleR = this.createStreetlight(true);
      lightPoleR.group.position.set(10.2, 0, z + 30);
      worldGroup.add(lightPoleR.group);
      streetlights.push(lightPoleR.light);
    }

    // --- 4. HIGHWAY OVERHEAD GANTRY SIGNS ---
    const gantry1 = this.createOverheadGantry('A1 BERLIN / HAMBURG 80 km', 'E30 ROTTERDAM 210 km');
    gantry1.position.set(0, 0, -120);
    worldGroup.add(gantry1);

    const gantry2 = this.createOverheadGantry('EXIT 14: LOGISTICS HUB EAST', 'MUNICH / WIEN');
    gantry2.position.set(0, 0, 130);
    worldGroup.add(gantry2);

    // --- 5. DEPOT A - LOGISTICS PARK (ORIGIN) ---
    const depotACoords = { x: -35, z: -320 };
    const depotA = this.createLogisticsWarehouse('EURO-FREIGHT LOGISTICS HUB A', 0x2563eb);
    depotA.position.set(depotACoords.x, 0, depotACoords.z);
    worldGroup.add(depotA);

    // Road connecting Depot A to Main Highway
    const depotRoadGeo = new THREE.PlaneGeometry(70, 14);
    depotRoadGeo.rotateX(-Math.PI / 2);
    const depotRoad = new THREE.Mesh(depotRoadGeo, roadMat);
    depotRoad.position.set(-30, 0.02, -320);
    worldGroup.add(depotRoad);

    // --- 6. DEPOT B - DESTINATION DISTRIBUTION CENTER ---
    const depotBCoords = { x: 320, z: 180 };
    const depotB = this.createLogisticsWarehouse('ROTTERDAM CARGO DEPOT B', 0x059669);
    depotB.position.set(depotBCoords.x, 0, depotBCoords.z);
    worldGroup.add(depotB);

    // Destination Marked Delivery Parking Bay (Glowing yellow box)
    const bayGeo = new THREE.PlaneGeometry(4.2, 16.0);
    bayGeo.rotateX(-Math.PI / 2);
    const bayMat = new THREE.MeshBasicMaterial({
      color: 0xeab308,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide
    });
    const deliveryDropBay = new THREE.Mesh(bayGeo, bayMat);
    deliveryDropBay.position.set(depotBCoords.x - 20, 0.05, depotBCoords.z + 10);
    worldGroup.add(deliveryDropBay);

    // Add pulsing delivery beacon light
    const bayBeacon = new THREE.PointLight(0xeab308, 2.5, 25);
    bayBeacon.position.set(depotBCoords.x - 20, 3, depotBCoords.z + 10);
    worldGroup.add(bayBeacon);

    // --- 7. HIGHWAY GAS STATION / REST AREA ---
    const gasStationCoords = { x: -35, z: 0 };
    const gasStation = this.createGasStation();
    gasStation.position.set(gasStationCoords.x, 0, gasStationCoords.z);
    worldGroup.add(gasStation);

    // --- 8. WIND TURBINES (EUROPEAN WINDMILLS) ---
    const turbineCoords = [
      { x: -160, z: -250, h: 30 },
      { x: -220, z: -100, h: 35 },
      { x: 180, z: -280, h: 32 },
      { x: 260, z: -80, h: 38 },
      { x: -180, z: 220, h: 34 },
      { x: 220, z: 380, h: 36 }
    ];

    turbineCoords.forEach((coord) => {
      const turbine = this.createWindTurbine(coord.h);
      turbine.position.set(coord.x, 0, coord.z);
      worldGroup.add(turbine);
      windmills.push(turbine);
    });

    // --- 9. EUROPEAN VEGETATION (TREES & FORESTS) ---
    this.populateVegetation(worldGroup);

    // --- 10. WAYPOINTS FOR GPS & TRAFFIC ---
    const roadWaypoints: THREE.Vector3[] = [
      new THREE.Vector3(depotACoords.x, 0, depotACoords.z),
      new THREE.Vector3(-4.5, 0, -320),
      new THREE.Vector3(-4.5, 0, -100),
      new THREE.Vector3(-4.5, 0, 100),
      new THREE.Vector3(20, 0, 175),
      new THREE.Vector3(120, 0, 180),
      new THREE.Vector3(240, 0, 180),
      new THREE.Vector3(depotBCoords.x - 20, 0, depotBCoords.z + 10)
    ];

    return {
      group: worldGroup,
      streetlights,
      windmills,
      deliveryDropBay,
      fuelStationTrigger: { x: gasStationCoords.x, z: gasStationCoords.z, radius: 18 },
      depotOriginCoords: depotACoords,
      depotDestCoords: depotBCoords,
      roadWaypoints
    };
  }

  private static createStreetlight(isRight: boolean = false) {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x71717a, metalness: 0.8, roughness: 0.3 });

    // Vertical pole
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 9, 12);
    const pole = new THREE.Mesh(poleGeo, metalMat);
    pole.position.y = 4.5;
    group.add(pole);

    // Curved arm extending over highway
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
    armGeo.rotateZ(isRight ? Math.PI / 4 : -Math.PI / 4);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(isRight ? -1.2 : 1.2, 8.5, 0);
    group.add(arm);

    // Lamp head
    const headGeo = new THREE.BoxGeometry(0.4, 0.15, 0.8);
    const head = new THREE.Mesh(headGeo, metalMat);
    head.position.set(isRight ? -2.4 : 2.4, 9.2, 0);
    group.add(head);

    // Street light source
    const light = new THREE.SpotLight(0xfff1cf, 0, 45, Math.PI / 3, 0.5, 1.2);
    light.position.set(isRight ? -2.4 : 2.4, 9.0, 0);
    const target = new THREE.Object3D();
    target.position.set(isRight ? -3.5 : 3.5, 0, 0);
    group.add(target);
    light.target = target;
    group.add(light);

    return { group, light };
  }

  private static createOverheadGantry(textLeft: string, textRight: string): THREE.Group {
    const group = new THREE.Group();
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });

    // Left & Right Support Truss Pillars
    const pillarL = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 12), steelMat);
    pillarL.position.set(-10, 4, 0);
    const pillarR = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 8, 12), steelMat);
    pillarR.position.set(10, 4, 0);

    // Cross Beam
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(20.5, 0.6, 0.6), steelMat);
    crossBeam.position.set(0, 7.8, 0);

    // European Green Signboard (e.g. Autobahn green/blue)
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 1024;
    signCanvas.height = 256;
    const ctx = signCanvas.getContext('2d')!;
    ctx.fillStyle = '#047857'; // European Highway Green
    ctx.fillRect(0, 0, 1024, 256);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeRect(10, 10, 1004, 236);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('⬆ ' + textLeft, 35, 95);
    ctx.fillText('⬈ ' + textRight, 35, 185);

    const signTexture = new THREE.CanvasTexture(signCanvas);
    const signMat = new THREE.MeshBasicMaterial({ map: signTexture });
    const signBoard = new THREE.Mesh(new THREE.PlaneGeometry(16, 4), signMat);
    signBoard.position.set(0, 6.2, 0);

    group.add(pillarL, pillarR, crossBeam, signBoard);
    return group;
  }

  private static createGuardrailSegment(): THREE.Group {
    const group = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.4 });

    // W-beam horizontal rail
    const beamGeo = new THREE.BoxGeometry(0.1, 0.35, 16);
    const beam = new THREE.Mesh(beamGeo, railMat);
    beam.position.set(0, 0.65, 0);

    // Posts
    for (let z = -7; z <= 7; z += 3.5) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.8, 0.12), railMat);
      post.position.set(0, 0.4, z);
      group.add(post);
    }

    group.add(beam);
    return group;
  }

  private static createLogisticsWarehouse(_title: string, brandColor: number): THREE.Group {
    const depot = new THREE.Group();

    // Main Warehouse Building
    const buildingMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.5 });
    const accentMat = new THREE.MeshStandardMaterial({ color: brandColor, roughness: 0.4 });
    const building = new THREE.Mesh(new THREE.BoxGeometry(60, 14, 40), buildingMat);
    building.position.set(0, 7, -25);
    building.castShadow = true;
    depot.add(building);

    // Colored Accent Stripe & Sign
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(60.2, 2.5, 40.2), accentMat);
    stripe.position.set(0, 12, -25);
    depot.add(stripe);

    // Loading Dock Bays (numbered 1 to 5)
    for (let i = -2; i <= 2; i++) {
      const dockFrame = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.5, 0.4), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      dockFrame.position.set(i * 9, 2.25, -4.8);
      depot.add(dockFrame);

      const dockDoor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.0, 0.2), new THREE.MeshStandardMaterial({ color: 0x475569 }));
      dockDoor.position.set(i * 9, 2.0, -4.7);
      depot.add(dockDoor);
    }

    // Asphalt Parking & Yard Area
    const yardMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(80, 70), yardMat);
    yard.rotateX(-Math.PI / 2);
    yard.position.set(0, 0.02, 10);
    yard.receiveShadow = true;
    depot.add(yard);

    // Stacks of Shipping Containers in Yard
    const containerColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b];
    for (let i = 0; i < 4; i++) {
      const cMat = new THREE.MeshStandardMaterial({ color: containerColors[i], roughness: 0.5 });
      const container1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.6, 6.0), cMat);
      container1.position.set(28, 1.3 + (i % 2) * 2.6, -10 + Math.floor(i / 2) * 7);
      container1.castShadow = true;
      depot.add(container1);
    }

    // Floodlight tower
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 18, 12), new THREE.MeshStandardMaterial({ color: 0x64748b }));
    tower.position.set(-32, 9, 25);
    depot.add(tower);

    return depot;
  }

  private static createGasStation(): THREE.Group {
    const station = new THREE.Group();
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });

    // Canopy Roof
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(18, 1.2, 14), canopyMat);
    canopy.position.set(0, 6.5, 0);
    canopy.castShadow = true;
    station.add(canopy);

    // Canopy Branding Stripe (Shell / BP / Total style)
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(18.2, 0.5, 14.2), pillarMat);
    stripe.position.set(0, 6.5, 0);
    station.add(stripe);

    // 4 Support Pillars
    const pillarOffsets = [
      { x: -6, z: -4 }, { x: 6, z: -4 },
      { x: -6, z: 4 }, { x: 6, z: 4 }
    ];
    pillarOffsets.forEach(pos => {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 12), pillarMat);
      pillar.position.set(pos.x, 3, pos.z);
      pillar.castShadow = true;
      station.add(pillar);
    });

    // Fuel Pumps Islands
    for (let z = -2.5; z <= 2.5; z += 5.0) {
      const island = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 1.8), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      island.position.set(0, 0.12, z);
      station.add(island);

      // Fuel Dispenser Units
      for (let x = -3; x <= 3; x += 6) {
        const pump = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x16a34a }));
        pump.position.set(x, 1.0, z);
        pump.castShadow = true;
        station.add(pump);
      }
    }

    // Price Totem Pole
    const totem = new THREE.Mesh(new THREE.BoxGeometry(1.5, 7, 0.5), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    totem.position.set(12, 3.5, 10);
    station.add(totem);

    return station;
  }

  private static createWindTurbine(height: number): THREE.Group {
    const turbine = new THREE.Group();
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

    // Tower
    const towerGeo = new THREE.CylinderGeometry(0.6, 1.6, height, 16);
    const tower = new THREE.Mesh(towerGeo, whiteMat);
    tower.position.y = height / 2;
    tower.castShadow = true;
    turbine.add(tower);

    // Nacelle (Generator Housing)
    const nacelleGeo = new THREE.BoxGeometry(2.0, 1.8, 4.5);
    const nacelle = new THREE.Mesh(nacelleGeo, whiteMat);
    nacelle.position.set(0, height, 0);
    turbine.add(nacelle);

    // Rotor Hub & 3 Aerodynamic Blades
    const rotorGroup = new THREE.Group();
    rotorGroup.position.set(0, height, 2.4);

    const hub = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), whiteMat);
    rotorGroup.add(hub);

    for (let i = 0; i < 3; i++) {
      const angle = (i * 2 * Math.PI) / 3;
      const bladeGeo = new THREE.BoxGeometry(0.4, 18, 0.15);
      bladeGeo.translate(0, 9, 0);
      const blade = new THREE.Mesh(bladeGeo, whiteMat);
      blade.rotation.z = angle;
      blade.castShadow = true;
      rotorGroup.add(blade);
    }

    turbine.add(rotorGroup);
    (turbine as unknown as { rotorGroup: THREE.Group }).rotorGroup = rotorGroup;
    return turbine;
  }

  private static populateVegetation(worldGroup: THREE.Group) {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x45220a, roughness: 0.9 });
    const leavesMat1 = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.8 }); // Pine
    const leavesMat2 = new THREE.MeshStandardMaterial({ color: 0x2d6a2d, roughness: 0.8 }); // Deciduous

    // Create clusters of trees along highway and rolling hills
    for (let i = 0; i < 220; i++) {
      const x = (Math.random() - 0.5) * 800;
      const z = (Math.random() - 0.5) * 850;

      // Keep trees away from roads
      if (Math.abs(x) < 14 || (Math.abs(z - 180) < 14 && x > 0)) continue;

      const tree = new THREE.Group();
      const scale = 0.8 + Math.random() * 0.8;

      if (Math.random() > 0.5) {
        // Pine tree (European coniferous)
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 3 * scale, 8), trunkMat);
        trunk.position.y = 1.5 * scale;
        tree.add(trunk);

        for (let j = 0; j < 3; j++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry((2.2 - j * 0.4) * scale, (3.2 - j * 0.4) * scale, 8), leavesMat1);
          cone.position.y = (3.2 + j * 1.8) * scale;
          cone.castShadow = true;
          tree.add(cone);
        }
      } else {
        // Deciduous tree
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3.5 * scale, 8), trunkMat);
        trunk.position.y = 1.75 * scale;
        tree.add(trunk);

        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.5 * scale, 1), leavesMat2);
        crown.position.y = 4.8 * scale;
        crown.castShadow = true;
        tree.add(crown);
      }

      tree.position.set(x, 0, z);
      worldGroup.add(tree);
    }
  }
}
