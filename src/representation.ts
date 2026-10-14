import { ImageRecordChecker, checkImageRepresentationBase, isRecord, resolveImageUrl, rgba8Bytes, type RectangleImageAsset, type RectangleRepresentationRecord, type ImageAttribution, type ImageEstimate, type ImageFile, type RepresentationHooks, type RepresentationValidation, type ImageDiagnostic } from "@foss-earth/images";
import { isRectangleImageSize } from "./core.js";

/** A rectangle photograph's primary representation: one file, in pixels of its own plane. */
export interface RectangleImageRepresentationRecord extends RectangleRepresentationRecord {
  role: "image";
  projection: "rectangle";
  width: number;
  height: number;
  url: string;
}
export type RectangleImageAssetRecord = RectangleImageAsset<RectangleImageRepresentationRecord>;
export type RectangleImageAssetValidation =
  | { ok: true; asset: RectangleImageAssetRecord; warnings: readonly ImageDiagnostic[] }
  | { ok: false; errors: readonly ImageDiagnostic[] };

function baseUrl(checker: ImageRecordChecker, path: string, value: string | null): URL | null {
  try { return value === null ? null : new URL(value); }
  catch { checker.fail(path, "base URL must be absolute"); return null; }
}

function checkRepresentation(checker: ImageRecordChecker, value: unknown, path: string, base: URL | null): RectangleImageRepresentationRecord | null {
  const record = checker.record(value, path);
  if (!record) return null;
  checker.keys(record, path, ["id", "role", "projection", "mimeType", "encodedBytes", "extensions", "width", "height", "url"]);
  checker.oneOf(record.projection, `${path}.projection`, ["rectangle"]);
  const common = checkImageRepresentationBase(checker, record, path, ["image"] as const);
  const width = checker.positiveInteger(record.width, `${path}.width`);
  const height = checker.positiveInteger(record.height, `${path}.height`);
  if (width !== null && height !== null && !isRectangleImageSize({ width, height })) checker.fail(path, "width and height are too large to address exactly");
  const url = resolveImageUrl(checker, record.url, `${path}.url`, base);
  if (!common || !width || !height || !url || record.projection !== "rectangle") return null;
  return { ...common, projection: "rectangle", width, height, url };
}

/**
 * Checks a persisted rectangle representation. Its source is an http(s) URL; a file
 * the user opened locally belongs to the session and is never a record.
 */
export function validateRectangleImageRepresentation(value: unknown, context: { path: string; baseUrl: string | null }): RepresentationValidation<RectangleImageRepresentationRecord> {
  const checker = new ImageRecordChecker();
  const representation = checkRepresentation(checker, value, context.path, baseUrl(checker, context.path, context.baseUrl));
  if (!representation || checker.errors.length) return { ok: false, errors: checker.errors };
  return { ok: true, representation, warnings: checker.warnings };
}

function checkAttribution(checker: ImageRecordChecker, value: unknown, path: string): ImageAttribution | null {
  const record = checker.record(value, path);
  if (!record) return null;
  checker.keys(record, path, ["text", "license", "url"]);
  const text = checker.text(record.text, `${path}.text`);
  const license = checker.text(record.license, `${path}.license`, true);
  const url = record.url === undefined ? null : resolveImageUrl(checker, record.url, `${path}.url`, null);
  if (!text) return null;
  return { text, ...(license ? { license } : {}), ...(url ? { url } : {}) };
}

/**
 * Checks a persisted `rectangle-image` asset: identity, revision, opaque sRGB and
 * exactly one `image` representation. Sphere assets keep their own validator,
 * which requires a cube preview.
 */
export function validateRectangleImageAsset(value: unknown, context: { path: string; baseUrl: string | null }): RectangleImageAssetValidation {
  const checker = new ImageRecordChecker();
  const { path } = context;
  const record = checker.record(value, path);
  if (!record) return { ok: false, errors: checker.errors };
  checker.keys(record, path, ["id", "revision", "type", "colorSpace", "alpha", "attribution", "representations", "extensions"]);
  const id = checker.id(record.id, `${path}.id`);
  const revision = checker.text(record.revision, `${path}.revision`);
  checker.oneOf(record.type, `${path}.type`, ["rectangle-image"]);
  checker.oneOf(record.colorSpace, `${path}.colorSpace`, ["srgb"]);
  checker.oneOf(record.alpha, `${path}.alpha`, ["opaque"]);
  const attribution = record.attribution === undefined ? undefined : checkAttribution(checker, record.attribution, `${path}.attribution`);
  const extensions = checker.extensions(record.extensions, `${path}.extensions`);
  const base = baseUrl(checker, path, context.baseUrl);
  const list = checker.array(record.representations, `${path}.representations`);
  if (list && list.length !== 1) checker.fail(`${path}.representations`, "must hold exactly one image representation");
  const representation = list?.length === 1 ? checkRepresentation(checker, list[0], `${path}.representations[0]`, base) : null;
  if (!id || !revision || !representation || attribution === null || checker.errors.length) return { ok: false, errors: checker.errors };
  const asset: RectangleImageAssetRecord = {
    id, revision, type: "rectangle-image", colorSpace: "srgb", alpha: "opaque",
    ...(attribution ? { attribution } : {}), representations: [representation],
    ...(Object.keys(extensions).length ? { extensions } : {}),
  };
  return { ok: true, asset, warnings: checker.warnings };
}

export function isRectangleImageAssetRecord(value: unknown): value is { type: "rectangle-image" } {
  return isRecord(value) && value.type === "rectangle-image";
}

/**
 * Byte costs at native size: encoded input, RGBA decoded pixels, the source's
 * full mip chain and upload staging. An image wider or taller than the device
 * allows is refused, never reduced.
 */
export function estimateRectangleImage(record: Pick<RectangleImageRepresentationRecord, "width" | "height" | "encodedBytes">, context: { maxTextureSide: number }): ImageEstimate {
  if (record.width > context.maxTextureSide || record.height > context.maxTextureSide) throw new RangeError(`The ${record.width} × ${record.height} image exceeds this device's ${context.maxTextureSide}-texel texture limit.`);
  const decoded = 4 * record.width * record.height;
  return { encoded: record.encodedBytes, decoded, sourceGpu: rgba8Bytes(record.width, record.height), uploadOutstanding: decoded };
}

export function rectangleImageFile(record: Pick<RectangleImageRepresentationRecord, "url" | "mimeType" | "width" | "height">): ImageFile {
  return { url: record.url, mimeType: record.mimeType, width: record.width, height: record.height };
}

export const rectangleImageRepresentation: RepresentationHooks<RectangleImageRepresentationRecord> = {
  projection: "rectangle", validate: validateRectangleImageRepresentation,
  files: record => [rectangleImageFile(record)],
  filePath: () => ".url",
  estimate: estimateRectangleImage,
};
