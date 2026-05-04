# 03. 3D 시각화 — Three.js와 구체 매핑

## 핵심 아이디어

> "포트폴리오의 위험을 평면 차트가 아닌 **입체 구체**로 본다"

종목 하나를 구의 표면 위 한 점으로 매핑합니다. 좌표는 3개의 실세계 의미를 가집니다:

- **위도(lat)** = 섹터 → 위쪽은 성장주, 아래는 가치주
- **경도(lng)** = 같은 섹터 안에서의 비중 순서
- **반지름(r)** = 표면(1.0) + 위험점수에 비례한 돌출

위험이 높은 종목은 표면에서 더 튀어나옵니다. 모든 종목이 비슷한 위험이면 노드들이 같은 거리에 있어 **완벽한 구체**가 됩니다. 한 종목만 위험이 크면 그쪽이 뾰족하게 튀어나와 **일그러진 모양**이 됩니다.

---

## 목차

1. [Three.js 기본 30분 입문](#1-threejs-기본-30분-입문)
2. [좌표계 매핑 — 위도·경도·반지름](#2-좌표계-매핑)
3. [섹터 → 위도 분배 알고리즘](#3-섹터--위도-분배)
4. [노드 렌더링](#4-노드-렌더링)
5. [상관관계 네트워크 라인](#5-상관관계-네트워크)
6. [클러스터 모드 — 분리 애니메이션](#6-클러스터-모드)
7. [상호작용 — 마우스·터치·레이캐스팅](#7-상호작용)
8. [성능 최적화](#8-성능-최적화)

---

## 1. Three.js 기본 30분 입문

Three.js는 WebGL을 추상화한 JavaScript 3D 라이브러리입니다. 핵심 4가지만 알면 됩니다:

### Scene · Camera · Renderer

```javascript
const scene = new THREE.Scene();           // 1. 무대
const camera = new THREE.PerspectiveCamera(50, w/h, 0.1, 100); // 2. 카메라 (FOV 50°)
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
renderer.setSize(w, h);
```

- `Scene`: 모든 3D 객체가 들어가는 가상 공간
- `Camera`: 어디서 어디를 바라보는가. `PerspectiveCamera(fov, aspect, near, far)`
  - FOV(field of view) 50° = 사람 시야와 비슷
  - aspect = 가로/세로 비율
  - near/far = 렌더링 거리 (0.1~100 단위)
- `Renderer`: 실제로 화면에 그리는 엔진

### Mesh = Geometry + Material

```javascript
const geometry = new THREE.SphereGeometry(1.0, 32, 24);  // 형태
const material = new THREE.MeshPhongMaterial({           // 재질
  color: 0x00d4ff,
  emissive: 0x00d4ff,
  emissiveIntensity: 0.6
});
const mesh = new THREE.Mesh(geometry, material);          // 결합
scene.add(mesh);
```

- `Geometry`: 형태 (Sphere, Box, Plane, BufferGeometry 등)
- `Material`: 재질 (MeshBasic, MeshPhong, MeshStandard, LineBasic 등)
  - `MeshPhong`: Phong shading. emissive(자체 발광) + 반사
  - `LineBasic`: 선
- `Mesh`: 형태 + 재질 = 실제 표시 가능한 객체

### Light

```javascript
scene.add(new THREE.AmbientLight(0x6080a0, 0.4));        // 전체 환경광
const keyLight = new THREE.DirectionalLight(0x00d4ff, 0.8);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);                                       // 방향성 광원
```

emissive material을 쓰면 빛 없이도 보이지만, 입체감을 위해 약한 환경광 + 강조 directional light 조합.

### 렌더 루프

```javascript
function animate(){
  requestAnimationFrame(animate);
  // 회전, 보간 등 매 프레임 갱신
  sphereGroup.rotation.y += 0.005;
  renderer.render(scene, camera);
}
animate();
```

브라우저가 60fps로 호출. 매 프레임 카메라 위치, 객체 회전 등 갱신 후 `render`.

---

## 2. 좌표계 매핑

### 위도-경도 → 3D 직교좌표 변환

지구본을 떠올리면 됩니다. 위도(0~90°N, 0~90°S)와 경도(0~360°)로 표면 위 한 점을 지정. SPHERE는 이를 그대로 차용:

```javascript
function latLngToVec3(lat, lng, r){
  const phi = (90 - lat) * Math.PI / 180;     // 극각 (북극=0, 남극=π)
  const theta = lng * Math.PI / 180;           // 방위각
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),       // x
    r * Math.cos(phi),                          // y (위 ↔ 아래)
    r * Math.sin(phi) * Math.sin(theta)        // z
  );
}
```

**왜 phi = 90 - lat?**
- 수학에서 구면좌표는 보통 phi를 천장각 (0=북극, π=남극)으로 정의
- 지리적 위도는 0=적도, 90=북극이라 변환 필요

**3D 좌표계**:
- x: 좌(-) 우(+)
- y: 아래(-) 위(+)
- z: 뒤(-) 앞(+)
- 카메라는 (0, 0, 4.2)에 위치해 원점을 바라봄

### r (반지름)의 의미

위험 점수에 비례한 돌출:

$$r = 1.0 + \frac{\text{RiskScore}}{100} \times 0.5$$

- 위험 0: r = 1.0 (표면)
- 위험 50: r = 1.25
- 위험 100: r = 1.5

기본 구(반지름 1.0)는 시각적 anchor — 노드가 "표면에서 얼마나 튀어나왔나"를 직관적으로 보여줍니다.

---

## 3. 섹터 → 위도 분배

### SECTOR_DEF 테이블

각 섹터는 위도 범위를 가집니다 (북반구 = 성장, 남반구 = 가치):

```javascript
const SECTOR_DEF = {
  IT:        { lat_min:60,  lat_max:80,  base_risk:0.75, ... },  // 북반구 위쪽
  BIO:       { lat_min:40,  lat_max:60,  base_risk:0.85, ... },
  AUTO:      { lat_min:20,  lat_max:40,  base_risk:0.60, ... },
  GLOBAL_ETF:{ lat_min:10,  lat_max:20,  base_risk:0.40, ... },  // 적도 근처
  INDUSTRIAL:{ lat_min:-20, lat_max:0,   base_risk:0.55, ... },
  ENERGY:    { lat_min:-40, lat_max:-20, base_risk:0.65, ... },
  FIN:       { lat_min:-60, lat_max:-40, base_risk:0.50, ... },
  CONSUMER:  { lat_min:-80, lat_max:-60, base_risk:0.45, ... },  // 남반구 깊은 곳
  REALESTATE:{ lat_min:0,   lat_max:20,  base_risk:0.50, ... },
  ETC:       { lat_min:-10, lat_max:10,  base_risk:0.60, ... }
};
```

### mapSphereCoords 알고리즘

```javascript
function mapSphereCoords(items){
  const bySector = {};
  items.forEach(i => {
    if (!bySector[i.sector]) bySector[i.sector] = [];
    bySector[i.sector].push(i);
  });

  let lngOffset = 0;
  Object.keys(bySector).forEach((sec, si) => {
    const arr = bySector[sec].sort((a,b) => b.weight - a.weight);  // 비중 큰 순
    const def = SECTOR_DEF[sec];
    const latMin = def.lat_min, latMax = def.lat_max;

    arr.forEach((it, k) => {
      const t = arr.length === 1 ? 0.5 : k / (arr.length - 1);
      const lat = latMin + t * (latMax - latMin);                   // 균등 분배
      const lng = (lngOffset + k * (360 / Math.max(arr.length, 1)) * 0.4) % 360;
      const r = 1.0 + (it.risk_score / 100) * 0.5;
      it.sphere_coord = { lat, lng, r };
    });

    lngOffset += 360 / Object.keys(bySector).length;                 // 섹터별 영역 분리
  });

  return items;
}
```

### 알고리즘 의도

1. **섹터별 그룹화**: 같은 섹터 종목이 가까이 모임
2. **비중 큰 순 정렬**: 큰 종목이 lat_min 쪽 (위쪽), 작은 게 lat_max 쪽
3. **위도 균등 분배**: 한 섹터 안에서 종목들이 위도 범위에 고르게 배치
4. **경도 분리**: 섹터별로 다른 경도 영역 점유 → 시각적으로 구분
5. **r 돌출**: 리스크 점수에 비례

### 시각적 효과

- **균형 잡힌 포트폴리오**: 모든 위도(섹터)에 종목 분포 → 구체에 가까움
- **IT 100%**: 북반구 한쪽만 점들 → 위쪽이 빵빵하고 아래는 텅 빔 (한쪽 일그러진 모양)
- **고위험 종목 1개**: 그 점만 r=1.5로 돌출 → 그쪽으로 뾰족 튀어나옴

---

## 4. 노드 렌더링

### rebuildNodes()

```javascript
let nodeMeshes = [];
const dynamicGroup = new THREE.Group();
sphereGroup.add(dynamicGroup);

function rebuildNodes(){
  disposeDynamic();              // 이전 노드 메모리 해제
  nodeMeshes = [];

  ITEMS.forEach(it => {
    const pos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, it.sphere_coord.r);
    const surfPos = latLngToVec3(it.sphere_coord.lat, it.sphere_coord.lng, 1.0);

    // 1. 돌출 라인 (표면 → 노드 위치)
    const lineGeo = new THREE.BufferGeometry().setFromPoints([surfPos, pos]);
    const lineMat = new THREE.LineBasicMaterial({
      color: riskColor(it.risk_score), transparent:true, opacity:0.4
    });
    dynamicGroup.add(new THREE.Line(lineGeo, lineMat));

    // 2. 노드 본체 (구)
    const radius = it.weight * 0.5 + 0.02;     // 비중에 비례
    const sphereGeo = new THREE.SphereGeometry(radius, 24, 18);
    const color = new THREE.Color(riskColor(it.risk_score));
    const mat = new THREE.MeshPhongMaterial({
      color, emissive:color, emissiveIntensity:0.6, shininess:120,
      transparent:true, opacity:0.85
    });
    const mesh = new THREE.Mesh(sphereGeo, mat);
    mesh.position.copy(pos);
    mesh.userData.item = it;
    dynamicGroup.add(mesh);

    // 3. 글로 헤일로 (반투명 큰 구)
    const haloGeo = new THREE.SphereGeometry(radius * 1.6, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.18 });
    const halo = new THREE.Mesh(haloGeo, halo);
    halo.position.copy(pos);
    dynamicGroup.add(halo);

    nodeMeshes.push({ mesh, halo, item: it, baseColor: color, baseRadius: radius });
  });
}
```

### 메모리 관리 — disposeDynamic()

Three.js는 GPU 메모리를 명시적으로 해제해야 합니다:

```javascript
function disposeDynamic(){
  while (dynamicGroup.children.length){
    const c = dynamicGroup.children[0];
    if (c.geometry) c.geometry.dispose();
    if (c.material) c.material.dispose();
    dynamicGroup.remove(c);
  }
}
```

이걸 안 하면 종목 추가/삭제 반복 시 메모리 누수 → 브라우저 점점 느려짐.

### 위험별 색상 매핑

```javascript
function riskColor(score){
  if (score < 30) return '#00E5A0';   // SAFE
  if (score < 55) return '#00D4FF';   // MODERATE
  if (score < 75) return '#FF8C42';   // CAUTION
  if (score < 90) return '#FF4560';   // HIGH
  return '#7B61FF';                    // EXTREME
}
```

---

## 5. 상관관계 네트워크

NETWORK 모드 활성 시, 종목 간 상관계수가 높은 쌍을 선으로 연결합니다.

### buildCorrelationLines()

```javascript
function buildCorrelationLines(){
  disposeNetworkLines();
  if (!networkMode) return;

  for (let i = 0; i < ITEMS.length; i++){
    for (let j = i + 1; j < ITEMS.length; j++){
      const rho = pairwiseCorr(ITEMS[i], ITEMS[j]);
      if (rho < 0.5) continue;     // 약한 상관은 표시 안 함

      const a = latLngToVec3(ITEMS[i].sphere_coord.lat, ITEMS[i].sphere_coord.lng, ITEMS[i].sphere_coord.r);
      const b = latLngToVec3(ITEMS[j].sphere_coord.lat, ITEMS[j].sphere_coord.lng, ITEMS[j].sphere_coord.r);

      // 강도별 색상
      let hex;
      if (rho >= 0.85)      hex = 0xFF4560;   // 강 (빨강)
      else if (rho >= 0.70) hex = 0xFF8C42;   // 중 (주황)
      else                  hex = 0x00D4FF;   // 약 (시안)

      const geo = new THREE.BufferGeometry().setFromPoints([a, b]);
      const mat = new THREE.LineBasicMaterial({ color: hex, transparent:true, opacity: rho });
      networkGroup.add(new THREE.Line(geo, mat));
    }
  }
}
```

### 시각적 의미

- 빨간 굵은 선이 많다 = 비슷한 종목이 많다 = 분산효과 약함
- 시안 선만 듬성듬성 = 잘 분산됨

이건 **DR(Diversification Ratio)을 시각적으로 표현**한 것입니다.

---

## 6. 클러스터 모드

`animateView('cluster')` 호출 시 노드들이 섹터별로 작은 클러스터로 모입니다.

```javascript
function animateView(mode){
  if (mode === 'cluster'){
    const sectors = [...new Set(ITEMS.map(i => i.sector))];
    const ringR = 2.0;
    sectors.forEach((sec, si) => {
      const ang = (si / sectors.length) * Math.PI * 2;
      const center = new THREE.Vector3(Math.cos(ang) * ringR, Math.sin(ang) * ringR * 0.4, 0);
      const items = ITEMS.filter(i => i.sector === sec);
      items.forEach((it, k) => {
        const t = (k / Math.max(items.length - 1, 1)) * Math.PI * 2;
        const lr = 0.35;
        const target = center.clone().add(
          new THREE.Vector3(Math.cos(t) * lr, Math.sin(t) * lr, 0)
        );
        const node = nodeMeshes.find(n => n.item.ticker === it.ticker);
        animateMeshTo(node.mesh, target);
        animateMeshTo(node.halo, target);
      });
    });
  } else {
    // sphere mode — 다시 구 표면으로
    nodeMeshes.forEach(n => {
      const target = latLngToVec3(n.item.sphere_coord.lat, n.item.sphere_coord.lng, n.item.sphere_coord.r);
      animateMeshTo(n.mesh, target);
      animateMeshTo(n.halo, target);
    });
  }
}
```

### Easing 보간

```javascript
function animateMeshTo(mesh, target){
  const start = mesh.position.clone();
  const dur = 800;
  const t0 = performance.now();
  function step(){
    const t = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - t, 3);   // ease-out cubic
    mesh.position.lerpVectors(start, target, e);
    if (t < 1) requestAnimationFrame(step);
  }
  step();
}
```

`ease-out cubic` 곡선으로 처음 빠르고 끝에 부드럽게 멈춤.

---

## 7. 상호작용

### 마우스 회전

```javascript
canvas.addEventListener('mousedown', e => {
  isDragging = true;
  prevMouse = { x: e.clientX, y: e.clientY };
  autoRotate = false;
});
window.addEventListener('mousemove', e => {
  if (isDragging){
    const dx = e.clientX - prevMouse.x;
    const dy = e.clientY - prevMouse.y;
    rotation.y += dx * 0.005;
    rotation.x = Math.max(-Math.PI/2.2, Math.min(Math.PI/2.2, rotation.x + dy * 0.005));
    prevMouse = { x: e.clientX, y: e.clientY };
  }
});
window.addEventListener('mouseup', () => isDragging = false);

// 매 프레임에서 적용
sphereGroup.rotation.x = rotation.x;
sphereGroup.rotation.y = rotation.y;
```

### 휠 줌

```javascript
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  cameraTarget.z = Math.max(2.5, Math.min(8, cameraTarget.z + e.deltaY * 0.002));
}, { passive: false });

// 카메라 보간
camera.position.z += (cameraTarget.z - camera.position.z) * 0.08;
```

`cameraTarget.z`는 목표값, `camera.position.z`는 매 프레임 8%씩 따라가서 부드럽게 줌.

### 터치 (모바일)

```javascript
let _touchPrev = null, _pinchPrev = null;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1){
    _touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2){
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    _pinchPrev = Math.sqrt(dx*dx + dy*dy);
  }
});
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 1 && _touchPrev){
    e.preventDefault();
    // 1손가락 회전
    rotation.y += (e.touches[0].clientX - _touchPrev.x) * 0.006;
    rotation.x = clamp(rotation.x + (e.touches[0].clientY - _touchPrev.y) * 0.006, -π/2.2, π/2.2);
    _touchPrev = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else if (e.touches.length === 2 && _pinchPrev != null){
    e.preventDefault();
    // 2손가락 핀치 줌
    const dist = Math.sqrt(...);
    cameraTarget.z = clamp(cameraTarget.z + (_pinchPrev - dist) * 0.012, 2.5, 8);
    _pinchPrev = dist;
  }
}, { passive: false });
```

`canvas.style.touchAction = 'none'` 으로 페이지 스크롤과 분리.

### 노드 클릭 — Raycasting

3D 공간의 점이 어느 메쉬에 닿는지 계산:

```javascript
const raycaster = new THREE.Raycaster();
const mouseV = new THREE.Vector2();

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  mouseV.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;    // -1 ~ 1
  mouseV.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseV, camera);
  const hits = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));
  if (hits.length){
    selectAsset(hits[0].object.userData.item.ticker);
  }
});
```

마우스 좌표 → NDC(-1~1) → 카메라에서 광선 발사 → 첫 교차 메쉬 = 클릭된 종목.

### 호버 툴팁

마우스 무브에서도 같은 raycast 후 툴팁 위치·내용 갱신:

```javascript
canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  mouseV.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  mouseV.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(mouseV, camera);
  const hits = raycaster.intersectObjects(nodeMeshes.map(n => n.mesh));
  if (hits.length){
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
    tooltip.style.top = (e.clientY - rect.top + 12) + 'px';
    tooltip.innerHTML = `...`;
  } else {
    tooltip.style.display = 'none';
  }
});
```

---

## 8. 성능 최적화

### Geometry 단순화

`SphereGeometry(radius, widthSegments, heightSegments)`:

- 노드 본체: `(radius, 24, 18)` — 충분히 부드러움
- 헤일로: `(radius*1.6, 16, 12)` — 반투명이라 디테일 덜 필요

너무 높은 segment는 GPU 비용 증가. 25개 종목이면 메쉬 50개 + 라인 25개 = 75개 객체. r128 기준 100~200개까지는 60fps 무리 없음.

### 불필요한 재렌더 방지

- 매 프레임 호출: `renderer.render(scene, camera)` 만
- 노드 재생성: `rebuildNodes()` — 종목 추가/삭제 시에만
- 위치 갱신: 메쉬 position만 변경 (geometry 재생성 X)

### 픽셀 비율 제한

```javascript
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
```

레티나 디스플레이는 devicePixelRatio가 2~3. 3까지 가면 GPU 부하 큼. 2로 cap.

### 안티얼리어싱 트레이드오프

`antialias: true` — 부드럽지만 GPU 비용. 모바일에선 끄는 옵션도 고려.

### onResize() 호출 빈도

윈도우 리사이즈 이벤트는 초당 수십 번 발생. 매번 `renderer.setSize()` 호출하면 부담. 보통 debounce/throttle 적용하지만 SPHERE는 그대로 — 충분히 빠름.

---

## 디버그 팁

### 좌표가 안 맞을 때

브라우저 콘솔에서:
```javascript
console.log(ITEMS.map(i => ({
  ticker: i.ticker,
  lat: i.sphere_coord.lat,
  lng: i.sphere_coord.lng,
  r: i.sphere_coord.r
})));
```

위도가 SECTOR_DEF 범위 안에 있는지, r이 1.0~1.5 안에 있는지 확인.

### 메쉬가 안 보일 때

1. 카메라 거리: `camera.position.z` 가 충분히 큰지 (4.2 권장)
2. light: ambient + directional 둘 다 있는지
3. material.opacity가 0이 아닌지
4. mesh.position이 origin 근처인지 (좌표가 100 같이 크면 안 보임)

### 메모리 누수 확인

Chrome DevTools → Performance → Memory. 종목 추가/삭제 반복 시 메모리가 계속 늘어나면 `disposeDynamic()` 누락 의심.

---

## 다음 읽을 문서

- 데이터 자동화 → `04-data-pipeline.md`
- 모바일·다크모드 → `05-ui-design-system.md`
