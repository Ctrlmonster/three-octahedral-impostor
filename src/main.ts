import "./style.css";
import * as THREE from 'three';
import {
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  Raycaster,
  Sphere,
  SphereGeometry,
  Vector3
} from 'three';
import {buildMesh, lerpGeo, OCT, OctType} from "./helper.ts";
import {createColoredCube, generateHSLGradientColors} from "./misc.ts";
import {Pane} from "tweakpane";
// @ts-ignore
import {mapLinear} from "three/src/math/MathUtils";
// @ts-ignore
import {Text} from 'troika-three-text'
// @ts-ignore
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';

// =====================================================================================================================
// Setup


// Setup Scene
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 2, 5);

// Renderer setup
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls setup
const controls = new OrbitControls(camera, renderer.domElement);

// Add simple lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 3.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Resize handling
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


// =====================================================================================================================
// Main App init

let GRID_SIZE = 31;
let ATLAS_SIZE = 2048;



const ATLAS_DEBUG = {
  quads: false,
  numbers: false,
  samples: false
};

const OCTAHEDRON_DEBUG = {
  quads: false,
  numbers: false,
  samples: false,
  lerp: 1.0,
  target: true
};

const IMPOSTOR_DEBUG = {
  model: "cube" as "cube" | "torus",
  impostorWireframe: true
}


const GEN_PARAMS = {
  atlas_size: ATLAS_SIZE,
  grid_size: GRID_SIZE,
  type: OCT.HEMI
};

// get the slider
const LERP_PERCENT = {
  current: 1.0
}

const OctPositionByType = {
  [OCT.HEMI]: [0, 0, 0],
  [OCT.FULL]: [-1.5, 0, 0]
}


let fullOct = buildMesh(OCT.FULL, GRID_SIZE - 1, OctPositionByType[OCT.FULL]); // second arg is position offset
let hemiOct = buildMesh(OCT.HEMI, GRID_SIZE - 1, OctPositionByType[OCT.HEMI]);

const OctByType = {
  [OCT.HEMI]: hemiOct,
  [OCT.FULL]: fullOct
};

lerpGeo(fullOct, LERP_PERCENT.current);
lerpGeo(hemiOct, LERP_PERCENT.current);


// =====================================================================================================================

// scene annotations
const infoTextAtlas = new Text();
infoTextAtlas.text = "Atlas"
infoTextAtlas.position.x = -0.5;
infoTextAtlas.position.y = 2.8;
infoTextAtlas.fontSize = 0.5;
infoTextAtlas.color = 0x000000;
infoTextAtlas.sync();

scene.add(infoTextAtlas);

// ~


const infoTextImpostor = new Text();
infoTextImpostor.text = "Impostor"
infoTextImpostor.position.x = 0.5;
infoTextImpostor.position.z = 1.9;
infoTextImpostor.position.y = -0.5;
infoTextImpostor.rotation.x = -Math.PI / 2;
infoTextImpostor.fontSize = 0.3;
infoTextImpostor.color = 0x000000;
infoTextImpostor.sync();

scene.add(infoTextImpostor);


const infoTextMesh = new Text();
infoTextMesh.text = "Target Mesh"
infoTextMesh.position.x = 0.5;
infoTextMesh.position.z = -0.25;
infoTextMesh.position.y = -0.5;
infoTextMesh.rotation.x = -Math.PI / 2;
infoTextMesh.fontSize = 0.3;
infoTextMesh.color = 0x000000;
infoTextMesh.sync();

scene.add(infoTextMesh);


// ~

const infoTextMeshes = new Text();
infoTextMeshes.text = "Octahedron Options"
infoTextMeshes.position.x = -4.9;
infoTextMeshes.position.y = 1.7;
infoTextMeshes.fontSize = 0.25;
infoTextMeshes.color = 0x000000;
infoTextMeshes.sync();
scene.add(infoTextMeshes);

const infoTextHemi = new Text();
infoTextHemi.text = "Hemi"
infoTextHemi.position.x = -3.2;
infoTextHemi.position.y = 1;
infoTextHemi.fontSize = 0.15;
infoTextHemi.color = 0x000000;
infoTextHemi.sync();
scene.add(infoTextHemi);

const infoTextFull = new Text();
infoTextFull.text = "Full"
infoTextFull.position.x = -4.6;
infoTextFull.position.y = 1;
infoTextFull.fontSize = 0.15;
infoTextFull.color = 0x000000;
infoTextFull.sync();
scene.add(infoTextFull);


// =====================================================================================================================

const debugObjectStore = {
  numbersOnAtlas: [] as Text[],
  numbersOnMesh: [] as Text[],
  gridOnMesh: null as (null | Mesh),
  atlasGridOverlay: null as (null | Mesh),
  samplePointsOnMesh: [] as Mesh[],
  samplePointsOnAtlas: [] as Mesh[],
  targetMesh: null as (null | Mesh),
}

type DebugOptions = Partial<{
  showNumbersOnAtlas: boolean;
  showGridOnAtlas: boolean;
  showNumbersOnMesh: boolean;
  showSamplesOnMesh: boolean;
  showSamplesOnAtlas: boolean;
  showGridOnMesh: boolean;
}>

function createDebugVisualization(mode: OctType, options: DebugOptions = {}) {
  const {
    showNumbersOnAtlas,
    showGridOnAtlas,
    showSamplesOnAtlas,
    showNumbersOnMesh,
    showSamplesOnMesh,
    showGridOnMesh
  } = options;


  // -----------------------------------------------------------------------------

  const oct = OctByType[mode];


  ([fullOct.fMesh, fullOct.wMesh, hemiOct.fMesh, hemiOct.wMesh]).forEach(mesh => {
    mesh.position.x -= 3.0;
  });
  scene.add(fullOct.fMesh, fullOct.wMesh);
  scene.add(hemiOct.fMesh, hemiOct.wMesh);

  // lerp the geo once to match the current lerp state in the gui
  lerpGeo(hemiOct, LERP_PERCENT.current);
  lerpGeo(fullOct, LERP_PERCENT.current);


  debugObjectStore.gridOnMesh = oct.wMesh.clone();
  debugObjectStore.gridOnMesh.position.x = 0;
  debugObjectStore.gridOnMesh.visible = !!showGridOnMesh;
  scene.add(debugObjectStore.gridOnMesh);

  // -----------------------------------------------------------------------------

  const dynamicFontSize = Math.max(0.005, mapLinear(GRID_SIZE, 4, 24, 0.03, 0.005));


  const atlasOverlay = buildMesh(mode, GRID_SIZE - 1, OctPositionByType[mode]);
  scene.add(atlasOverlay.wMesh);
  atlasOverlay.wMesh.position.y = 1.5;
  atlasOverlay.wMesh.position.x = 0;
  atlasOverlay.wMesh.rotation.x = 3 * Math.PI / 2;
  atlasOverlay.wMesh.visible = !!showGridOnAtlas;
  debugObjectStore.atlasGridOverlay = atlasOverlay.wMesh;


  const offset = new Vector3(...OctPositionByType[mode]);


  // go through all points in hemiOct.pntPlane (in strides of three and create small sphere at each position)
  const sampleColors = generateHSLGradientColors(oct.pntOct.length);

  // place the samples on the octahedron geometry
  oct.pntOct.forEach((_, i) => {
    if (i % 3 === 0) {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 16, 16),
        new THREE.MeshBasicMaterial({color: sampleColors[i]})
      );
      sphere.position.set(oct.pntOct[i], oct.pntOct[i + 1], oct.pntOct[i + 2]);
      sphere.position.add(offset);
      sphere.visible = !!showSamplesOnMesh;
      scene.add(sphere);
      debugObjectStore.samplePointsOnMesh.push(sphere);

      const numberText = new Text();
      scene.add(numberText)

      // Set properties to configure:
      numberText.text = `${i / 3}`;
      numberText.fontSize = dynamicFontSize;
      numberText.position.set(oct.pntOct[i], oct.pntOct[i + 1], oct.pntOct[i + 2] + 0.01);
      numberText.position.add(offset);
      numberText.color = 0x000000
      numberText.visible = !!showNumbersOnMesh;

      // Update the rendering:
      numberText.sync()

      debugObjectStore.numbersOnMesh.push(numberText);
    }
  });


  oct.pntPlane.forEach((_, i) => {
    if (i % 3 === 0) {

      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.01, 16, 16),
        new THREE.MeshBasicMaterial({color: sampleColors[i]})
      );

      //const e = new Euler(Math.PI / 2, 0, 0)
      const mat = new Matrix4();
      mat.makeRotationX(3 * Math.PI / 2);
      const pos = new Vector3(oct.pntPlane[i], oct.pntPlane[i + 1], oct.pntPlane[i + 2]);
      pos.applyMatrix4(mat);
      pos.y += 1.5;

      sphere.position.copy(pos);
      sphere.visible = !!showSamplesOnAtlas;
      scene.add(sphere);
      debugObjectStore.samplePointsOnAtlas.push(sphere);

      // ---

      const numberText = new Text();
      scene.add(numberText)
      debugObjectStore.numbersOnAtlas.push(numberText);
      numberText.visible = !!showNumbersOnAtlas;

      // Set properties to configure:
      numberText.text = `${i / 3}`;
      numberText.fontSize = dynamicFontSize;
      numberText.position.copy(pos);
      numberText.position.z += 0.01;
      numberText.depthOffset = 3;

      numberText.color = 0x666666;

      // Update the rendering:
      numberText.sync()
    }
  });
}


// =================================================================================================


// Atlas visualization plane setup

// Create the render target texture (initially blank)
const atlasRenderTarget = new THREE.WebGLRenderTarget(ATLAS_SIZE, ATLAS_SIZE, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  format: THREE.RGBAFormat,
  colorSpace: NoColorSpace // ?? – not sure about the color space
});

// Create a plane geometry to visualize the atlas
const atlasPlaneGeo = new THREE.PlaneGeometry(1, 1);
const atlasPlaneMat = new THREE.MeshBasicMaterial({
  map: atlasRenderTarget.texture,
  side: THREE.DoubleSide,
});

// Atlas visualization mesh
const atlasPlaneMesh = new THREE.Mesh(atlasPlaneGeo, atlasPlaneMat);

// Position the atlas plane mesh visibly in the scene
atlasPlaneMesh.position.set(0, 1.5, 0);
scene.add(atlasPlaneMesh);

// Optional helper function (clear atlas initially)
function clearAtlas() {
  renderer.setRenderTarget(atlasRenderTarget);
  renderer.setClearColor(0x000000, 0); // transparent black
  renderer.clear();
  renderer.setRenderTarget(null); // back to default framebuffer
}

clearAtlas();


// =====================================================================================================================


// Atlas Population Function

function populateAtlas(
  mesh: THREE.Mesh,
  pointsData: { points: number[]; pointsUnwrapped: number[] },
  renderTarget: THREE.WebGLRenderTarget
) {

  // Create an isolated scene for offscreen rendering
  const renderScene = new THREE.Scene();
  renderScene.add(mesh);
  mesh.visible = true;

  // Set up Ortho Camera
  const orthoSize = 0.5; // The scene is normalized, so this keeps it within view
  const renderCam = new THREE.OrthographicCamera(-orthoSize, orthoSize, orthoSize, -orthoSize, 0.001, 10);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.6);
  renderScene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 3.8);
  directionalLight.position.set(5, 10, 7.5);
  renderScene.add(directionalLight);


  const radius = boundingSphere.radius * 1.5;
  const scaleFactor = 0.5 / radius; // scale to unit sphere
  mesh.scale.setScalar(scaleFactor);

  // Prepare renderer
  const originalRenderTarget = renderer.getRenderTarget();

  const numCells = GRID_SIZE;
  const cellSize = (ATLAS_SIZE / numCells) * 1.0; // can be adjusted to fit the atlas better

  if (numCells ** 2 !== pointsData.points.length / 3) {
    console.log(numCells ** 2, pointsData.points.length / 3);
    throw new Error("expected one for point for each cell!")
  }

  for (let rowIdx = 0; rowIdx <= numCells; rowIdx++) {
    for (let colIdx = 0; colIdx <= numCells; colIdx++) {

      // pixelX, Y are the top-left corner of each cell.
      const pixelX = (colIdx / numCells * renderTarget.width);
      const pixelY = (rowIdx / numCells * renderTarget.height);


      // using the flattened idx we get the 3D position for our cam
      const flatIdx = (rowIdx * numCells) + colIdx;
      const px = pointsData.points[flatIdx * 3];
      const py = pointsData.points[flatIdx * 3 + 1];
      const pz = pointsData.points[flatIdx * 3 + 2];

      const viewDir = new THREE.Vector3(px, py, pz).normalize();

      // Position the camera in the correct direction, at the computed distance
      renderCam.position.copy(viewDir.multiplyScalar(1.1)); // Move along the view direction - one more magic number to play with

      const {x: centerX, y: centerY, z: centerZ} = boundingSphere.center;
      renderCam.lookAt(centerX, centerY, centerZ); // Always look at bounding sphere center

      renderer.setRenderTarget(renderTarget);
      renderer.setScissorTest(true);

      // Set scissor to render exactly one "cell" of the atlas
      renderer.setScissor(pixelX, pixelY, cellSize, cellSize);
      renderer.setViewport(pixelX, pixelY, cellSize, cellSize);

      // Clear the scissored area
      renderer.setClearColor(0x000000, 0); // Clear background before rendering
      renderer.clear();
      renderer.render(renderScene, renderCam); // Render the mesh view

      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);

    }
  }

  // Restore original render target
  renderer.setRenderTarget(originalRenderTarget);
  renderer.setClearColor(0xC1EEFF, 1);


  atlasPlaneMesh.scale.setScalar(1 + 1 / GRID_SIZE);


  debugObjectStore.targetMesh = mesh;
  mesh.visible = OCTAHEDRON_DEBUG.target;
  scene.add(mesh);
}

function centerGeometryOriginToBoundingSphere(mesh: THREE.Mesh) {
  const geometry = mesh.geometry;

  // Make sure the geometry's bounding sphere is up to date
  geometry.computeBoundingSphere();

  const center = geometry.boundingSphere!.center.clone();

  // Translate geometry so that the bounding sphere center becomes the origin
  geometry.translate(-center.x, -center.y, -center.z);

  // Move the mesh to compensate, so it stays in the same world position
  mesh.position.add(center);
}


const torus = new THREE.Mesh(new THREE.TorusKnotGeometry(), new MeshStandardMaterial({color: "hotpink"}));
const coloredCube = createColoredCube();
let demoMesh = coloredCube;
const heightOffset = 0; // needs adjustment for different meshes (centerGeometryOriginToBoundingSphere isn't solid)


let boundingSphere = new Sphere();
const _tempSphere = new Sphere();




// =====================================================================================================================


function cleanup() {
  clearAtlas();

  if (debugObjectStore.targetMesh) {
    scene.remove(debugObjectStore.targetMesh);
  }

  const {fMesh: fM, wMesh: fW} = fullOct;
  const {fMesh: hM, wMesh: hW} = hemiOct;
  scene.remove(fM, fW, hM, hW); // remove all previous meshes

  debugObjectStore.samplePointsOnMesh.forEach(mesh => {
    scene.remove(mesh);
    mesh.geometry.dispose();
  });
  debugObjectStore.samplePointsOnMesh.length = 0;

  debugObjectStore.samplePointsOnAtlas.forEach(mesh => {
    scene.remove(mesh);
    mesh.geometry.dispose();
  });
  debugObjectStore.samplePointsOnAtlas.length = 0;

  debugObjectStore.numbersOnMesh.forEach(text => {
    scene.remove(text);
    text.dispose();
  });
  debugObjectStore.numbersOnMesh.length = 0;

  debugObjectStore.numbersOnAtlas.forEach(text => {
    scene.remove(text);
    text.dispose();
  });
  debugObjectStore.numbersOnAtlas.length = 0;

  debugObjectStore.atlasGridOverlay && scene.remove(debugObjectStore.atlasGridOverlay);
  debugObjectStore.atlasGridOverlay = null;

  if (debugObjectStore.gridOnMesh) {
    scene.remove(debugObjectStore.gridOnMesh);
    debugObjectStore.gridOnMesh = null;
  }
}

function generate() {
  cleanup();
  fullOct = buildMesh(OCT.FULL, GRID_SIZE - 1, OctPositionByType[OCT.FULL]); // second arg is position offset
  hemiOct = buildMesh(OCT.HEMI, GRID_SIZE - 1, OctPositionByType[OCT.HEMI]);
  OctByType[OCT.HEMI] = hemiOct;
  OctByType[OCT.FULL] = fullOct;

  boundingSphere = new Sphere();
  demoMesh.traverse(node => {
    if (node instanceof Mesh) {
      centerGeometryOriginToBoundingSphere(node);
      _tempSphere.copy(node.geometry.boundingSphere!);
      boundingSphere.union(_tempSphere);
    }
  });
  demoMesh.position.copy(boundingSphere.center);
  demoMesh.position.y -= heightOffset;


  const activeOct = OctByType[GEN_PARAMS.type];
  populateAtlas(demoMesh, {points: activeOct.pntOct, pointsUnwrapped: activeOct.pntPlane}, atlasRenderTarget);
  createDebugVisualization(GEN_PARAMS.type, {
    showGridOnAtlas: ATLAS_DEBUG.quads,
    showNumbersOnAtlas: ATLAS_DEBUG.numbers,
    showSamplesOnAtlas: ATLAS_DEBUG.samples,
    showSamplesOnMesh: OCTAHEDRON_DEBUG.samples,
    showNumbersOnMesh: OCTAHEDRON_DEBUG.numbers,
    showGridOnMesh: OCTAHEDRON_DEBUG.quads
  });
}

generate();

// =====================================================================================================================
// Setup Debug GUI

const pane = new Pane({
  title: "Impostor Baking"
});

const debugFolder = pane.addFolder({
  title: 'Debug',
  expanded: true,
});

// ---------------------------------------------------------------------------------------------------------------------

// ATLAS DEBUG

const atlasFolder = debugFolder.addFolder({
  title: 'Atlas Debug',
  expanded: true,
});


const showQuadsOnAtlas = atlasFolder.addBinding(ATLAS_DEBUG, 'quads');
showQuadsOnAtlas.on("change", ({value}) => {
  if (debugObjectStore.atlasGridOverlay) {
    debugObjectStore.atlasGridOverlay.visible = value;
  }
});
const showAtlasNumbers = atlasFolder.addBinding(ATLAS_DEBUG, 'numbers');
showAtlasNumbers.on("change", ({value}) => {
  debugObjectStore.numbersOnAtlas.forEach(text => text.visible = value);
});
const showAtlasSamples = atlasFolder.addBinding(ATLAS_DEBUG, 'samples');
showAtlasSamples.on("change", ({value}) => {
  debugObjectStore.samplePointsOnAtlas.forEach(mesh => mesh.visible = value);
});


// ---------------------------------------------------------------------------------------------------------------------

// OCTAHEDRON DEBUG

const octahedronFolder = debugFolder.addFolder({
  title: 'Octahedron Debug',
  expanded: true,
});

const showQuadsOnMesh = octahedronFolder.addBinding(OCTAHEDRON_DEBUG, 'quads');
showQuadsOnMesh.on("change", ({value}) => {
  if (debugObjectStore.gridOnMesh) {
    debugObjectStore.gridOnMesh.visible = value;
  }
});

const showTargetMesh = octahedronFolder.addBinding(OCTAHEDRON_DEBUG, 'target');
showTargetMesh.on("change", ({value}) => {
  if (debugObjectStore.targetMesh) {
    debugObjectStore.targetMesh.visible = value;
  }
});

const showMeshNumbers = octahedronFolder.addBinding(OCTAHEDRON_DEBUG, 'numbers');
showMeshNumbers.on("change", ({value}) => {
  debugObjectStore.numbersOnMesh.forEach(text => text.visible = value);
});
const showMeshSamples = octahedronFolder.addBinding(OCTAHEDRON_DEBUG, 'samples');
showMeshSamples.on("change", ({value}) => {
  debugObjectStore.samplePointsOnMesh.forEach(mesh => mesh.visible = value);
});

const lerpSlider = octahedronFolder.addBinding(OCTAHEDRON_DEBUG, "lerp", {
  min: 0,
  max: 1,
});
lerpSlider.on("change", ({value}) => {
  LERP_PERCENT.current = value as number;
  lerpGeo(hemiOct, value);
  lerpGeo(fullOct, value);
});

// ---------------------------------------------------------------------------------------------------------------------


// IMPOSTOR DEBUG

const impostorFolder = debugFolder.addFolder({
  title: 'Impostor Debug',
  expanded: true,
});

const testModel = impostorFolder.addBinding(IMPOSTOR_DEBUG, "model", {
  options: {
    "cube": "cube",
    "torus": "torus"
  }
});

testModel.on("change", ({value}) => {
  scene.remove(demoMesh);
  demoMesh = value === "cube" ? coloredCube : torus;
  scene.add(demoMesh);
  generate();
});


const showImpostorWireframe = impostorFolder.addBinding(IMPOSTOR_DEBUG, "impostorWireframe");

showImpostorWireframe.on("change", ({value}) => {
  wireFrameImpostor.visible = value;
});


// ---------------------------------------------------------------------------------------------------------------------

// GENERAL SETTINGS

const buildFolder = pane.addFolder({
  title: "General",
  expanded: true
});

const setAtlasSize = buildFolder.addBinding(GEN_PARAMS, 'atlas_size', {
  options: {
    "128": 128,
    "256": 256,
    "512": 512,
    "1024": 1024,
    "2048": 2048,
    "4096": 4096,
  },
});

setAtlasSize.on("change", ({value}) => {
  ATLAS_SIZE = value;
  atlasRenderTarget.setSize(value, value);
  generate();
});


const setOctType = buildFolder.addBinding(GEN_PARAMS, 'type', {
  options: {
    "hemi": OCT.HEMI,
    "full": OCT.FULL
  },
});
setOctType.on("change", ({value}) => {
  GEN_PARAMS.type = value;
  generate();
});

const setGridSize = buildFolder.addBinding(GEN_PARAMS, 'grid_size', {
  step: 1,
  min: 3,
  max: 64,
});

setGridSize.on("change", ({value}) => {
  GRID_SIZE = value;
})

const genBtn = buildFolder.addButton({
  title: "Re-Generate"
});
genBtn.on("click", () => {
  generate();
});

// ---------------------------------------------------------------------------------------------------------------------

// =====================================================================================================================


// Runtime shader / rendering

const impostorMaterial = new THREE.ShaderMaterial({
  uniforms: {
    atlasTexture: {value: atlasRenderTarget.texture},
    cameraPosition: {value: new THREE.Vector3()},
    gridSize: {value: GEN_PARAMS.grid_size},
    faceWeights: {value: new Vector3()},
    faceIndices: {value: new Vector3()},
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec3 worldPos = vec3(modelMatrix * vec4(position, 1.0));
      gl_Position = projectionMatrix * viewMatrix * vec4(worldPos, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D atlasTexture;
    uniform float gridSize;
    uniform vec3 faceWeights;
    uniform vec3 faceIndices;
    varying vec2 vUv;


    vec2 flatToCoords(float flatIndex) {
      float row = floor(flatIndex / gridSize);
      float col = flatIndex - row * gridSize;
      return vec2(col, row);
    }
    
    void main() {
        // we take the first index for starters
        float flatIndexA = faceIndices.x;
        float flatIndexB = faceIndices.y;
        float flatIndexC = faceIndices.z;
        
        // then we convert that back to rows and cols    
        vec2 cellIndexA = flatToCoords(flatIndexA); 
        vec2 cellIndexB = flatToCoords(flatIndexB); 
        vec2 cellIndexC = flatToCoords(flatIndexC); 
    
        // Compute the final UV lookup into the atlas
        vec2 atlasUV_a = (cellIndexA + vUv) / gridSize;
        vec2 atlasUV_b = (cellIndexB + vUv) / gridSize;
        vec2 atlasUV_c = (cellIndexC + vUv) / gridSize;
    
        // Sample the atlas
        vec4 color_a = texture(atlasTexture, atlasUV_a).rgba;
        vec4 color_b = texture(atlasTexture, atlasUV_b).rgba;
        vec4 color_c = texture(atlasTexture, atlasUV_c).rgba;
        
        vec4 finalColor = color_a * faceWeights.x + color_b * faceWeights.y + color_c * faceWeights.z;
        if (finalColor.a + finalColor.a + finalColor.a <= 1.0) {
          discard;
        }
        
        finalColor *= 3.0;
        
    
        gl_FragColor = vec4(finalColor.rgb, 1.0);
    }



  `,
});

const impostorMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), impostorMaterial);
const wireFrameImpostor = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({wireframe: true, color: "red"}));

impostorMesh.position.z = 2;
wireFrameImpostor.position.z = 2;

scene.add(impostorMesh);
scene.add(wireFrameImpostor);

// =====================================================================================================================


const raycaster = new Raycaster();
const intersectDebug = new Mesh(new SphereGeometry(0.01), new MeshBasicMaterial({color: "white"}));
scene.add(intersectDebug);

const currentFaceIndices = new Vector3();
const currentFaceWeights = new Vector3();

function raycastMeshToFindViewDirection() {
  if (!debugObjectStore.gridOnMesh) return;

  raycaster.ray.origin.copy(camera.position);
  raycaster.ray.direction.subVectors(debugObjectStore.gridOnMesh.position, camera.position).normalize();

  const [hit] = raycaster.intersectObject(debugObjectStore.gridOnMesh);
  if (!hit) return;


  currentFaceIndices.x = hit.face!.a;
  currentFaceIndices.y = hit.face!.b;
  currentFaceIndices.z = hit.face!.c;

  currentFaceWeights.x = hit.barycoord!.x;
  currentFaceWeights.y = hit.barycoord!.y;
  currentFaceWeights.z = hit.barycoord!.z;

  intersectDebug.position.copy(hit.point);
}


// =====================================================================================================================
// Update Loop

function animate() {
  requestAnimationFrame(animate);
  controls.update();


  const {pntPlane, pntOct} = OctByType[GEN_PARAMS.type];
  const t = LERP_PERCENT.current;

  debugObjectStore.samplePointsOnMesh.forEach((mesh, i) => {
    const x = t * pntOct[i * 3] + (1 - t) * pntPlane[i * 3];
    const y = t * pntOct[i * 3 + 1] + (1 - t) * pntPlane[i * 3 + 1];
    const z = t * pntOct[i * 3 + 2] + (1 - t) * pntPlane[i * 3 + 2];
    mesh.position.set(x, y, z);
  });

  debugObjectStore.numbersOnMesh.forEach((text, i) => {
    const x = t * pntOct[i * 3] + (1 - t) * pntPlane[i * 3];
    const y = t * pntOct[i * 3 + 1] + (1 - t) * pntPlane[i * 3 + 1];
    const z = t * pntOct[i * 3 + 2] + (1 - t) * pntPlane[i * 3 + 2];
    text.position.set(x, y, z);
  });


  debugObjectStore.numbersOnMesh.forEach(text => {
    text.lookAt(camera.position)
  });

  // ---------------------------------------------------------------------


  impostorMesh.material.uniforms.cameraPosition.value.copy(camera.position);
  impostorMesh.material.uniforms.gridSize.value = GEN_PARAMS.grid_size;
  impostorMesh.material.uniforms.faceWeights.value.copy(currentFaceWeights);
  impostorMesh.material.uniforms.faceIndices.value.copy(currentFaceIndices);
  impostorMesh.lookAt(camera.position);

  //wireFrameImpostor.position.copy(impostorMesh.position);
  wireFrameImpostor.rotation.copy(impostorMesh.rotation);

  // ---------------------------------------------------------------------
  raycastMeshToFindViewDirection();

  renderer.render(scene, camera);
}

animate();
