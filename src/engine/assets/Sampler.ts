enum TextureWrapMode {
  CLAMP_TO_EDGE = 'clamp-to-edge',
  MIRRORED_REPEAT = 'mirrored-repeat',
  REPEAT = 'repeat',
}

enum TextureFilterMode {
  NEAREST = 'nearest',
  LINEAR = 'linear',
}

type SamplerData = {
  wrapS: TextureWrapMode
  wrapT: TextureWrapMode
  magFilter: TextureFilterMode
  minFilter: TextureFilterMode
  mipMapFilter?: TextureFilterMode
}
