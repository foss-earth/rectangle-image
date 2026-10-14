import { describe, expect, it } from "vitest";
import { rectangleCovers, rectanglePlanePoint, rectangleTexelAt, rectangleTexelCenter, rectangleTextureCoordinates, isRectangleImageSize, mapRectanglePlanePoint, sameRectangleAspect } from "./core.js";

describe("rectangle plane conventions", () => {
  it("puts the origin at the top-left corner with y down, and texel centres at half pixels", () => {
    const size = { width: 4, height: 2 };
    expect(rectangleTextureCoordinates(size, { x: 0, y: 0 })).toEqual({ u: 0, v: 0 });
    expect(rectangleTextureCoordinates(size, { x: 4, y: 2 })).toEqual({ u: 1, v: 1 });
    expect(rectangleTextureCoordinates(size, rectangleTexelCenter({ i: 3, j: 0 }))).toEqual({ u: 0.875, v: 0.25 });
    expect(rectanglePlanePoint(size, { u: 0.5, v: 0.75 })).toEqual({ x: 2, y: 1.5 });
  });
  it("finds the texel under a point and leaves the far edges and outside to none", () => {
    const size = { width: 3, height: 2 };
    expect(rectangleTexelAt(size, { x: 0, y: 0 })).toEqual({ i: 0, j: 0 });
    expect(rectangleTexelAt(size, { x: 2.999, y: 1.5 })).toEqual({ i: 2, j: 1 });
    expect(rectangleTexelAt(size, { x: 3, y: 1 })).toBeNull();
    expect(rectangleTexelAt(size, { x: -0.001, y: 1 })).toBeNull();
    expect(rectangleTexelAt(size, { x: Number.NaN, y: 1 })).toBeNull();
    expect(rectangleCovers(size, { x: 3, y: 2 })).toBe(true);
    expect(rectangleCovers(size, { x: 3.001, y: 2 })).toBe(false);
  });
  it("compares aspect ratios exactly, including sizes whose products pass 2^53", () => {
    expect(sameRectangleAspect({ width: 960, height: 540 }, { width: 1920, height: 1080 })).toBe(true);
    // An odd-sized half-resolution input does not have the reference's aspect.
    expect(sameRectangleAspect({ width: 959, height: 540 }, { width: 1919, height: 1080 })).toBe(false);
    const big = Number.MAX_SAFE_INTEGER;
    expect(sameRectangleAspect({ width: big, height: big - 1 }, { width: big - 1, height: big - 2 })).toBe(false);
    expect(sameRectangleAspect({ width: big, height: big - 1 }, { width: big, height: big - 1 })).toBe(true);
  });
  it("maps the same place between same-framing images and refuses other aspect ratios", () => {
    expect(mapRectanglePlanePoint({ width: 960, height: 540 }, { width: 1920, height: 1080 }, { x: 480.25, y: 0.5 })).toEqual({ x: 960.5, y: 1 });
    expect(() => mapRectanglePlanePoint({ width: 959, height: 540 }, { width: 1920, height: 1080 }, { x: 0, y: 0 })).toThrow(RangeError);
  });
  it("accepts only positive whole sizes", () => {
    expect(isRectangleImageSize({ width: 1, height: 1 })).toBe(true);
    for (const size of [{ width: 0, height: 1 }, { width: 1.5, height: 1 }, { width: 2 ** 53, height: 1 }, { width: 1, height: -1 }]) {
      expect(isRectangleImageSize(size)).toBe(false);
      expect(() => rectangleTextureCoordinates(size, { x: 0, y: 0 })).toThrow(RangeError);
    }
  });
});
