/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { WellnessType } from '../types';
import { audioSynth } from '../utils/audio';

interface ARCanvasProps {
  step: 'scanning' | 'ready_to_place' | 'placed';
  selectedObject: WellnessType | null;
  onSelectObject: (type: WellnessType | null) => void;
  onSurfaceDetected: () => void;
}

export default function ARCanvas({
  step,
  selectedObject,
  onSelectObject,
  onSurfaceDetected,
}: ARCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Labels projection state
  const [labels, setLabels] = useState<{
    pool: { x: number; y: number; visible: boolean };
    sauna: { x: number; y: number; visible: boolean };
    massage: { x: number; y: number; visible: boolean };
  }>({
    pool: { x: 0, y: 0, visible: false },
    sauna: { x: 0, y: 0, visible: false },
    massage: { x: 0, y: 0, visible: false },
  });

  // Keep references for animation loop
  const stateRef = useRef({
    step,
    selectedObject,
    rotationX: 0.4, // Initial camera angles
    rotationY: -0.6,
    distance: 12,
    isDragging: false,
    startX: 0,
    startY: 0,
    pinchStartDist: 0,
    pinchStartDistRatio: 1,
    width: 0,
    height: 0,
  });

  // Update refs when props change
  useEffect(() => {
    stateRef.current.step = step;
    stateRef.current.selectedObject = selectedObject;
  }, [step, selectedObject]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // Dimensions setup with ResizeObserver
    const updateSize = (width: number, height: number) => {
      stateRef.current.width = width;
      stateRef.current.height = height;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateSize(width || 375, height || 600);
      }
    });
    resizeObserver.observe(container);

    const initialWidth = container.clientWidth || 375;
    const initialHeight = container.clientHeight || 600;
    stateRef.current.width = initialWidth;
    stateRef.current.height = initialHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    
    const camera = new THREE.PerspectiveCamera(
      45,
      initialWidth / initialHeight,
      0.1,
      100
    );
    camera.position.set(0, 5, 12);
    
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true, // Transparent for camera video background
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(initialWidth, initialHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 12, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -6;
    dirLight.shadow.camera.right = 6;
    dirLight.shadow.camera.top = 6;
    dirLight.shadow.camera.bottom = -6;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // Warm accent spot light representing luxury wellness sunset/glow
    const spotLight = new THREE.SpotLight(0x00f0ff, 8, 20, Math.PI / 4, 0.5, 1);
    spotLight.position.set(-4, 8, -4);
    scene.add(spotLight);

    const warmLight = new THREE.SpotLight(0xffb703, 5, 15, Math.PI / 3, 0.6, 1);
    warmLight.position.set(4, 6, 4);
    scene.add(warmLight);

    // 3. SCANNING ENVIRONMENT (Grid & Reticle)
    // Create a circular hologram scanning reticle
    const reticleGroup = new THREE.Group();
    scene.add(reticleGroup);

    const reticleRingGeom = new THREE.RingGeometry(1.4, 1.5, 32);
    const reticleRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const reticleRing = new THREE.Mesh(reticleRingGeom, reticleRingMat);
    reticleRing.rotation.x = Math.PI / 2;
    reticleGroup.add(reticleRing);

    // Dots for grid effect
    const gridPointsGeom = new THREE.BufferGeometry();
    const gridPositions: number[] = [];
    const gridSize = 10;
    const gridSpacing = 0.6;
    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        gridPositions.push(i * gridSpacing, -0.05, j * gridSpacing);
      }
    }
    gridPointsGeom.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(gridPositions, 3)
    );
    const gridPointsMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
    });
    const gridPoints = new THREE.Points(gridPointsGeom, gridPointsMat);
    scene.add(gridPoints);

    // Dynamic horizontal line to animate scanning
    const scanLineGeom = new THREE.BoxGeometry(12, 0.02, 12);
    const scanLineMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.2,
    });
    const scanLine = new THREE.Mesh(scanLineGeom, scanLineMat);
    scanLine.position.y = 0.5;
    scene.add(scanLine);

    // 4. THE WELLNESS PLATFORM GROUP
    const platformGroup = new THREE.Group();
    platformGroup.position.set(0, 0, 0);
    scene.add(platformGroup);

    // A. Circular Base (Obsidian luxury disk with glowing cyan stripe)
    const baseGeom = new THREE.CylinderGeometry(3.5, 3.6, 0.25, 64);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x111625,
      roughness: 0.15,
      metalness: 0.8,
    });
    const baseDisk = new THREE.Mesh(baseGeom, baseMat);
    baseDisk.position.y = 0.125;
    baseDisk.receiveShadow = true;
    platformGroup.add(baseDisk);

    // Outer neon ring (torus)
    const outerRingGeom = new THREE.TorusGeometry(3.55, 0.05, 12, 64);
    const outerRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
    });
    const outerNeonRing = new THREE.Mesh(outerRingGeom, outerRingMat);
    outerNeonRing.rotation.x = Math.PI / 2;
    outerNeonRing.position.y = 0.22;
    platformGroup.add(outerNeonRing);

    // B. POOL OBJECT
    const poolGroup = new THREE.Group();
    poolGroup.position.set(-1.6, 0.25, 1.2);
    poolGroup.name = 'pool';
    platformGroup.add(poolGroup);

    // Pool Wall (Marble oval)
    const poolWallGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.5, 32);
    const poolWallMat = new THREE.MeshStandardMaterial({
      color: 0xe0e5ec,
      roughness: 0.1,
      metalness: 0.1,
    });
    const poolWall = new THREE.Mesh(poolWallGeom, poolWallMat);
    poolWall.castShadow = true;
    poolWall.receiveShadow = true;
    poolGroup.add(poolWall);

    // Inner Pool water cavity (colored darker blue inside)
    const poolCavityGeom = new THREE.CylinderGeometry(1.05, 1.05, 0.45, 32);
    const poolCavityMat = new THREE.MeshStandardMaterial({
      color: 0x003366,
      roughness: 0.4,
    });
    const poolCavity = new THREE.Mesh(poolCavityGeom, poolCavityMat);
    poolCavity.position.y = 0.03;
    poolGroup.add(poolCavity);

    // Water Surface (animated semi-transparent glass)
    const waterGeom = new THREE.CylinderGeometry(1.04, 1.04, 0.05, 32);
    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x00f5d4,
      transparent: true,
      opacity: 0.7,
      roughness: 0.05,
      metalness: 0.1,
    });
    const water = new THREE.Mesh(waterGeom, waterMat);
    water.position.y = 0.21;
    poolGroup.add(water);

    // C. SAUNA OBJECT
    const saunaGroup = new THREE.Group();
    saunaGroup.position.set(1.5, 0.25, 1.2);
    saunaGroup.name = 'sauna';
    platformGroup.add(saunaGroup);

    // Wood cabin structure (Box)
    const cabinGeom = new THREE.BoxGeometry(1.8, 1.3, 1.5);
    const cabinMat = new THREE.MeshStandardMaterial({
      color: 0xd4a373, // Wooden cedar
      roughness: 0.65,
    });
    const cabin = new THREE.Mesh(cabinGeom, cabinMat);
    cabin.position.y = 0.65;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    saunaGroup.add(cabin);

    // Elegant glass panel overlay (front facing)
    const glassPanelGeom = new THREE.BoxGeometry(0.05, 1.15, 1.4);
    const glassPanelMat = new THREE.MeshStandardMaterial({
      color: 0xccfffc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.01,
      metalness: 0.9,
    });
    const glassPanel = new THREE.Mesh(glassPanelGeom, glassPanelMat);
    glassPanel.position.set(-0.88, 0.65, 0);
    saunaGroup.add(glassPanel);

    // Interior lights (Warm orange sauna glow)
    const saunaInteriorLight = new THREE.PointLight(0xff5500, 3, 4);
    saunaInteriorLight.position.set(0, 0.8, 0);
    saunaGroup.add(saunaInteriorLight);

    // Sauna Steam Particles Group
    const steamGroup = new THREE.Group();
    saunaGroup.add(steamGroup);

    const steamCount = 8;
    const steamParticles: THREE.Mesh[] = [];
    const steamGeometry = new THREE.SphereGeometry(0.04, 8, 8);
    const steamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.15,
    });

    for (let i = 0; i < steamCount; i++) {
      const sp = new THREE.Mesh(steamGeometry, steamMaterial);
      // Scatter inside/above sauna cabin
      sp.position.set(
        (Math.random() - 0.5) * 1.0,
        0.5 + Math.random() * 0.8,
        (Math.random() - 0.5) * 1.0
      );
      steamGroup.add(sp);
      steamParticles.push(sp);
    }

    // D. MASSAGE OBJECT
    const massageGroup = new THREE.Group();
    massageGroup.position.set(0, 0.25, -1.6);
    massageGroup.name = 'massage';
    platformGroup.add(massageGroup);

    // Stone Slab Base (Zen dark marble)
    const slabGeom = new THREE.BoxGeometry(2.0, 0.2, 1.4);
    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.2,
      metalness: 0.4,
    });
    const slab = new THREE.Mesh(slabGeom, slabMat);
    slab.position.y = 0.1;
    slab.castShadow = true;
    slab.receiveShadow = true;
    massageGroup.add(slab);

    // Elegant White Massage Table
    const tableGeom = new THREE.BoxGeometry(1.6, 0.5, 0.8);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa, // White leather
      roughness: 0.45,
    });
    const table = new THREE.Mesh(tableGeom, tableMat);
    table.position.y = 0.45;
    table.castShadow = true;
    table.receiveShadow = true;
    massageGroup.add(table);

    // Pillow cushion
    const pillowGeom = new THREE.BoxGeometry(0.3, 0.08, 0.6);
    const pillow = new THREE.Mesh(pillowGeom, tableMat);
    pillow.position.set(-0.55, 0.74, 0);
    pillow.rotation.z = 0.12;
    massageGroup.add(pillow);

    // Decorative Zen stones (3 stacked spheres)
    const stoneGroup = new THREE.Group();
    stoneGroup.position.set(0.6, 0.25, 0.4);
    massageGroup.add(stoneGroup);

    const stoneMat = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.6,
    });
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), stoneMat);
    s1.scale.set(1.4, 0.6, 1.2);
    s1.position.y = 0.06;
    stoneGroup.add(s1);

    const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), stoneMat);
    s2.scale.set(1.4, 0.6, 1.2);
    s2.position.set(0.02, 0.14, 0.01);
    stoneGroup.add(s2);

    const s3 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), stoneMat);
    s3.scale.set(1.4, 0.6, 1.2);
    s3.position.set(-0.01, 0.20, -0.02);
    stoneGroup.add(s3);

    // Candles (Tiny glowing cylinders with small red/warm points)
    const candleGroup = new THREE.Group();
    candleGroup.position.set(0.6, 0.25, -0.4);
    massageGroup.add(candleGroup);

    const candleGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.12, 8);
    const candleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
    const candleBody = new THREE.Mesh(candleGeom, candleMat);
    candleBody.position.y = 0.06;
    candleGroup.add(candleBody);

    const flameLight = new THREE.PointLight(0xffaa44, 1.5, 1);
    flameLight.position.set(0, 0.15, 0);
    candleGroup.add(flameLight);

    // 5. INTERACTION SELECTION MESH OUTLINES
    // Build glowing neon-teal rings under selected objects
    const selectRingGeom = new THREE.RingGeometry(1.3, 1.4, 32);
    const selectRingMat = new THREE.MeshBasicMaterial({
      color: 0x00f5d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const poolRing = new THREE.Mesh(selectRingGeom, selectRingMat);
    poolRing.rotation.x = Math.PI / 2;
    poolRing.position.y = 0.52;
    poolGroup.add(poolRing);

    const saunaRing = new THREE.Mesh(selectRingGeom, selectRingMat.clone());
    saunaRing.rotation.x = Math.PI / 2;
    saunaRing.position.set(0, 1.32, 0);
    saunaGroup.add(saunaRing);

    const massageRing = new THREE.Mesh(selectRingGeom, selectRingMat.clone());
    massageRing.rotation.x = Math.PI / 2;
    massageRing.position.set(0, 0.72, 0);
    massageGroup.add(massageRing);

    // List of interactive structures for raycasting
    const interactiveObjects = [poolGroup, saunaGroup, massageGroup];

    // Lerping tracking states for smooth selection animation
    const modelScales = {
      pool: { current: 1.0, target: 1.0 },
      sauna: { current: 1.0, target: 1.0 },
      massage: { current: 1.0, target: 1.0 },
    };

    const modelOpacities = {
      pool: { current: 1.0, target: 1.0 },
      sauna: { current: 1.0, target: 1.0 },
      massage: { current: 1.0, target: 1.0 },
    };

    const outlineOpacities = {
      pool: { current: 0.0, target: 0.0 },
      sauna: { current: 0.0, target: 0.0 },
      massage: { current: 0.0, target: 0.0 },
    };

    // Helper to recursively set opacity of a group
    const setGroupOpacity = (obj: THREE.Object3D, opacity: number) => {
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh && child !== poolRing && child !== saunaRing && child !== massageRing) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => {
              mat.transparent = opacity < 0.99;
              mat.opacity = opacity;
            });
          } else if (child.material) {
            child.material.transparent = opacity < 0.99;
            child.material.opacity = opacity;
          }
        }
      });
    };

    // Trigger surface detection automatically during scanning state
    let scanTimer = 0;
    let surfaceReported = false;

    // 6. ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      const currentStep = stateRef.current.step;
      const currentSelected = stateRef.current.selectedObject;

      // Scanning step animation
      if (currentStep === 'scanning') {
        reticleGroup.visible = true;
        gridPoints.visible = true;
        scanLine.visible = true;
        platformGroup.visible = false;

        // Pulse reticle
        const scaleVal = 1.0 + Math.sin(time * 4) * 0.08;
        reticleGroup.scale.set(scaleVal, 1, scaleVal);

        // Move scanning line up/down
        scanLine.position.y = Math.sin(time * 1.5) * 1.5 + 0.5;

        // Auto trigger plane detection after 2.5 seconds
        scanTimer += delta;
        if (scanTimer > 2.5 && !surfaceReported) {
          surfaceReported = true;
          onSurfaceDetected();
        }
      } else if (currentStep === 'ready_to_place') {
        reticleGroup.visible = true;
        gridPoints.visible = true;
        scanLine.visible = false;
        platformGroup.visible = false;

        // Green glow for ready
        (reticleRing.material as THREE.MeshBasicMaterial).color.setHex(0x00f5d4);
        const scaleVal = 1.0 + Math.sin(time * 6) * 0.04;
        reticleGroup.scale.set(scaleVal, 1, scaleVal);
      } else if (currentStep === 'placed') {
        reticleGroup.visible = false;
        gridPoints.visible = false;
        scanLine.visible = false;
        platformGroup.visible = true;

        // Animate water waves
        water.position.y = 0.20 + Math.sin(time * 2.5) * 0.015;
        // Shift water color/glow intensity
        (water.material as THREE.MeshStandardMaterial).opacity = 0.6 + Math.sin(time * 2) * 0.1;

        // Animate sauna steam
        steamParticles.forEach((sp, idx) => {
          sp.position.y += delta * 0.25;
          // sway
          sp.position.x += Math.sin(time + idx) * 0.003;
          
          // Fade out steam near top
          const progress = (sp.position.y - 0.5) / 0.8;
          (sp.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.2 * (1 - progress));

          if (sp.position.y > 1.3) {
            sp.position.y = 0.5 + Math.random() * 0.2;
            sp.position.x = (Math.random() - 0.5) * 0.8;
          }
        });

        // Flicker candle flame slightly
        flameLight.intensity = 1.2 + Math.sin(time * 15) * 0.3;

        // Dynamic target selection logic
        (Object.keys(modelScales) as WellnessType[]).forEach((type) => {
          if (currentSelected === null) {
            // No selection: reset all
            modelScales[type].target = 1.0;
            modelOpacities[type].target = 1.0;
            outlineOpacities[type].target = 0.0;
          } else if (currentSelected === type) {
            // Selected building scales up, glows
            modelScales[type].target = 1.35;
            modelOpacities[type].target = 1.0;
            outlineOpacities[type].target = 0.8 + Math.sin(time * 6) * 0.2;
          } else {
            // Unselected items scale down and fade out
            modelScales[type].target = 0.75;
            modelOpacities[type].target = 0.25;
            outlineOpacities[type].target = 0.0;
          }

          // Smooth Lerps
          const scaleDiff = modelScales[type].target - modelScales[type].current;
          modelScales[type].current += scaleDiff * delta * 7;

          const opacityDiff = modelOpacities[type].target - modelOpacities[type].current;
          modelOpacities[type].current += opacityDiff * delta * 7;

          const outlineDiff = outlineOpacities[type].target - outlineOpacities[type].current;
          outlineOpacities[type].current += outlineDiff * delta * 7;

          // Apply to 3D groups
          const groupMap = {
            pool: poolGroup,
            sauna: saunaGroup,
            massage: massageGroup,
          };
          
          const ringMap = {
            pool: poolRing,
            sauna: saunaRing,
            massage: massageRing,
          };

          const grp = groupMap[type];
          grp.scale.setScalar(modelScales[type].current);
          setGroupOpacity(grp, modelOpacities[type].current);

          const ring = ringMap[type];
          (ring.material as THREE.MeshBasicMaterial).opacity = outlineOpacities[type].current;
          // Rotate rings for spinning neon aura
          ring.rotation.z += delta * 0.5;
        });
      }

      // 7. Update Camera / Orbit simulation
      const targetX = Math.sin(stateRef.current.rotationY) * Math.cos(stateRef.current.rotationX) * stateRef.current.distance;
      const targetY = Math.sin(stateRef.current.rotationX) * stateRef.current.distance;
      const targetZ = Math.cos(stateRef.current.rotationY) * Math.cos(stateRef.current.rotationX) * stateRef.current.distance;

      // Smooth camera motion
      camera.position.x += (targetX - camera.position.x) * 0.15;
      camera.position.y += (targetY - camera.position.y) * 0.15;
      camera.position.z += (targetZ - camera.position.z) * 0.15;
      camera.lookAt(0, 0.4, 0);

      renderer.render(scene, camera);

      // 8. Project 3D Coordinates of Labels to Screen HTML overlays
      if (currentStep === 'placed') {
        const coords = {
          pool: new THREE.Vector3(-1.6, 1.1, 1.2),
          sauna: new THREE.Vector3(1.5, 1.7, 1.2),
          massage: new THREE.Vector3(0, 1.3, -1.6),
        };

        const newLabels = { ...labels };

        (Object.keys(coords) as WellnessType[]).forEach((key) => {
          const vec = coords[key].clone();
          // Apply model scale and height adjustment
          if (currentSelected === key) {
            vec.y *= 1.2;
          }
          vec.project(camera);

          // Convert to client width/height
          const width = stateRef.current.width;
          const height = stateRef.current.height;

          newLabels[key] = {
            x: (vec.x * 0.5 + 0.5) * width,
            y: (-(vec.y * 0.5) + 0.5) * height,
            visible: vec.z <= 1, // Behind camera check
          };
        });

        // Set state inside animation frame to keep HTML overlay synced
        setLabels(newLabels);
      }
    };

    animate();

    // 9. EVENT HANDLERS FOR MOUSE / TOUCH GESTURES (Orbit Controls simulation)
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      stateRef.current.isDragging = true;
      stateRef.current.startX = clientX;
      stateRef.current.startY = clientY;

      // Handle multi-touch pinch to zoom
      if ('touches' in e && e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        stateRef.current.pinchStartDist = Math.sqrt(dx * dx + dy * dy);
        stateRef.current.pinchStartDistRatio = stateRef.current.distance;
      }
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!stateRef.current.isDragging) return;

      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      if ('touches' in e && e.touches.length === 2 && stateRef.current.pinchStartDist > 0) {
        // Multi-touch Zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const factor = stateRef.current.pinchStartDist / dist;
        stateRef.current.distance = THREE.MathUtils.clamp(
          stateRef.current.pinchStartDistRatio * factor,
          6,
          20
        );
        return;
      }

      // Single touch rotate/pan
      const dx = clientX - stateRef.current.startX;
      const dy = clientY - stateRef.current.startY;

      stateRef.current.rotationY -= dx * 0.007;
      stateRef.current.rotationX = THREE.MathUtils.clamp(
        stateRef.current.rotationX + dy * 0.005,
        0.1, // Don't flip below the ground
        1.3  // Don't look strictly top-down completely
      );

      stateRef.current.startX = clientX;
      stateRef.current.startY = clientY;
    };

    const handlePointerUp = () => {
      stateRef.current.isDragging = false;
      stateRef.current.pinchStartDist = 0;
    };

    // Zoom wheel handler
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      stateRef.current.distance = THREE.MathUtils.clamp(
        stateRef.current.distance + e.deltaY * 0.005,
        6,
        22
      );
    };

    // Raycast on tap/click to select buildings
    const handleTap = (clientX: number, clientY: number) => {
      // Get relative canvas coordinates
      const rect = canvas.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((clientY - rect.top) / rect.height) * 2 + 1;

      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      // Raycast against buildings
      const intersects = raycaster.intersectObjects(interactiveObjects, true);

      if (intersects.length > 0) {
        // Find which group was hit
        let hitGroup: THREE.Object3D | null = intersects[0].object;
        while (hitGroup && hitGroup !== scene) {
          if (hitGroup.name === 'pool' || hitGroup.name === 'sauna' || hitGroup.name === 'massage') {
            break;
          }
          hitGroup = hitGroup.parent;
        }

        if (hitGroup && (hitGroup.name === 'pool' || hitGroup.name === 'sauna' || hitGroup.name === 'massage')) {
          const type = hitGroup.name as WellnessType;
          if (stateRef.current.selectedObject === type) {
            onSelectObject(null);
            audioSynth.playClose();
          } else {
            onSelectObject(type);
            audioSynth.playSelect();
          }
          return;
        }
      }

      // Clicked empty space: de-select
      if (stateRef.current.selectedObject !== null) {
        onSelectObject(null);
        audioSynth.playClose();
      }
    };

    // Click trigger with move threshold to distinguish tap vs drag
    let clickStartX = 0;
    let clickStartY = 0;

    const onMouseDown = (e: MouseEvent) => {
      clickStartX = e.clientX;
      clickStartY = e.clientY;
      handlePointerDown(e);
    };

    const onMouseUp = (e: MouseEvent) => {
      handlePointerUp();
      const dist = Math.sqrt(
        Math.pow(e.clientX - clickStartX, 2) + Math.pow(e.clientY - clickStartY, 2)
      );
      if (dist < 4) {
        handleTap(e.clientX, e.clientY);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        clickStartX = e.touches[0].clientX;
        clickStartY = e.touches[0].clientY;
      }
      handlePointerDown(e);
    };

    const onTouchEnd = (e: TouchEvent) => {
      handlePointerUp();
      if (e.changedTouches.length === 1) {
        const dist = Math.sqrt(
          Math.pow(e.changedTouches[0].clientX - clickStartX, 2) +
          Math.pow(e.changedTouches[0].clientY - clickStartY, 2)
        );
        if (dist < 8) {
          handleTap(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        }
      }
    };

    // Attach listeners
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);
    canvas.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('wheel', handleWheel);

      // Clean scene geometries & materials
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((mat) => mat.dispose());
          } else {
            obj.material?.dispose();
          }
        }
      });
      renderer.dispose();
    };
  }, [onSurfaceDetected]);

  // Handle label click (allows clicking on neon floating names as well)
  const handleLabelClick = (type: WellnessType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedObject === type) {
      onSelectObject(null);
      audioSynth.playClose();
    } else {
      onSelectObject(type);
      audioSynth.playSelect();
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full select-none cursor-grab active:cursor-grabbing">
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Floating HTML 2D Neon Labels overlay */}
      {step === 'placed' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden font-display">
          {(Object.keys(labels) as WellnessType[]).map((key) => {
            const label = labels[key];
            if (!label.visible) return null;

            const isSelected = selectedObject === key;
            const isAnySelected = selectedObject !== null;
            const opacityClass = isSelected
              ? 'opacity-100'
              : isAnySelected
              ? 'opacity-25 scale-90'
              : 'opacity-90';

            return (
              <button
                key={key}
                onClick={(e) => handleLabelClick(key, e)}
                style={{
                  left: `${label.x}px`,
                  top: `${label.y}px`,
                  transform: 'translate(-50%, -100%)',
                }}
                className={`absolute pointer-events-auto transition-all duration-300 ease-out flex flex-col items-center gap-1 ${opacityClass}`}
              >
                {/* Neon tag */}
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border shadow-lg flex items-center gap-1.5 backdrop-blur-md transition-all duration-300 ${
                    isSelected
                      ? 'bg-neon-teal/20 text-white border-neon-teal neon-border-teal text-[13px]'
                      : 'bg-black/60 text-neon-blue border-neon-blue/40 hover:bg-black/80 hover:border-neon-blue'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? 'bg-neon-teal animate-ping' : 'bg-neon-blue'
                    }`}
                  />
                  {key}
                </div>
                {/* Pulsing indicator peg */}
                <div
                  className={`w-0.5 h-6 transition-colors duration-300 ${
                    isSelected ? 'bg-neon-teal' : 'bg-neon-blue/50'
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
