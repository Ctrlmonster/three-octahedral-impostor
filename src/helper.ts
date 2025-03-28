// @ts-nocheck

import * as THREE from "three";


// Attribution: Original code by SketchpunkLabs (VoR) – might contain some slight modifications
// https://codesandbox.io/p/sandbox/prototypes-pygsc7?file=%2Fprototypes%2Fmisc%2F002_octahedron_lerp.html%3A304%2C1-343%2C2
// =========================================================================================================================
// =========================================================================================================================
// =========================================================================================================================

export function lerpGeo(o, t) {
  const geo = o.wMesh.geometry;
  const atr = geo.attributes.position;
  const ary = atr.array;
  const ti = 1 - t;

  for (let i = 0; i < o.pntPlane.length; i++) {
    ary[i] = o.pntPlane[i] * ti + o.pntOct[i] * t;
  }

  atr.needsUpdate = true;
}

function geoBuffer(props) {
  const p = Object.assign({
    indices: null,
    normal: null,
    uv: null,
    joints: null,
    weights: null,
    skinSize: 4,
  }, props);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(
    (p.vertices instanceof Float32Array) ? p.vertices : new Float32Array(p.vertices),
    3
  ));

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Optional vertex buffers
  if (p.indices) geo.setIndex(new THREE.BufferAttribute(
    (p.indices instanceof Uint16Array) ? p.indices : new Uint16Array(p.indices),
    1
  ));

  if (p.normals) geo.setAttribute('normal', new THREE.BufferAttribute(
    (p.normals instanceof Float32Array) ? p.normals : new Float32Array(p.normals),
    3
  ));

  if (p.texcoord) geo.setAttribute('uv', new THREE.BufferAttribute(
    (p.texcoord instanceof Float32Array) ? p.texcoord : new Float32Array(p.texcoord),
    2
  ));

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  // Skinned Buffers
  if (p.joints && p.weights) {
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(
      (p.weights instanceof Float32Array) ? p.weights : new Float32Array(p.weights),
      p.skinSize
    ));

    geo.setAttribute('skinIndex', new THREE.BufferAttribute(
      (p.joints instanceof Float32Array) ? p.joints : new Float32Array(p.joints),
      p.skinSize
    ));
  }

  return geo;
}

// #endregion


// #region GENERATION
function createGrid(xCells = 6, yCells = 6, width = 1, height = 1, useCenter = true) {
  const xInc = width / xCells;
  let yInc = height / yCells;
  let ox = 0,    // Offset
    oz = 0,
    x, z, xi, yi;

  if (useCenter) {
    ox = -width * 0.5;
    oz = -height * 0.5;
  }

  const out = [];
  for (yi = 0; yi <= yCells; yi++) {
    z = yi * yInc;
    for (xi = 0; xi <= xCells; xi++) {
      x = xi * xInc;
      out.push(x + ox, 0, z + oz);
    }
  }

  return out;
}

function toSphereNormal(ary) {
  const rtn = new Array(ary.length);

  let x, y, z, m;
  for (let i = 0; i < ary.length; i += 3) {
    x = ary[i + 0];
    y = ary[i + 1];
    z = ary[i + 2];

    m = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    rtn[i + 0] = x / m;
    rtn[i + 1] = y / m;
    rtn[i + 2] = z / m;
  }

  return rtn;
}

function octPlaneIndices(isFull = 0, xCells = 6, yCells = 6) {
  const out = [];
  const xLen = xCells + 1;
  const xHalf = Math.floor(xCells * 0.5);
  const yHalf = Math.floor(yCells * 0.5);

  let a, b, c, d;
  let r0, r1, alt

  for (let y = 0; y < yCells; y++) {
    r0 = xLen * y;
    r1 = xLen * (y + 1);

    for (let x = 0; x < xCells; x++) {
      a = r0 + x;
      b = r1 + x;
      c = r1 + x + 1;
      d = r0 + x + 1;
      alt = (Math.floor(x / xHalf) + Math.floor(y / yHalf)) % 2;

      if (alt === isFull) out.push(a, b, c, c, d, a); // backward slash
      else out.push(d, a, b, b, c, d); // forward slash
    }
  }

  return out;
}


// https://github.com/wojtekpil/Godot-Octahedral-Impostors/blob/v2.0-new-baker/addons/octahedral_impostors/scripts/baking/utils/octahedral_utils.gd
function octHemi(ary) {
  const radius = 0.5;
  let ox, oy, x, y, z, m;

  for (let i = 0; i < ary.length; i += 3) {
    // NOTE: Original Math doesn't work using actual points
    // but guessing it might be UV based seems to work.
    // Since the mesh is generated as a unit quad, We can
    // shift X & Z by half to create UV values between 0 to 1
    // If the mesh is generated with different width/height
    // this will break.
    ox = ary[i + 0] + 0.5;  // U ??
    oy = ary[i + 2] + 0.5;  // V ??

    // Guessing this is UV to Hemi Normal Direction
    x = ox - oy;
    z = -1 + ox + oy;
    y = 1 - Math.abs(x) - Math.abs(z);

    // Normalize the direction and must use
    // a radius of 0.5 for things to look correct
    // Ideally this forms a unit half sphere
    m = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    ary[i + 0] = x / m * radius;
    ary[i + 1] = y / m * radius;
    ary[i + 2] = z / m * radius;
  }
}


// https://github.com/wojtekpil/Godot-Octahedral-Impostors/blob/v2.0-new-baker/addons/octahedral_impostors/scripts/baking/utils/octahedral_utils.gd
function octFull(ary) {
  const radius = 0.5;
  let u, v, x, y, z, m;
  let ox, oz;

  for (let i = 0; i < ary.length; i += 3) {
    // Original math converts UV to -1 to 1 range
    // With the points already being in a -0.5 to 0.5 range
    // we just need to remove -1 to recreate the needed range
    // coord * 2.0 - Vector2(1.0, 1.0)
    u = ary[i + 0] * 2.0;
    v = ary[i + 2] * 2.0;

    // North Hemisphere
    x = u;
    z = v;
    y = 1 - Math.abs(x) - Math.abs(z);

    // Fix XZ for South Hemisphere
    if (y < 0) {
      // woops, make a copy of X and Z else changing
      // x will mess up Z's math
      ox = x;
      oz = z;
      x = Math.sign(ox) * (1.0 - Math.abs(oz));
      z = Math.sign(oz) * (1.0 - Math.abs(ox));
    }

    // Normalize Position
    m = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
    ary[i + 0] = x / m * radius;
    ary[i + 1] = y / m * radius;
    ary[i + 2] = z / m * radius;
  }
}

// #endregion

// #region BUILDING
export const OCT = {
  HEMI: 0,
  FULL: 1,
} as const;

export type OctType = typeof OCT["HEMI"] | typeof OCT["FULL"];

export function buildMesh(oct: OctType, gridSize: number, pos = [0, 0, 0]) {
  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  const pntPlane = createGrid(gridSize, gridSize);
  const indie = octPlaneIndices(oct, gridSize, gridSize);

  const pntOct = pntPlane.slice();
  switch (oct) {
    case OCT.HEMI:
      octHemi(pntOct);
      break;
    case OCT.FULL:
      octFull(pntOct);
      break;
  }

  const normals = toSphereNormal(pntOct);

  // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
  const geo = geoBuffer({vertices: pntPlane, indices: indie, normals});
  const wMesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}));
  const fMesh = new THREE.Mesh(geo, CustomMaterial());


  wMesh.position.fromArray(pos);
  wMesh.position.y += 0.001;
  fMesh.position.fromArray(pos);
  fMesh.scale.setScalar(0.999);

  return {
    pntPlane,
    pntOct,
    wMesh,
    fMesh,
  };
}

function CustomMaterial() {
  let mat = new THREE.ShaderMaterial({
    depthTest: true,
    transparent: true,
    alphaToCoverage: false,
    side: THREE.FrontSide,
    // @ts-ignore
    extensions: {derivatives: true,},
    uniforms: {},

    vertexShader: `
      varying vec3 fragNorm;

	    void main() {
            vec4 wpos   = modelMatrix * vec4( position, 1.0 );
            fragNorm    = normal;

            gl_Position = projectionMatrix * viewMatrix * wpos; 
        }`,

    fragmentShader: `
        varying vec3 fragNorm;

        void main() {
		      gl_FragColor = vec4( fragNorm.xzy, 0.75 );
		    }
		`,
  });

  return mat;
}