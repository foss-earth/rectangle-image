import type { RepresentationHooks } from "@foss-earth/images";
import { rectangleImageRepresentation, sameRectangleAspect, type RectangleImageRepresentationRecord } from "@foss-earth/rectangle-image";
import { RECTANGLE_IMAGE_GLSL, RECTANGLE_IMAGE_WGSL } from "@foss-earth/rectangle-image/shaders";
import type { RectangleImageLoadPorts } from "@foss-earth/rectangle-image/browser";
import type { WholeImageTexture } from "@foss-earth/images/browser";
const hooks: RepresentationHooks<RectangleImageRepresentationRecord> = rectangleImageRepresentation;
console.log(hooks.projection, sameRectangleAspect({ width: 2, height: 1 }, { width: 4, height: 2 }), RECTANGLE_IMAGE_WGSL.length + RECTANGLE_IMAGE_GLSL.length);
export type RectangleHostUpload = RectangleImageLoadPorts<WholeImageTexture>["uploadRectangle"];
