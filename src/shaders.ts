/**
 * Rectangle sampling fragments owned here; no shader device is created. A plane
 * point is in the image's own pixels, top-left origin, y down, as uploaded.
 *
 * - `rectangleImageUv` turns a plane point into texture coordinates.
 * - `rectangleImageCoverage` is 1 on the image, edges included, and 0 outside it.
 * - `rectangleNearestTexelUv` moves texture coordinates to the centre of the texel
 *   under them. Sampling that point at level 0 returns that texel's value
 *   whatever filter the texture's own sampler uses, so a nearest-texel view
 *   changes no state that other users of a cached texture rely on.
 */
export const RECTANGLE_IMAGE_WGSL = /* wgsl */ `
fn rectangleImageUv(plane: vec2<f32>, size: vec2<f32>) -> vec2<f32> {
  return plane / size;
}
fn rectangleImageCoverage(plane: vec2<f32>, size: vec2<f32>) -> f32 {
  let inside = step(vec2<f32>(0.0), plane) * step(plane, size);
  return inside.x * inside.y;
}
fn rectangleNearestTexelUv(uv: vec2<f32>, size: vec2<f32>) -> vec2<f32> {
  let texel = clamp(floor(uv * size), vec2<f32>(0.0), size - vec2<f32>(1.0));
  return (texel + vec2<f32>(0.5)) / size;
}
`;
export const RECTANGLE_IMAGE_GLSL = /* glsl */ `
vec2 rectangleImageUv(vec2 plane, vec2 size) {
  return plane / size;
}
float rectangleImageCoverage(vec2 plane, vec2 size) {
  vec2 inside = step(vec2(0.0), plane) * step(plane, size);
  return inside.x * inside.y;
}
vec2 rectangleNearestTexelUv(vec2 uv, vec2 size) {
  vec2 texel = clamp(floor(uv * size), vec2(0.0), size - vec2(1.0));
  return (texel + vec2(0.5)) / size;
}
`;
