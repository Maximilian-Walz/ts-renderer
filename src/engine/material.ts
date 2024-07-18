import { Vec3, Vec4, vec3, vec4 } from 'wgpu-matrix'

export type TextureIdentifier = {
  textureId: number
  texCoordId: number
}

export abstract class Material {
  pipeline?: GPURenderPipeline
  bindGroup?: GPUBindGroup
}

export class BasicMaterial extends Material {
  albedoFactor: Vec4 = vec4.fromValues(1, 1, 1, 1)
  metallicFactor: number = 1
  roughnessFactor: number = 1
  emissiveFactor: Vec3 = vec3.fromValues(0, 0, 0)
}

export class PbrMaterial extends BasicMaterial {
  name?: string
  albedoTexture: TextureIdentifier | undefined
  metallicRoughnessTexture: TextureIdentifier | undefined
  normalTexture: TextureIdentifier | undefined
  normalStrength: number = 1
  occlusionTexture: TextureIdentifier | undefined
  occlusionFactor: number = 1
  emissiveTexture: TextureIdentifier | undefined
}
