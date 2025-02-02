import { Vec3, Vec4, vec3, vec4 } from 'wgpu-matrix'
import { GPUTextureData } from '../systems/Renderer'
import { AssetManager } from './AssetManager'
import { TextureAssetLoader } from './loaders/TextureAssetLoader'

export class GPUMaterial {
  public bindGroup: GPUBindGroup

  constructor(bindGroup: GPUBindGroup) {
    this.bindGroup = bindGroup
  }
}

export type TextureIdentifier = {
  textureData: TextureAssetLoader
  texCoordId: number
}

export abstract class Material {
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

export type DefaultTextures = {
  white: GPUTextureData
  black: GPUTextureData
  normal: GPUTextureData
}

export class PbrMaterial extends BasicMaterial {
  name?: string
  albedoTexture: TextureIdentifier
  metallicRoughnessTexture: TextureIdentifier
  normalTexture: TextureIdentifier
  normalStrength: number = 1
  occlusionTexture: TextureIdentifier
  occlusionFactor: number = 1
  emissiveTexture: TextureIdentifier

  constructor(
    albedoTexture: TextureIdentifier,
    metallicRoughnessTexture: TextureIdentifier,
    normalTexture: TextureIdentifier,
    occlusionTexture: TextureIdentifier,
    emissiveTexture: TextureIdentifier
  ) {
    super()
    this.albedoTexture = albedoTexture
    this.metallicRoughnessTexture = metallicRoughnessTexture
    this.normalTexture = normalTexture
    this.occlusionTexture = occlusionTexture
    this.emissiveTexture = emissiveTexture
  }

  static fromDefaultTextures(assetManager: AssetManager): PbrMaterial {
    return new PbrMaterial(
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_default_normal'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_black'), texCoordId: 0 }
    )
  }

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
