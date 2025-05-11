'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function GameScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current?.appendChild(renderer.domElement);

    // ground
    const tileSize = 20;
    const tilesPerAxis = 3;
    const half = Math.floor(tilesPerAxis / 2);
    const tiles: THREE.Mesh[] = [];

    const groundGeometry = new THREE.PlaneGeometry(tileSize, tileSize);
    const groundMaterial = new THREE.MeshBasicMaterial({
      color: 0x444444,
      wireframe: true,
    });

    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        const tile = new THREE.Mesh(groundGeometry, groundMaterial);
        tile.rotation.x = Math.PI / 2;
        tile.position.set(x * tileSize, 0, z * tileSize);
        scene.add(tile);
        tiles.push(tile);
      }
    }

    // player
    const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
    const playerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.y = 0.5;
    scene.add(player);

    camera.position.set(0, 5, 5);
    camera.lookAt(player.position);

    const keys = { w: false, a: false, s: false, d: false };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key in keys) keys[e.key as keyof typeof keys] = false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    const updateTiles = () => {
      const playerTileX = Math.floor(player.position.x / tileSize);
      const playerTileZ = Math.floor(player.position.z / tileSize);

      let i = 0;
      for (let x = -half; x <= half; x++) {
        for (let z = -half; z <= half; z++) {
          const tile = tiles[i];
          tile.position.x = (playerTileX + x) * tileSize;
          tile.position.z = (playerTileZ + z) * tileSize;
          i++;
        }
      }
    };

    const velocity = new THREE.Vector3(0, 0, 0);
    const acceleration = 0.02;
    const damping = 0.9;

    const itemGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const itemMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
    });
    const item = new THREE.Mesh(itemGeometry, itemMaterial);
    item.position.set(5, 0.3, 5);
    scene.add(item);

    const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
    const obstacleMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacle.position.set(-5, 0.5, -5);
    scene.add(obstacle);

    const animate = () => {
      requestAnimationFrame(animate);

      if (keys.w) velocity.z -= acceleration;
      if (keys.s) velocity.z += acceleration;
      if (keys.a) velocity.x -= acceleration;
      if (keys.d) velocity.x += acceleration;

      player.position.add(velocity);
      velocity.multiplyScalar(damping);

      updateTiles();

      camera.position.x = player.position.x;
      camera.position.z = player.position.z + 5;
      camera.lookAt(player.position);

      const playerBox = new THREE.Box3().setFromObject(player);
      const itemBox = new THREE.Box3().setFromObject(item);
      const obstacleBox = new THREE.Box3().setFromObject(obstacle);

      if (item.visible && playerBox.intersectsBox(itemBox)) {
        console.log('Item collected');
        item.visible = false;
      }

      if (playerBox.intersectsBox(obstacleBox)) {
        console.log('hit an obstacle');
        player.position.set(0, 0.5, 0);
        velocity.set(0, 0, 0);
        obstacle.material.color.setHex(Math.random() * 0xffffff);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return <div ref={mountRef}></div>;
}
