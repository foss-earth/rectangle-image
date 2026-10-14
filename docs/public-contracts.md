# Public contracts

## Plane and texture coordinates

A rectangle image's plane is measured in that image's own pixels. The origin is the
top-left corner, x grows right and y grows down. The plane spans
`[0, width] × [0, height]`. Texel `(i, j)` covers `[i, i + 1) × [j, j + 1)` and
its centre is `(i + 0.5, j + 0.5)`. Texture coordinates are `u = x / width` and
`v = y / height`, matching how the uploader stores rows top first.

`rectangleTexelAt` gives the texel under a point, or `null` outside the image and on
its right and bottom edges. `rectangleCovers` includes the edges.

## Aspect and registration

`sameRectangleAspect(a, b)` compares `a.width × b.height` with `b.width × a.height`
exactly, with no rounding at any size. Odd-sized half-resolution images usually
differ from their reference by a fraction of a pixel and so do not match.
Matching aspect does not establish that two photographs share a framing; the
viewer decides registration. `mapRectanglePlanePoint` maps a point between two
images assumed to share a framing, and refuses differing aspect ratios.

## Records and validation

`RectangleImageRepresentationRecord` has `role: "image"`, `projection: "rectangle"`,
positive whole `width` and `height` in texels, a JPEG or PNG MIME type, the
file's encoded bytes, an http(s) `url` and optional namespaced extensions.
`validateRectangleImageRepresentation` resolves the URL against the supplied
document URL and refuses `file:` and `blob:` sources, credentials, sphere
roles and unknown fields. The schema is exported at `./schema.json`.

`validateRectangleImageAsset` checks a `rectangle-image` asset: `id`, `revision`,
`colorSpace: "srgb"`, `alpha: "opaque"`, an optional `attribution` and exactly
one image representation.

## Estimates

`estimateRectangleImage(record, { maxTextureSide })` returns encoded bytes, RGBA
decoded bytes, the source's complete mip chain and upload staging. An image
wider or taller than `maxTextureSide` is refused with a `RangeError` naming
both sizes; it is never reduced. The host's shared image pools decide whether
the bytes are admitted.

## Loading

`loadRectangleImage(record, ports)` runs the common `loadWholeImage` lifecycle from
`@foss-earth/images/browser`: it reserves source GPU bytes, reads, decodes and
uploads the file at its native size, keeps the decoded input held until the
upload settles, and disposes a texture that arrives after its scope ended.
`createRectangleUploadAdapter` submits one 2D texture to the host's uploader with the
same color storage as sphere images, so both are sampled in linear light.

## Shader fragments

`RECTANGLE_IMAGE_WGSL` and `RECTANGLE_IMAGE_GLSL` define `rectangleImageUv(plane, size)`,
`rectangleImageCoverage(plane, size)` and `rectangleNearestTexelUv(uv, size)`. The last
moves coordinates to the centre of the texel under them; sampling there at
level 0 returns that texel's value whatever the texture's own filter is, so a
nearest-texel view changes no texture state shared with other users.
