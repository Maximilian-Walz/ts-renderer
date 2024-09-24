import { Vec3, Vec4, vec3, vec4 } from 'wgpu-matrix'

export type TextureIdentifier = {
  textureId: number
  texCoordId: number
}

export abstract class Material {
  bindGroup?: GPUBindGroup
  abstract getBindGroupLayout(): GPUBindGroupLayout | undefined
}

export class BasicMaterial extends Material {
  albedoFactor: Vec4 = vec4.fromValues(1, 1, 1, 1)
  metallicFactor: number = 1
  roughnessFactor: number = 1
  emissiveFactor: Vec3 = vec3.fromValues(0, 0, 0)

  static bindGroupLayout?: GPUBindGroupLayout
  static bindGroupLayoutDescriptor: GPUBindGroupLayoutDescriptor = {
    label: 'Basic Material',
    entries: [],
  }

  getBindGroupLayout(): GPUBindGroupLayout | undefined {
    return BasicMaterial.bindGroupLayout!
  }
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

  static bindGroupLayout?: GPUBindGroupLayout
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

  getBindGroupLayout(): GPUBindGroupLayout | undefined {
    return PbrMaterial.bindGroupLayout
  }
}
