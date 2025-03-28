import * as THREE from 'three';

export function createColoredCube(size: number = 1): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(size, size, size);

  // Define colors for each face
  const colors = [
    0xff0000, // Red
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff  // Cyan
  ];

  const materials = colors.map(color => new THREE.MeshBasicMaterial({ color }));

  // Create a mesh with different materials for each face
  const cube = new THREE.Mesh(geometry, materials);

  return cube;
}



/**
 * Generates an array of THREE.Color objects forming a linear gradient in HSL space.
 * @param count Number of colors to generate.
 * @returns An array of THREE.Color objects.
 */
export function generateHSLGradientColors(count: number): THREE.Color[] {
  const colors: THREE.Color[] = [];

  for (let i = 0; i < count; i++) {
    const hue = (i / count) * 360; // Distribute hues evenly across 360 degrees
    const color = new THREE.Color().setHSL(hue / 360, 1.0, 0.5); // Full saturation, medium lightness
    colors.push(color);
  }

  return colors;
}
