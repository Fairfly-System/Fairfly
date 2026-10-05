import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import './puzzle-house.css';

/**
 * Interactive 3D Building Blocks House Component
 * Represents the modular, turnkey Fairfly Franchise Business System.
 * Built with Three.js WebGL canvas featuring interactive raycasting,
 * real-time directional lighting, mouse tilt parallax, and sharp editorial callouts.
 */
export default function PuzzleHouse({ onPieceClick, activePillar }) {
  const mountRef = useRef(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [selectedPiece, setSelectedPiece] = useState(activePillar || null);

  const pieces = useMemo(() => ({
    roof: {
      id: 'roof',
      code: 'PILLAR 01',
      title: 'ISO: 9001-2000 Ready System',
      badge: 'Quality Standard',
      color: '#EAB308',
      desc: 'Standardized operational procedures that guarantee high service quality, certified workflows, and zero customer friction.'
    },
    chimney: {
      id: 'chimney',
      code: 'PILLAR 02',
      title: 'Head Office Brand Power',
      badge: 'Operational Backup',
      color: '#EF4444',
      desc: 'Marketing leverage, authorized agency credentials, and centralized ticketing issuance supported directly by FairFly HQ.'
    },
    blueWall: {
      id: 'blueWall',
      code: 'PILLAR 03',
      title: '100% Cloud Virtual Office',
      badge: 'Modern Technology',
      color: '#0284C7',
      desc: 'Anywhere access to ticketing, client tracking, real-time Firestore database, and automated document generation.'
    },
    purpleWall: {
      id: 'purpleWall',
      code: 'PILLAR 04',
      title: '2-Month Fast-Track Academy',
      badge: '29 Yrs Experience Transfer',
      color: '#7C3AED',
      desc: 'Master the travel and civil documentation business in just 60 days with complete operator mentorship and real-case simulations.'
    },
    greenBase: {
      id: 'greenBase',
      code: 'PILLAR 05',
      title: 'Zero Physical Inventory',
      badge: 'Asset-Light',
      color: '#84CC16',
      desc: 'No warehouse rent, no expiring merchandise, no locked capital. 100% service-based travel agency model.'
    },
    orangeBase: {
      id: 'orangeBase',
      code: 'PILLAR 06',
      title: 'Cash-Basis Upfront Profit',
      badge: 'High Margin',
      color: '#F97316',
      desc: 'Clients pay before booking execution, ensuring steady positive cash flow and zero bad debt for your branch.'
    }
  }), []);

  // Update selected piece if activePillar prop changes
  useEffect(() => {
    if (activePillar && pieces[activePillar]) {
      setSelectedPiece(activePillar);
    }
  }, [activePillar, pieces]);

  // Current active piece to display in info callout
  const activeId = hoveredPiece || selectedPiece || 'roof';
  const currentInfo = pieces[activeId] || pieces.roof;

  // Sync state with 3D animation loop via refs
  const hoveredRef = useRef(hoveredPiece);
  hoveredRef.current = hoveredPiece;

  const selectedRef = useRef(selectedPiece);
  selectedRef.current = selectedPiece;

  const handleSelectPiece = useCallback((id) => {
    setSelectedPiece(id);
    if (onPieceClick) onPieceClick(id);
  }, [onPieceClick]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 520;
    let height = container.clientHeight || 460;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    // Isometric-angled perspective
    camera.position.set(7.5, 6.2, 8.5);
    camera.lookAt(0, 0.35, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x94a3b8, 0.6);
    scene.add(hemisphereLight);

    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.85);
    keyLight.position.set(6, 11, 7);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -5;
    keyLight.shadow.camera.right = 5;
    keyLight.shadow.camera.top = 5;
    keyLight.shadow.camera.bottom = -5;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.65);
    fillLight.position.set(-8, 5, -5);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xfef08a, 0.5);
    rimLight.position.set(0, 6, -8);
    scene.add(rimLight);

    // --- House Object Group ---
    const houseGroup = new THREE.Group();
    scene.add(houseGroup);

    // Floor Contact Shadow Plinth
    const shadowGeo = new THREE.PlaneGeometry(6.6, 6.4);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      transparent: true,
      opacity: 0.12,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -2.25;
    scene.add(shadowMesh);

    // Mesh references mapped by id
    const meshMap = new Map();
    const originalPositions = new Map();

    // 1. Orange Plinth Base (Cash-Basis Upfront Profit)
    const orangeGeo = new THREE.BoxGeometry(5.4, 0.72, 5.0);
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xF97316,
      roughness: 0.26,
      metalness: 0.05
    });
    const orangeMesh = new THREE.Mesh(orangeGeo, orangeMat);
    orangeMesh.position.set(0, -1.82, 0);
    orangeMesh.castShadow = true;
    orangeMesh.receiveShadow = true;
    orangeMesh.userData = { id: 'orangeBase' };
    houseGroup.add(orangeMesh);
    meshMap.set('orangeBase', orangeMesh);
    originalPositions.set('orangeBase', orangeMesh.position.clone());

    // 2. Green Base Section (Zero Physical Inventory)
    const greenGeo = new THREE.BoxGeometry(2.35, 1.15, 4.3);
    const greenMat = new THREE.MeshStandardMaterial({
      color: 0x84CC16,
      roughness: 0.28,
      metalness: 0.04
    });
    const greenMesh = new THREE.Mesh(greenGeo, greenMat);
    greenMesh.position.set(-1.24, -0.88, 0);
    greenMesh.castShadow = true;
    greenMesh.receiveShadow = true;
    greenMesh.userData = { id: 'greenBase' };
    houseGroup.add(greenMesh);
    meshMap.set('greenBase', greenMesh);
    originalPositions.set('greenBase', greenMesh.position.clone());

    // 3. Purple Wall (2-Month Fast-Track Academy)
    const purpleGeo = new THREE.BoxGeometry(2.35, 2.65, 4.3);
    const purpleMat = new THREE.MeshStandardMaterial({
      color: 0x7C3AED,
      roughness: 0.28,
      metalness: 0.05
    });
    const purpleMesh = new THREE.Mesh(purpleGeo, purpleMat);
    purpleMesh.position.set(1.24, -0.15, 0);
    purpleMesh.castShadow = true;
    purpleMesh.receiveShadow = true;
    purpleMesh.userData = { id: 'purpleWall' };
    houseGroup.add(purpleMesh);
    meshMap.set('purpleWall', purpleMesh);
    originalPositions.set('purpleWall', purpleMesh.position.clone());

    // 4. Blue Upper Wall (100% Cloud Virtual Office)
    const blueGeo = new THREE.BoxGeometry(2.35, 1.45, 4.3);
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x0284C7,
      roughness: 0.26,
      metalness: 0.04
    });
    const blueMesh = new THREE.Mesh(blueGeo, blueMat);
    blueMesh.position.set(-1.24, 0.45, 0);
    blueMesh.castShadow = true;
    blueMesh.receiveShadow = true;
    blueMesh.userData = { id: 'blueWall' };
    houseGroup.add(blueMesh);
    meshMap.set('blueWall', blueMesh);
    originalPositions.set('blueWall', blueMesh.position.clone());

    // 5. Yellow Roof (ISO: 9001-2000 Ready System)
    const roofShape = new THREE.Shape();
    roofShape.moveTo(-2.85, 0);
    roofShape.lineTo(0, 1.85);
    roofShape.lineTo(2.85, 0);
    roofShape.closePath();

    const roofGeo = new THREE.ExtrudeGeometry(roofShape, {
      depth: 4.65,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.05,
      bevelThickness: 0.05
    });
    roofGeo.center();

    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xFACC15,
      roughness: 0.24,
      metalness: 0.04
    });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.set(0, 2.12, 0);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    roofMesh.userData = { id: 'roof' };
    houseGroup.add(roofMesh);
    meshMap.set('roof', roofMesh);
    originalPositions.set('roof', roofMesh.position.clone());

    // 6. Red Chimney (Head Office Brand Power)
    const chimneyGeo = new THREE.BoxGeometry(0.75, 1.65, 0.75);
    const chimneyMat = new THREE.MeshStandardMaterial({
      color: 0xEF4444,
      roughness: 0.3,
      metalness: 0.05
    });
    const chimneyMesh = new THREE.Mesh(chimneyGeo, chimneyMat);
    chimneyMesh.position.set(1.18, 2.65, -0.65);
    chimneyMesh.castShadow = true;
    chimneyMesh.receiveShadow = true;
    chimneyMesh.userData = { id: 'chimney' };
    houseGroup.add(chimneyMesh);
    meshMap.set('chimney', chimneyMesh);
    originalPositions.set('chimney', chimneyMesh.position.clone());

    // --- Interaction, Raycasting & Mouse Tilt ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-1000, -1000);
    let targetRotationX = 0;
    let targetRotationY = 0;

    const onPointerMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouse.x = x;
      mouse.y = y;

      targetRotationY = x * 0.35;
      targetRotationX = -y * 0.25;

      // Raycast test for cursor style and hover
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hitId = intersects[0].object.userData.id;
        if (hitId && hitId !== hoveredRef.current) {
          setHoveredPiece(hitId);
        }
      } else {
        renderer.domElement.style.cursor = 'grab';
        if (hoveredRef.current !== null) {
          setHoveredPiece(null);
        }
      }
    };

    const onPointerLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      targetRotationX = 0;
      targetRotationY = 0;
      setHoveredPiece(null);
      renderer.domElement.style.cursor = 'default';
    };

    const onPointerDown = () => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(Array.from(meshMap.values()));
      if (intersects.length > 0) {
        const hitId = intersects[0].object.userData.id;
        if (hitId) {
          handleSelectPiece(hitId);
        }
      }
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('pointermove', onPointerMove);
    domEl.addEventListener('pointerleave', onPointerLeave);
    domEl.addEventListener('pointerdown', onPointerDown);

    // Responsive Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // --- Animation Loop ---
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Smooth damped rotation towards cursor target + gentle idle breathing float
      const idleSway = Math.sin(elapsedTime * 0.8) * 0.025;
      houseGroup.rotation.y += (targetRotationY + idleSway - houseGroup.rotation.y) * 0.06;
      houseGroup.rotation.x += (targetRotationX - houseGroup.rotation.x) * 0.06;

      const currentHover = hoveredRef.current;
      const currentSelected = selectedRef.current;

      // Animate pillar elevations & emissive highlights
      meshMap.forEach((mesh, id) => {
        const origPos = originalPositions.get(id);
        const isTarget = id === currentHover || (!currentHover && id === currentSelected);

        const targetY = isTarget ? origPos.y + 0.18 : origPos.y;
        mesh.position.y += (targetY - mesh.position.y) * 0.14;

        if (mesh.material) {
          const targetEmissive = isTarget ? 0.22 : 0.0;
          mesh.material.emissiveIntensity = THREE.MathUtils.lerp(
            mesh.material.emissiveIntensity || 0,
            targetEmissive,
            0.15
          );
          if (isTarget) {
            mesh.material.emissive.set(mesh.material.color);
          } else {
            mesh.material.emissive.setHex(0x000000);
          }
        }
      });

      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      domEl.removeEventListener('pointermove', onPointerMove);
      domEl.removeEventListener('pointerleave', onPointerLeave);
      domEl.removeEventListener('pointerdown', onPointerDown);

      if (container.contains(domEl)) {
        container.removeChild(domEl);
      }

      // Dispose geometries & materials
      meshMap.forEach((mesh) => {
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) mesh.material.dispose();
      });
      shadowGeo.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
  }, [handleSelectPiece, meshMapRef => {}]);

  return (
    <div className="puzzle-house-wrapper">
      {/* 3D WebGL Canvas Stage */}
      <div className="puzzle-house-stage" ref={mountRef} />

      {/* Pillar Selection Chips (Razor-sharp, Accessible) */}
      <div className="puzzle-pillar-selector" role="tablist" aria-label="System Pillars">
        {Object.values(pieces).map((p) => {
          const isSelected = activeId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`pillar-chip ${isSelected ? 'active' : ''}`}
              style={{ '--pillar-color': p.color }}
              onMouseEnter={() => setHoveredPiece(p.id)}
              onMouseLeave={() => setHoveredPiece(null)}
              onClick={() => handleSelectPiece(p.id)}
            >
              <span className="chip-indicator" />
              <span className="chip-name">{p.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Sharp Editorial Info Callout Card */}
      <div className="puzzle-piece-callout" style={{ borderLeftColor: currentInfo.color }}>
        <div className="callout-header">
          <span className="callout-code">{currentInfo.code}</span>
          <span className="callout-badge" style={{ backgroundColor: currentInfo.color }}>
            {currentInfo.badge}
          </span>
          <h3 className="callout-title">{currentInfo.title}</h3>
        </div>
        <p className="callout-desc">{currentInfo.desc}</p>
      </div>
    </div>
  );
}
