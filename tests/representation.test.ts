import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkImageRepresentationBase, ImageRecordChecker, rgba8Bytes, type RepresentationHooks } from "@foss-earth/images";
import { estimateRectangleImage, rectangleImageRepresentation, isRectangleImageAssetRecord, validateRectangleImageAsset, validateRectangleImageRepresentation, type RectangleImageRepresentationRecord } from "../src/index.js";

const base = "https://example.invalid/scenes/photos.json";
const record = { id: "photo", role: "image", projection: "rectangle", mimeType: "image/png", encodedBytes: 1234, width: 1920, height: 1080, url: "photo.png" };
const asset = { id: "reference", revision: "r1", type: "rectangle-image", colorSpace: "srgb", alpha: "opaque", representations: [record] };

describe("rectangle image records", () => {
  it("validates one image representation and resolves its URL against the document", () => {
    const result = validateRectangleImageRepresentation(record, { path: "$.image", baseUrl: base });
    expect(result).toEqual({ ok: true, representation: { ...record, url: "https://example.invalid/scenes/photo.png" }, warnings: [] });
  });
  it("refuses sphere roles, other projections, unknown fields and non-http sources", () => {
    const failures = (value: unknown) => {
      const result = validateRectangleImageRepresentation(value, { path: "$", baseUrl: base });
      return result.ok ? [] : result.errors.map(error => error.path);
    };
    expect(failures({ ...record, role: "immersion" })).toEqual(["$.role"]);
    expect(failures({ ...record, projection: "equirectangular" })).toEqual(["$.projection"]);
    expect(failures({ ...record, faceSize: 4 })).toEqual(["$.faceSize"]);
    expect(failures({ ...record, url: "file:///home/me/photo.png" })).toEqual(["$.url"]);
    expect(failures({ ...record, url: "blob:https://example.invalid/1" })).toEqual(["$.url"]);
    expect(failures({ ...record, width: 0, height: 1.5 })).toEqual(["$.width", "$.height"]);
  });
  it("leaves the sphere base check unchanged: a rectangle role is not a sphere role", () => {
    const checker = new ImageRecordChecker();
    expect(checkImageRepresentationBase(checker, record, "$")).toBeNull();
    expect(checker.errors.map(error => error.path)).toEqual(["$.role"]);
  });
  it("validates a rectangle-image asset with exactly one representation and optional credit", () => {
    const result = validateRectangleImageAsset({ ...asset, attribution: { text: "Synthetic", license: "CC0-1.0" } }, { path: "$.asset", baseUrl: base });
    expect(result.ok && result.asset.representations[0].url).toBe("https://example.invalid/scenes/photo.png");
    expect(result.ok && result.asset.attribution).toEqual({ text: "Synthetic", license: "CC0-1.0" });
    expect(validateRectangleImageAsset(asset, { path: "$", baseUrl: base }).ok).toBe(true);
    const paths = (value: unknown) => { const r = validateRectangleImageAsset(value, { path: "$", baseUrl: base }); return r.ok ? [] : r.errors.map(error => error.path); };
    expect(paths({ ...asset, type: "panorama-image" })).toEqual(["$.type"]);
    expect(paths({ ...asset, alpha: "straight" })).toEqual(["$.alpha"]);
    expect(paths({ ...asset, representations: [record, { ...record, id: "two" }] })).toEqual(["$.representations"]);
    expect(paths({ ...asset, representations: [{ ...record, role: "preview" }] })).toEqual(["$.representations[0].role"]);
    expect(paths({ ...asset, revision: "" })).toEqual(["$.revision"]);
    expect(isRectangleImageAssetRecord(asset)).toBe(true);
    expect(isRectangleImageAssetRecord({ ...asset, type: "panorama-image" })).toBe(false);
  });
  it("estimates native-size costs and refuses an image larger than the device allows", () => {
    const valid = validateRectangleImageRepresentation(record, { path: "$", baseUrl: base });
    if (!valid.ok) throw new Error("fixture");
    expect(estimateRectangleImage(valid.representation, { maxTextureSide: 4096 })).toEqual({ encoded: 1234, decoded: 4 * 1920 * 1080, sourceGpu: rgba8Bytes(1920, 1080), uploadOutstanding: 4 * 1920 * 1080 });
    expect(() => estimateRectangleImage({ ...valid.representation, height: 4097, width: 10 }, { maxTextureSide: 4096 })).toThrow(/10 × 4097 image exceeds this device's 4096-texel/);
  });
  it("offers the common representation hooks and schema", () => {
    const hooks: RepresentationHooks<RectangleImageRepresentationRecord> = rectangleImageRepresentation;
    const valid = hooks.validate(record, { path: "$", baseUrl: base });
    if (!valid.ok) throw new Error("fixture");
    expect([...hooks.files(valid.representation)]).toEqual([{ url: "https://example.invalid/scenes/photo.png", mimeType: "image/png", width: 1920, height: 1080 }]);
    expect(hooks.filePath?.(valid.representation, { url: "", mimeType: "image/png", width: 1, height: 1 }, 0)).toBe(".url");
    const schema = JSON.parse(readFileSync(new URL("../schema/representation.json", import.meta.url), "utf8"));
    expect(schema.properties.role.const).toBe("image");
    expect(schema.properties.projection.const).toBe("rectangle");
    expect(Object.keys(schema.properties).sort()).toEqual(["encodedBytes", "extensions", "height", "id", "mimeType", "projection", "role", "url", "width"]);
  });
});
