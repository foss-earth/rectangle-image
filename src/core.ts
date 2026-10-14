/** Whole-texel pixel dimensions of a rectangle image. */
export interface RectangleImageSize {
  readonly width: number;
  readonly height: number;
}
/**
 * A position on a rectangle image's plane, in that image's pixels: origin at the
 * top-left corner, x right and y down. Texel (i, j) covers [i, i + 1) × [j, j + 1),
 * and its centre is (i + ½, j + ½). The plane spans [0, width] × [0, height].
 */
export interface RectanglePlanePoint {
  readonly x: number;
  readonly y: number;
}
/** Normalized texture coordinates: u = x / width and v = y / height, top-left origin, as images are uploaded. */
export interface RectangleTextureCoordinates {
  readonly u: number;
  readonly v: number;
}
export interface RectangleTexel {
  readonly i: number;
  readonly j: number;
}

/** Whether both dimensions are positive whole numbers small enough for exact arithmetic. */
export function isRectangleImageSize(size: RectangleImageSize): boolean {
  return [size.width, size.height].every(side => Number.isSafeInteger(side) && side > 0);
}

function requireSize(size: RectangleImageSize): void {
  if (!isRectangleImageSize(size)) throw new RangeError("A rectangle image size is a positive whole width and height.");
}

export function rectangleTextureCoordinates(size: RectangleImageSize, point: RectanglePlanePoint): RectangleTextureCoordinates {
  requireSize(size);
  return { u: point.x / size.width, v: point.y / size.height };
}

export function rectanglePlanePoint(size: RectangleImageSize, coordinates: RectangleTextureCoordinates): RectanglePlanePoint {
  requireSize(size);
  return { x: coordinates.u * size.width, y: coordinates.v * size.height };
}

export function rectangleTexelCenter(texel: RectangleTexel): RectanglePlanePoint {
  return { x: texel.i + 0.5, y: texel.j + 0.5 };
}

/** The texel that covers a plane point, or null outside the image. The right and bottom edges belong to no texel. */
export function rectangleTexelAt(size: RectangleImageSize, point: RectanglePlanePoint): RectangleTexel | null {
  requireSize(size);
  if (!(point.x >= 0 && point.y >= 0 && point.x < size.width && point.y < size.height)) return null;
  return { i: Math.floor(point.x), j: Math.floor(point.y) };
}

/** Whether a plane point lies on the image, edges included. */
export function rectangleCovers(size: RectangleImageSize, point: RectanglePlanePoint): boolean {
  requireSize(size);
  return point.x >= 0 && point.y >= 0 && point.x <= size.width && point.y <= size.height;
}

/**
 * Whether two images have exactly the same aspect ratio: `widthA × heightB =
 * widthB × heightA`, compared without rounding at any size. Odd-sized
 * half-resolution images usually do not. Equal aspect alone does not show that
 * two photographs share a framing.
 */
export function sameRectangleAspect(a: RectangleImageSize, b: RectangleImageSize): boolean {
  requireSize(a); requireSize(b);
  return BigInt(a.width) * BigInt(b.height) === BigInt(b.width) * BigInt(a.height);
}

/**
 * The same place on another image of the same framing: `to` pixels per `from`
 * pixel along each axis. The two must have the same aspect ratio.
 */
export function mapRectanglePlanePoint(from: RectangleImageSize, to: RectangleImageSize, point: RectanglePlanePoint): RectanglePlanePoint {
  if (!sameRectangleAspect(from, to)) throw new RangeError("Only images with the same aspect ratio share a plane without registration.");
  return { x: point.x * to.width / from.width, y: point.y * to.height / from.height };
}
