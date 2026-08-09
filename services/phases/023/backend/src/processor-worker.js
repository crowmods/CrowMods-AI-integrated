/*
  Media processing worker contract.

  Production implementation:
  - download only quarantined image objects;
  - verify content type using file signatures, not filename alone;
  - decode with a maintained image library;
  - enforce pixel-count, memory and decompression limits;
  - strip unwanted metadata where appropriate;
  - resize into approved dimensions;
  - generate WebP/AVIF variants where supported;
  - store optimized variants in controlled storage;
  - mark the asset READY only after successful validation.

  Keep this worker isolated from the public API.
*/

async function processMedia(asset){
  return {
    status:"NOT_IMPLEMENTED",
    assetId:asset.id,
    message:"Connect an isolated image-processing worker."
  };
}

module.exports={processMedia};
