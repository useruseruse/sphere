/* =========================================================
   SPHERE — Three.js Scene
   3D 구체 렌더링 · 노드 빌드 · 인터랙션 · 애니메이션
   THREE는 lib/three.min.js에서 전역으로 로드됨
   ========================================================= */

import { latLngToVec3, riskColor, riskLabel } from './pipeline.js';

let canvas, mainEl, scene, camera, renderer;
let sphereGroup, dynamicGroup;
let nodeMeshes = [];
let autoRotate = true, viewMode = 'sphere';
let selectedTicker = null;
let cameraTarget;
let raycaster, mouseV;
let isDragging = false, prevMouse = {x:0,y:0};
let rotation = { x: 0.2, y: 0 };
let onSelectCallback = () => {};

export function initScene(opts = {}){
  onSelectCallback = opts.onSelect || (()=>{});
  canvas = document.getElementById('canvas');
  mainEl = canvas.parentElement;

  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070d, 0.06);

  camera = new THREE.PerspectiveCamera(50, mainEl.clientWidth/mainEl.clientHeight, 0.1, 100);
  camera.position.set(0, 0.6, 4.2);
  cameraTarget = new THREE.Vector3(0, 0, 4.2);

  renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mainEl.clientWidth, mainEl.clientHeight);

  setupLighting();
  scene.add(makeStarfield());

  sphereGroup = new THREE.Group();
  scene.add(sphereGroup);
  dynamicGroup = new THREE.Group();
  sphereGroup.add(dynamicGroup);

  buildBaseSphere();

  raycaster = new THREE.Raycaster();
  mouseV = new THREE.Vector2();

  bindInteractions();
  bindResize();
  bindControls();
  startAnimationLoop();
  // 첫 사이즈 보정
  setTimeout(onResize, 50);
  setTimeout(onResize, 300);
}

function setupLighting(){
  scene.add(new THREE.AmbientLight(0x6080a0, 0.4));
  const keyLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
  keyLight.position.set(3,4,5); scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x7b61ff, 0.5);
  rimLight.position.set(-4,-2,-3); scene.add(rimLight);
}

function makeStarfield(){
  const g = new THREE.BufferGeometry();
  const pos = [];
  for (let i=0;i<800;i++){
    const r = 30 + Math.random()*15;
    const t = Math.random()*Math.PI*2;
    const p = Math.acos(2*Math.random()-1);
    pos.push(r*Math.sin(p)*Math.cos(t), r*Math.cos(p), r*Math.sin(p)*Math.sin(t));
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ color:0x4a6080, size:0.04, transparent:true, opacity:0.5 });
  return new THREE.Points(g, m);
}

function buildBaseSphere(){
  // 와이어프레임
  const baseGeo = new THREE.SphereGeometry(1, 36, 24);
  const baseMat = new THREE.MeshBasicMaterial({ color:0x1a2540, wireframe:true, transparent:true, opacity:0.18 });
  sphereGroup.add(new THREE.Mesh(baseGeo, baseMat));

  // 북반구 (성장주, 쿨톤)
  const northGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI*2, 0, Math.PI/2);
  const northMat = new THREE.MeshPhongMaterial({
    color:0x0a1f3a, emissive:0x051a30, transparent:true, opacity:0.42, shininess:90, side:THREE.DoubleSide
  });
  sphereGroup.add(new THREE.Mesh(northGeo, northMat));

  // 남반구 (가치주, 웜톤)
  const southGeo = new THREE.SphereGeometry(0.998, 64, 32, 0, Math.PI*2, Math.PI/2, Math.PI/2);
  const southMat = new THREE.MeshPhongMaterial({
    color:0x2a1a08, emissive:0x2a1500, transparent:true, opacity:0.42, shininess:90, side:THREE.DoubleSide
  });
  sphereGroup.add(new THREE.Mesh(southGeo, southMat));

  // 적도 강조
  const equatorGeo = new THREE.RingGeometry(1.001, 1.005, 128);
  const equatorMat = new THREE.MeshBasicMaterial({ color:0x00d4ff, transparent:true, opacity:0.5, side:THREE.DoubleSide });
  const equatorRing = new THREE.Mesh(equatorGeo, equatorMat);
  equatorRing.rotation.x = Math.PI/2;
  sphereGroup.add(equatorRing);

  // 위도선
  sphereGroup.add(makeLatLine(0, 0x00d4ff, 0.4));
  [60, 30, -30, -60].forEach(l => sphereGroup.add(makeLatLine(l, 0x335577, 0.15)));
}

function makeLatLine(lat, color, opacity){
  const pts = [];
  for (let lng=0; lng<=360; lng+=2) pts.push(latLngToVec3(lat, lng, 1.0));
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  return new THREE.Line(g, new THREE.LineBasicMaterial({ color, transparent:true, opacity }));
}

// ---------- Dynamic Nodes (rebuild on portfolio change) ----------
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
  selectedTicker = null;
  items.forEach(it=>{
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const surfPos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, 1.0);

    // 돌출 라인
    const lineGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
    const lineMat = new THREE.LineBasicMaterial({ color: riskColor(it.risk_score), transparent:true, opacity:0.4 });
    dynamicGroup.add(new THREE.Line(lineGeo, lineMat));

    // 노드 본체
    const radius = it.weight * 0.5 + 0.02;
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
    const color = new THREE.Color(riskColor(it.risk_score));
    const mat = new THREE.MeshPhongMaterial({
      color, emissive:color, emissiveIntensity:0.6, shininess:120, transparent:true, opacity:0.85
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos);
    mesh.userData.item = it;
    dynamicGroup.add(mesh);

    // 헤일로
    const haloGeo = new THREE.SphereGeometry(radius*1.6, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.18 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.copy(pos);
    dynamicGroup.add(halo);

    nodeMeshes.push({ mesh, halo, item: it, baseColor: color, baseRadius: radius });
  });
  // 뷰 모드 적용
  if (viewMode === 'cluster') applyClusterLayout();
}

export function selectNode(ticker){
  selectedTicker = ticker;
  nodeMeshes.forEach(n=>{
    const isSel = n.item.ticker === ticker;
    n.mesh.material.opacity = selectedTicker ? (isSel ? 1.0 : 0.3) : 0.85;
    n.halo.material.opacity = selectedTicker ? (isSel ? 0.4 : 0.06) : 0.18;
    n.mesh.material.emissiveIntensity = isSel ? 1.2 : 0.6;
  });
}

export function clearSelection(){
  selectedTicker = null;
  nodeMeshes.forEach(n=>{
    n.mesh.material.opacity = 0.85;
    n.halo.material.opacity = 0.18;
    n.mesh.material.emissiveIntensity = 0.6;
  });
}

// ---------- 인터랙션 ----------
function bindInteractions(){
  canvas.addEventListener('mousedown', e=>{
    isDragging=true;
    prevMouse={x:e.clientX, y:e.clientY};
    autoRotate=false;
    setControlActive('rotate', false);
  });
  window.addEventListener('mouseup', ()=> isDragging=false);
  window.addEventListener('mousemove', e=>{
    if (isDragging){
      const dx = e.clientX-prevMouse.x, dy = e.clientY-prevMouse.y;
      rotation.y += dx*0.005;
      rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotation.x + dy*0.005));
      prevMouse = { x:e.clientX, y:e.clientY };
    }
  });
  canvas.addEventListener('wheel', e=>{
    e.preventDefault();
    cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + e.deltaY*0.002));
  }, { passive:false });

  // 호버 툴팁
  const tooltip = document.getElementById('tooltip');
  canvas.addEventListener('mousemove', e=>{
    const rect = canvas.getBoundingClientRect();
    mouseV.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
    mouseV.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
    raycaster.setFromCamera(mouseV, camera);
    const hits = raycaster.intersectObjects(nodeMeshes.map(n=>n.mesh));
    if (hits.length){
      const it = hits[0].object.userData.item;
      tooltip.style.display = 'block';
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top = (e.clientY - rect.top + 12) + 'px';
      tooltip.innerHTML = `
        <div class="tooltip-name" style="color:${riskColor(it.risk_score)}">${it.name}</div>
        <div class="tooltip-row"><span>${it.ticker}</span><b>${(it.quantity ?? 1).toLocaleString()}주 · ${(it.weight*100).toFixed(1)}%</b></div>
        <div class="tooltip-row"><span>평가금액</span><b>${Math.round(it.market_value || 0).toLocaleString()}</b></div>
        <div class="tooltip-row"><span>리스크</span><b style="color:${riskColor(it.risk_score)}">${it.risk_score} · ${riskLabel(it.risk_score)}</b></div>
        <div class="tooltip-row"><span>수익률</span><b class="${it.return_pct>=0?'pos':'neg'}">${(it.return_pct*100).toFixed(2)}%</b></div>
        <div class="tooltip-row"><span>섹터</span><b>${it.sector}</b></div>
      `;
      canvas.style.cursor = 'pointer';
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'grab';
    }
  });

  // 클릭 선택
  canvas.addEventListener('click', e=>{
    if (isDragging) return;
    const rect = canvas.getBoundingClientRect();
    mouseV.x = ((e.clientX-rect.left)/rect.width)*2 - 1;
    mouseV.y = -((e.clientY-rect.top)/rect.height)*2 + 1;
    raycaster.setFromCamera(mouseV, camera);
    const hits = raycaster.intersectObjects(nodeMeshes.map(n=>n.mesh));
    if (hits.length){
      const ticker = hits[0].object.userData.item.ticker;
      onSelectCallback(ticker);
    }
  });
}

function bindResize(){
  window.addEventListener('resize', onResize);
  if (window.ResizeObserver){
    new ResizeObserver(onResize).observe(mainEl);
  }
}

function onResize(){
  let w = mainEl.clientWidth, h = mainEl.clientHeight;
  if (!w || !h){ w = window.innerWidth - 320 - 360; h = window.innerHeight - 56; }
  if (w < 100) w = 100;
  if (h < 100) h = 100;
  renderer.setSize(w, h, true);
  camera.aspect = w/h;
  camera.updateProjectionMatrix();
}

// ---------- 컨트롤 버튼 ----------
function bindControls(){
  document.querySelectorAll('.ctrl-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const m = btn.dataset.mode;
      if (m === 'rotate'){ autoRotate = !autoRotate; btn.classList.toggle('active', autoRotate); return; }
      if (m === 'reset'){ resetView(); return; }
      if (m === 'sphere' || m === 'cluster'){
        viewMode = m;
        document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b=> b.classList.toggle('active', b.dataset.mode===m));
        document.getElementById('viewMode').textContent = m === 'sphere' ? 'SPHERE VIEW' : 'CLUSTER VIEW';
        animateView(m);
      }
    });
  });
}

function setControlActive(name, on){
  const btn = document.querySelector(`[data-mode=${name}]`);
  if (btn) btn.classList.toggle('active', on);
}

function resetView(){
  rotation = { x:0.2, y:0 };
  cameraTarget.z = 4.2;
  autoRotate = true;
  setControlActive('rotate', true);
  clearSelection();
  viewMode = 'sphere';
  document.querySelectorAll('[data-mode=sphere],[data-mode=cluster]').forEach(b=> b.classList.toggle('active', b.dataset.mode==='sphere'));
  document.getElementById('viewMode').textContent = 'SPHERE VIEW';
  animateView('sphere');
  // 외부 통지
  onSelectCallback(null);
}

function animateView(mode){
  if (mode === 'cluster'){ applyClusterLayout(); }
  else {
    nodeMeshes.forEach(n=>{
      const t = latLngToVec3(n.item.sphere_coord.lat, n.item.sphere_coord.lng, n.item.sphere_coord.r);
      animateMeshTo(n.mesh, t);
      animateMeshTo(n.halo, t);
    });
  }
}

function applyClusterLayout(){
  const sectors = [...new Set(nodeMeshes.map(n=>n.item.sector))];
  const ringR = 2.0;
  sectors.forEach((sec, si)=>{
    const ang = (si/sectors.length)*Math.PI*2;
    const center = new THREE.Vector3(Math.cos(ang)*ringR, Math.sin(ang)*ringR*0.4, 0);
    const items = nodeMeshes.filter(n=>n.item.sector===sec);
    items.forEach((node, k)=>{
      const t = (k/Math.max(items.length-1,1)) * Math.PI*2;
      const lr = 0.35;
      const target = center.clone().add(new THREE.Vector3(Math.cos(t)*lr, Math.sin(t)*lr, 0));
      animateMeshTo(node.mesh, target);
      animateMeshTo(node.halo, target);
    });
  });
}

function animateMeshTo(mesh, target){
  const start = mesh.position.clone();
  const dur = 800;
  const t0 = performance.now();
  function step(){
    const t = Math.min(1, (performance.now()-t0)/dur);
    const e = 1 - Math.pow(1-t, 3);
    mesh.position.lerpVectors(start, target, e);
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}

// ---------- 애니메이션 루프 ----------
function startAnimationLoop(){
  function animate(){
    requestAnimationFrame(animate);
    if (autoRotate && !isDragging) rotation.y += 0.0028;
    sphereGroup.rotation.x = rotation.x;
    sphereGroup.rotation.y = rotation.y;

    // 펄스 애니메이션 (고위험·집중 종목)
    const t = performance.now()*0.003;
    nodeMeshes.forEach(n=>{
      if (n.item.risk_score > 85){
        n.halo.scale.setScalar(1 + Math.sin(t)*0.15);
      }
      if (n.item.weight > 0.4){
        n.halo.scale.setScalar(1 + Math.sin(t*1.5)*0.2);
      }
    });

    camera.position.z += (cameraTarget.z - camera.position.z) * 0.08;
    renderer.render(scene, camera);
  }
  animate();
}
