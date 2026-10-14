import { loadWholeImage, type LoadedWholeImage, type WholeImagePorts, type WholeImageTexture } from "@foss-earth/images/browser";
import { estimateRectangleImage, rectangleImageFile, type RectangleImageRepresentationRecord } from "../representation.js";

export interface RectangleImageLoadPorts<T extends WholeImageTexture> extends WholeImagePorts<T> {
  /** Settles only after the supplied uploader has stopped reading the bitmap. */
  uploadRectangle(image: ImageBitmap, label: string): Promise<T>;
  label: string;
}

/**
 * Loads a rectangle image at its native size through the host's broker, file
 * service, decoder and uploader. `settleReplacement()` follows the host's
 * visibility swap; `dispose()` ends the operation.
 */
export function loadRectangleImage<T extends WholeImageTexture>(record: RectangleImageRepresentationRecord, ports: RectangleImageLoadPorts<T>): Promise<LoadedWholeImage<T>> {
  return loadWholeImage({
    file: rectangleImageFile(record),
    encodedBytes: record.encodedBytes,
    estimate: () => estimateRectangleImage(record, ports),
    upload: (image, label) => ports.uploadRectangle(image, label),
    label: ports.label,
    kind: "rectangle image",
  }, ports);
}
