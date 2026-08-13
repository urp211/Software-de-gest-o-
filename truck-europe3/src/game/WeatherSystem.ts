import * as THREE from 'three';
import type { WeatherType } from './types';
import { SoundManager } from '../audio/SoundManager';

export class WeatherSystem {
  public currentWeather: WeatherType = 'sunny';
  public timeOfDay: number = 14;
  public timeScale: number = 0.05;

  private scene: THREE.Scene;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private rainParticles: THREE.Points | null = null;
  private soundManager: SoundManager;
  private streetlights: THREE.Light[] = [];

  constructor(scene: THREE.Scene, soundManager: SoundManager, streetlights: THREE.Light[] = []) {
    this.scene = scene;
    this.soundManager = soundManager;
    this.streetlights = streetlights;

    // Ambient/Hemisphere Sky Light
    this.hemiLight = new THREE.HemisphereLight(0xb1e1ff, 0x3b6e2d, 0.65);
    this.scene.add(this.hemiLight);

    // Sun / Moon Directional Light
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.position.set(120, 200, 100);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 450;
    this.dirLight.shadow.camera.left = -120;
    this.dirLight.shadow.camera.right = 120;
    this.dirLight.shadow.camera.top = 120;
    this.dirLight.shadow.camera.bottom = -120;
    this.dirLight.shadow.bias = -0.0005;
    this.scene.add(this.dirLight);

    this.setupRainParticles();
    this.applyWeather(this.currentWeather);
  }

  private setupRainParticles() {
    const particleCount = 4500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 120;
      positions[i + 1] = Math.random() * 40;
      positions[i + 2] = (Math.random() - 0.5) * 120;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.25,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });

    this.rainParticles = new THREE.Points(geometry, material);
    this.rainParticles.visible = false;
    this.scene.add(this.rainParticles);
  }

  public setWeather(type: WeatherType) {
    this.currentWeather = type;
    this.applyWeather(type);
  }

  private applyWeather(type: WeatherType) {
    if (type === 'sunny') {
      this.scene.background = new THREE.Color(0x7dd3fc);
      this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.002);
      this.dirLight.color.setHex(0xffffff);
      this.dirLight.intensity = 1.4;
      this.hemiLight.color.setHex(0xb1e1ff);
      this.hemiLight.groundColor.setHex(0x3b6e2d);
      this.hemiLight.intensity = 0.65;
      if (this.rainParticles) this.rainParticles.visible = false;
      this.soundManager.setRainVolume(false);
      this.toggleStreetlights(false);
    } else if (type === 'rainy') {
      this.scene.background = new THREE.Color(0x475569);
      this.scene.fog = new THREE.FogExp2(0x475569, 0.009);
      this.dirLight.color.setHex(0x94a3b8);
      this.dirLight.intensity = 0.45;
      this.hemiLight.color.setHex(0x64748b);
      this.hemiLight.groundColor.setHex(0x1e293b);
      this.hemiLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = true;
      this.soundManager.setRainVolume(true);
      this.toggleStreetlights(true);
    } else if (type === 'foggy') {
      this.scene.background = new THREE.Color(0x94a3b8);
      this.scene.fog = new THREE.FogExp2(0x94a3b8, 0.016);
      this.dirLight.intensity = 0.5;
      this.hemiLight.intensity = 0.4;
      if (this.rainParticles) this.rainParticles.visible = false;
      this.soundManager.setRainVolume(false);
      this.toggleStreetlights(true);
    } else if (type === 'sunset') {
      this.scene.background = new THREE.Color(0xf97316);
      this.scene.fog = new THREE.FogExp2(0xf97316, 0.0035);
      this.dirLight.color.setHex(0xfdba74);
      this.dirLight.intensity = 1.0;
      this.hemiLight.color.setHex(0xfb923c);
      this.hemiLight.groundColor.setHex(0x431407);
      this.hemiLight.intensity = 0.5;
      if (this.rainParticles) this.rainParticles.visible = false;
      this.soundManager.setRainVolume(false);
      this.toggleStreetlights(true);
    } else if (type === 'night') {
      this.scene.background = new THREE.Color(0x050814);
      this.scene.fog = new THREE.FogExp2(0x050814, 0.004);
      this.dirLight.color.setHex(0x38bdf8);
      this.dirLight.intensity = 0.15;
      this.hemiLight.color.setHex(0x0f172a);
      this.hemiLight.groundColor.setHex(0x020617);
      this.hemiLight.intensity = 0.15;
      if (this.rainParticles) this.rainParticles.visible = false;
      this.soundManager.setRainVolume(false);
      this.toggleStreetlights(true);
    }
  }

  private toggleStreetlights(enable: boolean) {
    this.streetlights.forEach(l => {
      l.intensity = enable ? 2.5 : 0;
    });
  }

  public update(dt: number, cameraPos: THREE.Vector3) {
    // Animate falling rain particles around camera
    if (this.currentWeather === 'rainy' && this.rainParticles) {
      this.rainParticles.position.x = cameraPos.x;
      this.rainParticles.position.z = cameraPos.z;

      const positions = this.rainParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 35 * dt;
        if (positions[i] < 0) {
          positions[i] = 35 + Math.random() * 5;
        }
      }
      this.rainParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Shadow follower
    this.dirLight.position.set(cameraPos.x + 80, 160, cameraPos.z + 60);
    this.dirLight.target.position.set(cameraPos.x, 0, cameraPos.z);
    this.dirLight.target.updateMatrixWorld();
  }
}
