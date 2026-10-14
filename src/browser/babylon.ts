import type { ImageSessionBroker, ImageOperationScope } from "@foss-earth/images";
import type { ImageTextureUploader, UploadedImageTexture } from "@foss-earth/renderer/babylon";

/**
 * Uploads a rectangle image as one 2D texture through the host's queue, the same
 * queue and color storage as sphere images, so both sample in linear light.
 */
export function createRectangleUploadAdapter(uploader: ImageTextureUploader, broker: ImageSessionBroker, scope: ImageOperationScope): (image: ImageBitmap, label: string) => Promise<UploadedImageTexture> {
  return (image, label) => uploader.upload({
    kind: "2d", images: [image], label, signal: scope.signal,
    reserveUpload(bytes, ticketLabel) {
      const result = broker.pools.reserve("uploadOutstanding", bytes, ticketLabel);
      if (!result.ok) throw new Error(result.reason);
      return result.reservation;
    },
    reserveDecodedStaging(bytes, ticketLabel) {
      const result = broker.pools.reserve("decoded", bytes, ticketLabel);
      if (!result.ok) throw new Error(result.reason);
      return result.reservation;
    },
  });
}
