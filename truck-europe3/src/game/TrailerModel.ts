import * as THREE from 'three';
import { TruckModelBuilder } from './TruckModel';

export interface TrailerMeshGroup extends THREE.Group {
  trailerType?: string;
  kingpinOffset?: THREE.Vector3;
  wheels?: THREE.Group[];
  landingGear?: THREE.Group;
  brakeLightMaterials?: THREE.MeshStandardMaterial[];
  leftIndicatorMaterials?: THREE.MeshStandardMaterial[];
  rightIndicatorMaterials?: THREE.MeshStandardMaterial[];
  markerLights?: THREE.MeshBasicMaterial[];
}

export class TrailerModelBuilder {
  public static createTrailer(type: 'curtain' | 'container' | 'tanker' | 'refrigerated' = 'curtain'): TrailerMeshGroup {
    const trailer = new THREE.Group() as TrailerMeshGroup;
    trailer.name = `Trailer_${type}`;
    trailer.trailerType = type;

    const brakeLightMaterials: THREE.MeshStandardMaterial[] = [];
    const leftIndicatorMaterials: THREE.MeshStandardMaterial[] = [];
    const rightIndicatorMaterials: THREE.MeshStandardMaterial[] = [];
    const markerLights: THREE.MeshBasicMaterial[] = [];
    const wheels: THREE.Group[] = [];

    const steelDark = new THREE.MeshStandardMaterial({ color: 0x22262a, roughness: 0.8 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x1e1e1e, roughness: 0.95 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xc8c8c8, metalness: 0.7, roughness: 0.3 });

    // --- 1. CHASSIS FRAME ---
    // Trailer length: 13.6m European semi-trailer standard (represented around 12 units)
    const frameGeo = new THREE.BoxGeometry(2.35, 0.35, 11.5);
    const frame = new THREE.Mesh(frameGeo, steelDark);
    frame.position.set(0, 0.8, -4.5);
    frame.castShadow = true;
    frame.receiveShadow = true;
    trailer.add(frame);

    // Kingpin Hitch Point (connects with truck at z = 0 relative to trailer origin)
    trailer.kingpinOffset = new THREE.Vector3(0, 0.88, 0.5);

    // --- 2. RETRACTABLE LANDING GEAR (LEGS) ---
    const landingGear = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 12);
    const footGeo = new THREE.BoxGeometry(0.3, 0.06, 0.3);

    const legL = new THREE.Mesh(legGeo, steelDark);
    legL.position.set(-0.85, 0.45, -1.2);
    const footL = new THREE.Mesh(footGeo, steelDark);
    footL.position.set(-0.85, 0.03, -1.2);

    const legR = new THREE.Mesh(legGeo, steelDark);
    legR.position.set(0.85, 0.45, -1.2);
    const footR = new THREE.Mesh(footGeo, steelDark);
    footR.position.set(0.85, 0.03, -1.2);

    landingGear.add(legL, footL, legR, footR);
    trailer.add(landingGear);
    trailer.landingGear = landingGear;

    // --- 3. CARGO BODY ACCORDING TO TYPE ---
    if (type === 'curtain') {
      // European Curtainside / Tarp trailer (e.g. Schmitz Cargobull / Krone style)
      const curtainMat = new THREE.MeshStandardMaterial({
        color: 0x1d4ed8, // Blue tarp
        roughness: 0.7,
        metalness: 0.05
      });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0xdedede, roughness: 0.9 });
      const rearDoorMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.4, metalness: 0.5 });

      // Main box tarp
      const bodyGeo = new THREE.BoxGeometry(2.45, 2.7, 11.2);
      const body = new THREE.Mesh(bodyGeo, curtainMat);
      body.position.set(0, 2.35, -4.5);
      body.castShadow = true;
      body.receiveShadow = true;
      trailer.add(body);

      // White roof
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.46, 0.1, 11.25), roofMat);
      roof.position.set(0, 3.72, -4.5);
      trailer.add(roof);

      // Rear double doors with latches
      const rearDoor = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.65, 0.1), rearDoorMat);
      rearDoor.position.set(0, 2.35, -10.12);
      trailer.add(rearDoor);
    } else if (type === 'container') {
      // 40ft Shipping Container on skeletal chassis (Maersk / Evergreen style)
      const containerMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Cyan blue container
        roughness: 0.6,
        metalness: 0.2
      });
      const container = new THREE.Mesh(new THREE.BoxGeometry(2.44, 2.6, 11.0), containerMat);
      container.position.set(0, 2.3, -4.5);
      container.castShadow = true;
      trailer.add(container);

      // Corrugation ribs
      for (let z = -9.5; z <= 0.5; z += 0.6) {
        const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.5, 0.2), containerMat);
        ribL.position.set(-1.24, 2.3, z);
        const ribR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.5, 0.2), containerMat);
        ribR.position.set(1.24, 2.3, z);
        trailer.add(ribL, ribR);
      }
    } else if (type === 'tanker') {
      // Chrome / Stainless Steel Fuel / Chemical Tanker
      const tankerMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f5,
        metalness: 0.9,
        roughness: 0.15
      });
      const tankGeo = new THREE.CylinderGeometry(1.25, 1.25, 10.8, 28);
      tankGeo.rotateX(Math.PI / 2);
      const tank = new THREE.Mesh(tankGeo, tankerMat);
      tank.position.set(0, 2.2, -4.5);
      tank.castShadow = true;
      trailer.add(tank);

      // Top catwalk and manholes
      const catwalk = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 9.5), steelDark);
      catwalk.position.set(0, 3.48, -4.5);
      trailer.add(catwalk);

      for (let z = -8.0; z <= -1.0; z += 2.2) {
        const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 16), steelDark);
        manhole.position.set(0, 3.52, z);
        trailer.add(manhole);
      }
    } else {
      // Refrigerated Box (Thermo King cooling unit at front)
      const fridgeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
      const fridgeBody = new THREE.Mesh(new THREE.BoxGeometry(2.48, 2.75, 11.2), fridgeMat);
      fridgeBody.position.set(0, 2.38, -4.5);
      fridgeBody.castShadow = true;
      trailer.add(fridgeBody);

      // Thermo King refrigeration unit on front bulkhead
      const coolingUnit = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 0.45), steelDark);
      coolingUnit.position.set(0, 2.8, 1.15);
      trailer.add(coolingUnit);
    }

    // --- 4. TRI-AXLE REAR ASSEMBLY (3 Axles with wheels) ---
    // Euro trailer tri-axle placement around z = -7.5 to -9.5
    const axleZOffsets = [-7.3, -8.6, -9.9];
    axleZOffsets.forEach((zOffset) => {
      const wheelL = TruckModelBuilder.createWheelAssembly(rubberMat, rimMat, true);
      wheelL.position.set(-1.08, 0.5, zOffset);
      const wheelR = TruckModelBuilder.createWheelAssembly(rubberMat, rimMat, false);
      wheelR.position.set(1.08, 0.5, zOffset);
      trailer.add(wheelL, wheelR);
      wheels.push(wheelL, wheelR);
    });

    // --- 5. REAR CRASH BUMPER & LIGHTS ---
    const rearBumperGeo = new THREE.BoxGeometry(2.4, 0.28, 0.12);
    const rearBumper = new THREE.Mesh(rearBumperGeo, steelDark);
    rearBumper.position.set(0, 0.55, -10.25);
    trailer.add(rearBumper);

    // Hazard Stripes on bumper
    const hazardMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const hazardMesh = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.1, 0.13), hazardMat);
    hazardMesh.position.set(0, 0.55, -10.26);
    trailer.add(hazardMesh);

    // Rear Taillights
    const brakeMatL = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x440000, roughness: 0.3 });
    const brakeL = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.05), brakeMatL);
    brakeL.position.set(-0.85, 0.55, -10.32);
    trailer.add(brakeL);
    brakeLightMaterials.push(brakeMatL);

    const brakeMatR = new THREE.MeshStandardMaterial({ color: 0x660000, emissive: 0x440000, roughness: 0.3 });
    const brakeR = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.14, 0.05), brakeMatR);
    brakeR.position.set(0.85, 0.55, -10.32);
    trailer.add(brakeR);
    brakeLightMaterials.push(brakeMatR);

    // Trailer Indicators
    const indMatL = new THREE.MeshStandardMaterial({ color: 0x552200, emissive: 0x000000, roughness: 0.3 });
    const indL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), indMatL);
    indL.position.set(-1.1, 0.55, -10.32);
    trailer.add(indL);
    leftIndicatorMaterials.push(indMatL);

    const indMatR = new THREE.MeshStandardMaterial({ color: 0x552200, emissive: 0x000000, roughness: 0.3 });
    const indR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.06), indMatR);
    indR.position.set(1.1, 0.55, -10.32);
    trailer.add(indR);
    rightIndicatorMaterials.push(indMatR);

    // Side Amber Marker LEDs along trailer flank
    const markerMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    markerLights.push(markerMat);
    for (let z = -9.0; z <= 0; z += 2.2) {
      const markL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), markerMat);
      markL.position.set(-1.24, 0.85, z);
      const markR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), markerMat);
      markR.position.set(1.24, 0.85, z);
      trailer.add(markL, markR);
    }

    trailer.wheels = wheels;
    trailer.brakeLightMaterials = brakeLightMaterials;
    trailer.leftIndicatorMaterials = leftIndicatorMaterials;
    trailer.rightIndicatorMaterials = rightIndicatorMaterials;
    trailer.markerLights = markerLights;

    return trailer;
  }
}
