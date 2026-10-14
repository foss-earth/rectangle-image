# @foss-earth/rectangle-image

Rectangle photograph support for FOSS Earth: representation records and validation,
pixel dimensions, plane and texture coordinates, byte estimates, loading through
the host's image services, and shader sampling fragments.

It follows the sphere representation packages' pattern. The host's image
viewer draws and navigates; this package creates no viewer, camera, gesture
handling, device, scene, scheduler or cache.

## What this repository owns

- Rectangle records, coordinates, estimates, loading and shader fragments: this package.
- Common codecs, color and orientation checks, the broker and file services:
  [images](https://github.com/foss-earth/images).
- Viewing, cameras, comparison and input: [sphere-image](https://github.com/foss-earth/sphere-image)
  (`@foss-earth/sphere-image`).
- The optional Babylon adapter uses [renderer](https://github.com/foss-earth/renderer).

## Exports

| Entry | Contents |
| --- | --- |
| `.` | Everything in `./core`, plus `RectangleImageRepresentationRecord`, `validateRectangleImageRepresentation`, `validateRectangleImageAsset`, `estimateRectangleImage`, `rectangleImageFile` and the `rectangleImageRepresentation` hooks. Pure. |
| `./core` | Plane conventions: `rectangleTextureCoordinates`, `rectanglePlanePoint`, `rectangleTexelCenter`, `rectangleTexelAt`, `rectangleCovers`, `sameRectangleAspect`, `mapRectanglePlanePoint`, `isRectangleImageSize`. Pure. |
| `./browser` | `loadRectangleImage(record, ports)` |
| `./babylon` | `createRectangleUploadAdapter(uploader, broker, scope)` |
| `./shaders` | `RECTANGLE_IMAGE_WGSL` and `RECTANGLE_IMAGE_GLSL` |
| `./schema.json` | The representation's JSON schema |

[Public contracts](docs/public-contracts.md) give the units and conventions.

## Records

A persisted rectangle photograph is a `rectangle-image` asset, with an id, a revision,
opaque sRGB pixels, an optional credit, and exactly one representation:

```json
{ "id": "photo", "role": "image", "projection": "rectangle", "mimeType": "image/jpeg",
  "encodedBytes": 412345, "width": 1920, "height": 1080, "url": "photo.jpg" }
```

The URL is http(s), absolute or relative to the document. A file the user opens
from disk belongs to that session: the host resolves it and never writes it into
a record. Sphere assets keep their own type, `panorama-image`, and their
validator still requires a cube preview.

## Dependencies

- `@foss-earth/images` is a runtime dependency.
- `@foss-earth/renderer` is an optional peer, used by `./babylon`.

## Development

The package depends on other `@foss-earth/*` libraries by versions that are not
published, so its own `npm install`, tests and build don't work on their own yet.
Develop it through the app, which uses libraries straight from their checkouts
(see [app, Local source](https://github.com/foss-earth/app#local-source)).

The scripts in `package.json` are `build`, `typecheck`, `lint`, `test` and
`typecheck:consumer`. Tests are in [tests](tests) and beside the sources.

## Project policies

- [Code of conduct](https://github.com/foss-earth/.github/blob/main/CODE_OF_CONDUCT.md)
- [Contributing](https://github.com/foss-earth/.github/blob/main/CONTRIBUTING.md)
- [AGPL-3.0 license](LICENSE)
- [Security](https://github.com/foss-earth/.github/blob/main/SECURITY.md)
