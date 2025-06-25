import { vec3, Vec3, Vec4, vec4 } from 'wgpu-matrix'
import { BufferBindGroupData } from '../../../rendering/bind-group-data/BufferBindGroupData'
import { GPUTextureData } from '../../../systems/RendererSystem'
import { AssetManager } from '../../AssetManager'
import { GBufferFormat, MaterialProps, TextureIdentifier } from '../Material'
import defaultProjection from '../defaultProjection.vert.wgsl'
import { PbrMaterial } from './PbrMaterial'
import defaultPbrFrag from './defaultPbr.frag.wgsl'

export type DefaultTextures = {
  white: GPUTextureData
  black: GPUTextureData
  normal: GPUTextureData
}

export class DefaultPbrMaterialProps extends MaterialProps {
  name?: string
  albedoFactor: Vec4 = vec4.fromValues(1, 1, 1, 1)
  metallicFactor: number = 1
  roughnessFactor: number = 1
  emissiveFactor: Vec3 = vec3.fromValues(0, 0, 0)
  albedoTexture: TextureIdentifier
  metallicRoughnessTexture: TextureIdentifier
  normalTexture: TextureIdentifier
  occlusionTexture: TextureIdentifier
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

  static fromDefaultTextures(assetManager: AssetManager): DefaultPbrMaterialProps {
    return new DefaultPbrMaterialProps(
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_default_normal'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_white'), texCoordId: 0 },
      { textureData: assetManager.getTextureLoader('1x1_black'), texCoordId: 0 }
    )
  }

  public destroyGpuData() {
    throw new Error('Method not implemented.')
  }
}

export class DefaultPbrMaterial extends PbrMaterial {
  private bindGroup: GPUBindGroup

  private static pipeline: GPURenderPipeline
  private static bindGroupLayout: GPUBindGroupLayout

  constructor(materialProps: DefaultPbrMaterialProps, device: GPUDevice) {
    super()

    if (DefaultPbrMaterial.bindGroupLayout == undefined) {
      DefaultPbrMaterial.bindGroupLayout = device.createBindGroupLayout(DefaultPbrMaterial.getBindGroupLayoutDescritor())
    }

    if (DefaultPbrMaterial.pipeline == undefined) {
      DefaultPbrMaterial.pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({
          bindGroupLayouts: [BufferBindGroupData.getLayout(device), BufferBindGroupData.getLayout(device), DefaultPbrMaterial.bindGroupLayout],
        }),
        vertex: {
          module: device.createShaderModule({
            code: defaultProjection,
          }),
          buffers: this.getVertexDataMapping().map(({ format, stride }, index) => {
            return {
              arrayStride: stride,
              attributes: [
                {
                  shaderLocation: index,
                  offset: 0,
                  format: format,
                },
              ],
            }
          }),
        },
        fragment: {
          module: device.createShaderModule({
            code: defaultPbrFrag,
          }),
          targets: ['normal', 'albedo', 'orm', 'emission'].map((textureName) => {
            return { format: PbrMaterial.gBufferFormat[textureName as keyof GBufferFormat] }
          }),
        },
        depthStencil: {
          depthWriteEnabled: true,
          depthCompare: 'less',
          format: PbrMaterial.gBufferFormat.depth,
        },
        primitive: {
          topology: 'triangle-list',
          cullMode: 'back',
        },
      })
    }

    const bindGroupEntries = Array.of(
      materialProps.albedoTexture,
      materialProps.metallicRoughnessTexture,
      materialProps.normalTexture,
      materialProps.occlusionTexture,
      materialProps.emissiveTexture
    ).flatMap((textureIdentifier, i) => {
      const textureData = textureIdentifier.textureData.getAssetData()
      return [
        {
          binding: 2 * i,
          resource: textureData.texture.createView(),
        },
        {
          binding: 2 * i + 1,
          resource: textureData.sampler,
        },
      ]
    })

    this.bindGroup = device.createBindGroup({
      layout: DefaultPbrMaterial.bindGroupLayout,
      entries: bindGroupEntries,
    })
  }

  public getBindGroup(): GPUBindGroup {
    return this.bindGroup
  }
  public getPipeline(): GPURenderPipeline {
    return DefaultPbrMaterial.pipeline
  }

  private static getBindGroupLayoutDescritor(): GPUBindGroupLayoutDescriptor {
    return {
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
  }
}
