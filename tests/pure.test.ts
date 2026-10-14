import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(new URL(`../src/${file}`, import.meta.url), "utf8");
const imports = (file: string) => [...source(file).matchAll(/\bfrom\s+"([^"]+)"/g)].map(match => match[1]);

describe("entry boundaries", () => {
  it("keeps the root, core and shader entries free of browser, renderer and Babylon imports", async () => {
    for (const file of ["index.ts", "core.ts", "representation.ts", "shaders.ts"]) {
      for (const specifier of imports(file)) expect(specifier, file).toMatch(/^(\.\/|@foss-earth\/images$)/);
    }
    const [root, shaders] = await Promise.all([import("../src/index.js"), import("../src/shaders.js")]);
    expect(Object.keys(root).length).toBeGreaterThan(0);
    expect(Object.keys(shaders)).toEqual(["RECTANGLE_IMAGE_WGSL", "RECTANGLE_IMAGE_GLSL"]);
    expect(typeof globalThis.document).toBe("undefined");
  });
  it("keeps renderer use behind the optional Babylon entry", () => {
    expect(imports("browser/index.ts")).toEqual(["@foss-earth/images/browser", "../representation.js"]);
    expect(imports("browser/babylon.ts")).toEqual(["@foss-earth/images", "@foss-earth/renderer/babylon"]);
  });
});
