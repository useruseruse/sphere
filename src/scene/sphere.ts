// @ts-nocheck
/* =========================================================
   SPHERE — Three.js scene
   - 카메라/렌더러/조명/별/베이스구
   - 종목 노드 (rebuildNodes / applyStressVisuals / selectNode)
   - 인터랙션 (마우스 드래그·휠·터치·핀치줌·hover·click)
   - 애니메이션 루프, 뷰모드(sphere/cluster), 자동 회전
   - 상관관계 네트워크 라인용 networkGroup 노출
   ========================================================= */

import * as THREE from 'three';
import { riskColor, riskLabel } from '../core/pipeline.js';
import { t, getName, sectorLabel } from '../i18n.js';
import { STRESS_SCENARIOS } from '../advanced/metrics.js';

// ─────── lat/lng → 3D 좌표 (THREE.Vector3 의존) ───────
export function latLngToVec3(lat, lng, r){
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lng * Math.PI / 180;
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

// ─────── 모듈 상태 (initScene 에서 초기화) ───────
let canvas, mainEl, scene, camera, renderer;
let sphereGroup, dynamicGroup, networkGroup;
let nodeMeshes = [];
let tooltipEl;
let onSelectCb = (_ticker) => {};

let autoRotate = true;
let viewMode = 'sphere';
let selectedTicker = null;
let cameraTarget;
let raycaster, mouseV;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };
let rotation = { x: 0.2, y: 0 };
let _touchPrev = null;
let _pinchPrev = null;
let currentStress = null;
let initialized = false;

// ─────── 공개: 초기화 ───────
export function initScene({ onSelect } = {}){
  if (initialized) return;
  initialized = true;
  if (onSelect) onSelectCb = onSelect;

  canvas = document.getElementById('canvas');
  if (!canvas) throw new Error('[scene] #canvas element not found');
  mainEl = canvas.parentElement;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.06);

  camera = new THREE.PerspectiveCamera(50, mainEl.clientWidth / mainEl.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 4.2);
  camera.lookAt(0, 0, 0);
  cameraTarget = new THREE.Vector3(0, 0, 4.2);

  raycaster = new THREE.Raycaster();
  mouseV = new THREE.Vector2();

  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mainEl.clientWidth, mainEl.clientHeight);

  setupLighting();
  scene.add(makeStarfield());
  buildBaseSphere();

  tooltipEl = document.getElementById('tooltip');
  bindInteractions();

  animate();
  onResize();
}

function setupLighting(){
  scene.add(new THREE.AmbientLight(0x6080a0, 0.4));
  const keyLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
  keyLight.position.set(3, 4, 5); scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x7b61ff, 0.5);
  rimLight.position.set(-4, -2, -3); scene.add(rimLight);
}

function makeStarfield(){
  const g = new THREE.BufferGeometry();
  const pos = [];
  for (let i = 0; i < 800; i++){
    const r = 30 + Math.random() * 15;
    const ang = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    pos.push(r * Math.sin(p) * Math.cos(ang), r * Math.cos(p), r * Math.sin(p) * Math.sin(ang));
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color: 0x4a6080, size: 0.04, transparent: true, opacity: 0.5 });
  return new THREE.Points(g, m);
}

function buildBaseSphere(){
  sphereGroup = new THREE.Group();
  scene.add(sphereGroup);

  // 와이어프레임 베이스
  const baseGeo = new THREE.SphereGeometry(1, 36, 24);
  const baseMat = new THREE.MeshBasicMaterial({ color: 0x1a2540, wireframe: true, transparent: true, opacity: 0.18 });
  sphereGroup.add(new THREE.Mesh(baseGeo, baseMat));

  // 북반구(쿨톤) / 남반구(웜톤)
  const northGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const northMat = new THREE.MeshPhongMaterial({
    color: 0x0a1f3a, emissive: 0x051a30, transparent: true, opacity: 0.42,
    shininess: 90, side: THREE.DoubleSide
  });
  sphereGroup.add(new THREE.Mesh(northGeo, northMat));

  const southGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  const southMat = new THREE.MeshPhongMaterial({
    color: 0x2a1a08, emissive: 0x2a1500, transparent: true, opacity: 0.42,
    shininess: 90, side: THREE.DoubleSide
  });
  sphereGroup.add(new THREE.Mesh(southGeo, southMat));

  // 적도
  const equatorGeo = new THREE.RingGeometry(1.001, 1.005, 128);
  const equatorMat = new THREE.MeshBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
  const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
  equatorRing.rotation.x = Math.PI / 2;
  sphereGroup.add(equatorRing);

  // 위도선
  sphereGroup.add(makeLatLine(0, 0x00d4ff, 0.4));
  [60, 30, -30, -60].forEach(l => sphereGroup.add(makeLatLine(l, 0x335577, 0.15)));

  dynamicGroup = new THREE.Group();
  sphereGroup.add(dynamicGroup);

  networkGroup = new THREE.Group();
  sphereGroup.add(networkGroup);
}

function makeLatLine(lat, color, opacity){
  const pts = [];
  for (let lng = 0; lng <= 360; lng += 2){
    pts.push(latLngToVec3(lat, lng, 1.0));
  }
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

// ─────── 노드 (자산 마커) ───────
function disposeDynamic(){
  while (dynamicGroup.children.length){
    const c = dynamicGroup.children[0];
    dynamicGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  }
  nodeMeshes = [];
}

export function rebuildNodes(items){
  disposeDynamic();
  items.forEach(it => {
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const surfPos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, 1.0);

    // 돌출 라인
    const lineGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
    const lineMat = new THREE.LineBasicMaterial({ color: riskColor(it.risk_score), transparent: true, opacity: 0.4 });
    dynamicGroup.add(new THREE.Line(lineGeo, lineMat));

    // 노드 본체
    const radius = it.weight * 0.5 + 0.02;
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
    const color = new THREE.Color(riskColor(it.risk_score));
    const mat = new THREE.MeshPhongMaterial({
      color, emissive: color, emissiveIntensity: 0.6, shininess: 120, transparent: true, opacity: 0.85
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos);
    mesh.userData.item = it;
    dynamicGroup.add(mesh);

    // 헤일로
    const haloGeo = new THREE.SphereGeometry(radius * 1.6, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(pos);
    dynamicGroup.add(halo);

    nodeMeshes.push({ mesh, halo, item: it, baseColor: color, baseRadius: radius });
  });
  // 스트레스 시나리오 활성 시 즉시 재적용
  if (currentStress) applyStressVisuals(currentStress);
}

export function applyStressVisuals(stressKey){
  currentStress = stressKey;
  if (!nodeMeshes) return;
  if (!stressKey){
    // 원래 색상 복원
    nodeMeshes.forEach(n => {
      n.mesh.material.color.copy(n.baseColor);
      n.mesh.material.emissive.copy(n.baseColor);
      n.halo.material.color.copy(n.baseColor);
    });
    return;
  }
  const scn = STRESS_SCENARIOS[stressKey];
  if (!scn) return;
  nodeMeshes.forEach(n => {
    const shock = scn.shocks[n.item.sector] ?? scn.shocks.ETC ?? -0.30;
    let hex;
    if (shock > 0.05) hex = '#00E5A0';            // 이익
    else if (shock > -0.15) hex = '#FFD66B';      // 약한 손실
    else if (shock > -0.30) hex = '#FF8C42';      // 중간 손실
    else if (shock > -0.50) hex = '#FF4560';      // 큰 손실
    else hex = '#7B61FF';                          // 극단 손실
    const c = new THREE.Color(hex);
    n.mesh.material.color.copy(c);
    n.mesh.material.emissive.copy(c);
    n.halo.material.color.copy(c);
  });
}

// ─────── 선택 강조 ───────
export function selectNode(ticker){
  selectedTicker = ticker;
  nodeMeshes.forEach(n => {
    const isSel = n.item.ticker === ticker;
    n.mesh.material.opacity = ticker ? (isSel ? 1.0 : 0.3) : 0.85;
    n.halo.material.opacity = ticker ? (isSel ? 0.4 : 0.06) : 0.18;
    n.mesh.material.emissiveIntensity = isSel ? 1.2 : 0.6;
  });
}

export function clearNodeHighlight(){
  selectedTicker = null;
  nodeMeshes.forEach(n => {
    n.mesh.material.opacity = 0.85;
    n.halo.material.opacity = 0.18;
    n.mesh.material.emissiveIntensity = 0.6;
  });
}

// ─────── 뷰모드 (sphere / cluster) ───────
export function setViewMode(mode, items){
  viewMode = mode;
  animateView(mode, items);
}

function animateView(mode, items){
  if (mode === 'cluster'){
    const sectors = [...new Set(items.map(i => i.sector))];
    const ringR = 2.0;
    sectors.forEach((sec, si) => {
      const ang = (si / sectors.length) * Math.PI * 2;
      const center = new THREE.Vector3(Math.cos(ang) * ringR, Math.sin(ang) * ringR * 0.4, 0);
      const sectorItems = items.filter(i => i.sector === sec);
      sectorItems.forEach((it, k) => {
        const tt = (k / Math.max(sectorItems.length - 1, 1)) * Math.PI * 2;
        const lr = 0.35;
        const target = center.clone().add(new THREE.Vector3(Math.cos(tt) * lr, Math.sin(tt) * lr, 0));
        const node = nodeMeshes.find(n => n.item.ticker === it.ticker);
        if (node){
          animateMeshTo(node.mesh, target);
          animateMeshTo(node.halo, target);
        }
      });
    });
  } else {
    nodeMeshes.forEach(n => {
      const target = latLngToVec3(n.item.sphere_coord.lat, n.item.sphere_coord.lng, n.item.sphere_coord.r);
      animateMeshTo(n.mesh, target);
      animateMeshTo(n.halo, target);
    });
  }
}

function animateMeshTo(mesh, target){
  const start = mesh.position.clone();
  const dur = 800;
  const t0 = performance.now();
  function step(){
    const tt = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - tt, 3);
    mesh.position.lerpVectors(start, target, e);
    if (tt < 1) requestAnimationFrame(step);
  }
  step();
}

// ─────── 뷰 리셋 ───────
export function resetView(){
  rotation = { x: 0.2, y: 0 };
  cameraTarget.z = 4.2;
  autoRotate = true;
  viewMode = 'sphere';
  selectedTicker = null;
  nodeMeshes.forEach(n => {
    n.mesh.material.opacity = 0.85;
    n.halo.material.opacity = 0.18;
    n.mesh.material.emissiveIntensity = 0.6;
  });
}

// ─────── 자동 회전 ───────
export function toggleAutoRotate(){
  autoRotate = !autoRotate;
  return autoRotate;
}
export function setAutoRotate(on){ autoRotate = on; }
export function getAutoRotate(){ return autoRotate; }
export function getViewMode(){ return viewMode; }
export function getSelectedTicker(){ return selectedTicker; }

// ─────── 인터랙션 바인딩 ───────
function bindInteractions(){
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 200));

  // 마우스 드래그 회전
  canvas.addEventListener('mousedown', e => {
    isDragging = true;
    prevMouse = { x: e.clientX, y: e.clientY };
    autoRotate = false;
    setControlActive('rotate', false);
  });
  window.addEventListener('mouseup', () => isDragging = false);
  window.addEventListener('mousemove', e => {
    if (isDragging){
      const dx = e.clientX - prevMouse.x, dy = e.clientY - prevMouse.y;
      rotation.y += dx * 0.005;
      rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotation.x + dy * 0.005));
      prevMouse = { x: e.clientX, y: e.clientY };
    }
  });
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + e.deltaY * 0.002));
  }, { passive: false });

  // 모바일 터치 — 1손가락 회전, 2손가락 핀치줌
  canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1){
      _touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      autoRotate = false;
      setControlActive('rotate', false);
    } else if (e.touches.length === 2){
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      _pinchPrev = Math.sqrt(dx * dx + dy * dy);
    }
  }, { passive: true });
  canvas.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && _touchPrev){
      e.preventDefault();
      const x = e.touches[0].clientX, y = e.touches[0].clientY;
      rotation.y += (x - _touchPrev.x) * 0.006;
      rotation.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, rotation.x + (y - _touchPrev.y) * 0.006));
      _touchPrev = { x, y };
    } else if (e.touches.length === 2 && _pinchPrev != null){
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = (_pinchPrev - dist) * 0.012;
      cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + delta));
      _pinchPrev = dist;
    }
  }, { passive: false });
  canvas.addEventListener('touchend', () => {
    _touchPrev = null;
    _pinchPrev = null;
  }, { passive: true });
  canvas.style.touchAction = 'none';

  // hover 툴팁
  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseV.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseV.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseV, camera);
    const hits = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));
    if (hits.length){
      const it = hits[0].object.userData.item;
      if (tooltipEl){
        tooltipEl.style.display = 'block';
        tooltipEl.style.left = (e.clientX - rect.left + 12) + 'px';
        tooltipEl.style.top = (e.clientY - rect.top + 12) + 'px';
        tooltipEl.innerHTML = `
          <div class="tooltip-name" style="color:${riskColor(it.risk_score)}">${getName(it)}</div>
          <div class="tooltip-row"><span>${it.ticker}</span><b>${t('tooltipQtyWeight', (it.quantity ?? 1), (it.weight * 100).toFixed(1))}</b></div>
          <div class="tooltip-row"><span>${t('tooltipValue')}</span><b>${Math.round(it.market_value || 0).toLocaleString()}</b></div>
          <div class="tooltip-row"><span>${t('tooltipRisk')}</span><b style="color:${riskColor(it.risk_score)}">${it.risk_score} · ${riskLabel(it.risk_score)}</b></div>
          <div class="tooltip-row"><span>${t('tooltipReturn')}</span><b class="${it.return_pct >= 0 ? 'pos' : 'neg'}">${(it.return_pct * 100).toFixed(2)}%</b></div>
          <div class="tooltip-row"><span>${t('tooltipSector')}</span><b>${sectorLabel(it.sector)}</b></div>
        `;
      }
      canvas.style.cursor = 'pointer';
    } else {
      if (tooltipEl) tooltipEl.style.display = 'none';
      canvas.style.cursor = 'grab';
    }
  });

  // 클릭 → onSelect 콜백
  canvas.addEventListener('click', e => {
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    mouseV.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseV.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouseV, camera);
    const hits = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));
    if (hits.length){
      onSelectCb(hits[0].object.userData.item.ticker);
    }
  });
}

function setControlActive(name, on){
  const btn = document.querySelector(`[data-mode=${name}]`);
  if (btn) btn.classList.toggle('active', on);
}

// ─────── 애니메이션 루프 ───────
function animate(){
  requestAnimationFrame(animate);
  if (autoRotate && !isDragging) rotation.y += 0.0028;
  sphereGroup.rotation.x = rotation.x;
  sphereGroup.rotation.y = rotation.y;

  // 펄스: 고위험·집중 노드
  const phase = performance.now() * 0.003;
  nodeMeshes.forEach(n => {
    if (n.item.risk_score > 85){
      const s = 1 + Math.sin(phase) * 0.15;
      n.halo.scale.setScalar(s);
    }
    if (n.item.weight > 0.4){
      const s = 1 + Math.sin(phase * 1.5) * 0.2;
      n.halo.scale.setScalar(s);
    }
  });

  // 카메라 줌 보간
  camera.position.z += (cameraTarget.z - camera.position.z) * 0.08;
  renderer.render(scene, camera);
}

// ─────── 리사이즈 ───────
export function onResize(){
  let w = mainEl.clientWidth, h = mainEl.clientHeight;
  if (!w || !h){
    const isMobile = window.innerWidth <= 768;
    if (isMobile){
      w = window.innerWidth;
      h = Math.round(window.innerHeight * 0.5);
    } else {
      w = window.innerWidth - 320 - 360;
      h = window.innerHeight - 56;
    }
  }
  if (w < 100) w = 100;
  if (h < 100) h = 100;
  renderer.setSize(w, h, true);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

// ─────── 상관관계 네트워크 라인 ───────
export function clearNetworkLines(){
  while (networkGroup.children.length){
    const c = networkGroup.children[0];
    networkGroup.remove(c);
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
  }
}

export function getNetworkGroup(){ return networkGroup; }
export function getNodeMeshes(){ return nodeMeshes; }
