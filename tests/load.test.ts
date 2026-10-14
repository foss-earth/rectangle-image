import { describe, expect, it, vi } from "vitest";
import { createImageSessionBroker } from "@foss-earth/images";
import type { EncodedImageFile, HeldDecodedImage, WholeImageTexture } from "@foss-earth/images/browser";
import { estimateRectangleImage, type RectangleImageRepresentationRecord } from "../src/index.js";
import { loadRectangleImage, type RectangleImageLoadPorts } from "../src/browser/index.js";

// Not a power of two in either direction, as most photographs are.
const record: RectangleImageRepresentationRecord = { id: "photo", role: "image", projection: "rectangle", mimeType: "image/jpeg", encodedBytes: 10, width: 6, height: 5, url: "https://example.invalid/photo.jpg" };
function fixture(maxTextureSide = 4096) {
  const broker = createImageSessionBroker({ pools: { encoded: 10000, decoded: 10000, sourceGpu: 10000, uploadOutstanding: 10000, overlap: 10000 }, requests: 1, decodes: 1 });
  const body: EncodedImageFile = { bytes: new Uint8Array([1]), contentType: "image/jpeg", release: vi.fn() };
  const pixels: HeldDecodedImage = { image: { width: 6, height: 5 } as ImageBitmap, close: vi.fn() };
  const texture: WholeImageTexture = { dispose: vi.fn() };
  const ports: RectangleImageLoadPorts<WholeImageTexture> = { broker, scope: broker.scope(), maxTextureSide, overlap: true, label: "photo",
    obtain: vi.fn(async () => body), decode: vi.fn(async () => pixels), uploadRectangle: vi.fn(async () => texture), whenReady: async (_value, signal) => signal.throwIfAborted() };
  return { broker, body, pixels, texture, ports };
}

describe("loading a rectangle image", () => {
  it("uploads the native-size image once and charges its estimate", async () => {
    const h = fixture(), loaded = await loadRectangleImage(record, h.ports);
    expect(h.ports.obtain).toHaveBeenCalledWith({ url: record.url, mimeType: "image/jpeg", width: 6, height: 5 }, 10);
    expect(h.ports.uploadRectangle).toHaveBeenCalledWith(h.pixels.image, "photo");
    expect(loaded.estimate).toEqual(estimateRectangleImage(record, h.ports));
    expect(h.broker.pools.stats().sourceGpu.reserved).toBe(loaded.estimate.sourceGpu);
    loaded.settleReplacement(); loaded.dispose();
    expect(h.texture.dispose).toHaveBeenCalledOnce(); expect(h.broker.pools.live()).toHaveLength(0); h.broker.dispose();
  });
  it("refuses an image over the device limit before reading it, instead of reducing it", async () => {
    const h = fixture(4);
    await expect(loadRectangleImage(record, h.ports)).rejects.toThrow(/6 × 5 image exceeds this device's 4-texel/);
    expect(h.ports.obtain).not.toHaveBeenCalled(); expect(h.broker.pools.live()).toHaveLength(0); h.broker.dispose();
  });
  it("never publishes an upload that finishes after its tab moved on", async () => {
    const h = fixture(); let arrive!: (texture: WholeImageTexture) => void;
    h.ports.uploadRectangle = vi.fn(() => new Promise(resolve => { arrive = resolve; }));
    const pending = loadRectangleImage(record, h.ports), rejected = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(h.ports.uploadRectangle).toHaveBeenCalledOnce());
    h.ports.scope.dispose(); arrive(h.texture); await rejected;
    expect(h.texture.dispose).toHaveBeenCalledOnce(); expect(h.broker.pools.live()).toHaveLength(0); h.broker.dispose();
  });
});
