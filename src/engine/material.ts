import { Vec3, Vec4, vec3, vec4 } from 'wgpu-matrix'

export type TextureIdentifier = {
  textureId: number | string
  texCoordId: number
}

export abstract class Material {
  bindGroup?: GPUBindGroup
  abstract getBindGroupLayout(): GPUBindGroupLayout
}

export class BasicMaterial extends Material {
  albedoFactor: Vec4 = vec4.fromValues(1, 1, 1, 1)
  metallicFactor: number = 1
  roughnessFactor: number = 1
  emissiveFactor: Vec3 = vec3.fromValues(0, 0, 0)

  static bindGroupLayout: GPUBindGroupLayout
  static bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Basic Material',
    entries: [],
  }

  getBindGroupLayout(): GPUBindGroupLayout {
    return BasicMaterial.bindGroupLayout
  }
}

export const allWhiteTextureIdentifier = {
  textureId: '1x1_white',
  texCoordId: 0,
} as TextureIdentifier

export const allBlackTextureIdentifier = {
  textureId: '1x1_black',
  texCoordId: 0,
} as TextureIdentifier

export const defaultNormalTextureIdentifier = {
  textureId: '1x1_default_normal',
  texCoordId: 0,
} as TextureIdentifier

export class PbrMaterial extends BasicMaterial {
  name?: string
  albedoTexture: TextureIdentifier = allWhiteTextureIdentifier
  metallicRoughnessTexture: TextureIdentifier = allWhiteTextureIdentifier
  normalTexture: TextureIdentifier = defaultNormalTextureIdentifier
  normalStrength: number = 1
  occlusionTexture: TextureIdentifier = allWhiteTextureIdentifier
  occlusionFactor: number = 1
  emissiveTexture: TextureIdentifier = allBlackTextureIdentifier

  static bindGroupLayout: GPUBindGroupLayout
  static bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'PBR Material',
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: {} }, // Albedo texture
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Albedo sampler
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: {} }, // Metallic-roughness texture
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Metallic-roughness sampler
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, texture: {} }, // Normal texture
      { binding: 5, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Normal sampler
      { binding: 6, visibility: GPUShaderStage.FRAGMENT, texture: {} }, // Occlusion texture
      { binding: 7, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Occlusion sampler
      { binding: 8, visibility: GPUShaderStage.FRAGMENT, texture: {} }, // Emissive texture
      { binding: 9, visibility: GPUShaderStage.FRAGMENT, sampler: {} }, // Emissive sampler
    ],
  }

  getBindGroupLayout(): GPUBindGroupLayout {
    return PbrMaterial.bindGroupLayout
  }
}
