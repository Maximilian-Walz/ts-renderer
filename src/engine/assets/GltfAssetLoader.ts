import { GltfAsset, GltfLoader } from 'gltf-loader-ts'
import { TextureInfo } from 'gltf-loader-ts/lib/gltf'
import { vec3, vec4 } from 'wgpu-matrix'
import { TransformComponent } from '../components'
import { EntityComponentSystem } from '../entity-component-system'
import { GPUDataInterface } from '../GPUDataInterface'
import { DefaultTextures, GPUMaterial, Material, PbrMaterial, TextureIdentifier } from '../material'
import { GPUTextureData } from '../systems/Renderer'
import { GltfAssetEntityCreator } from './GltfAssetEntityCreator'

export enum BufferTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

export type GltfBuffer = {
  data: Uint8Array
  target?: BufferTarget
}

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

export type GltfTextureData = {
  image: ImageBitmap | HTMLImageElement
  sampler?: SamplerData
}

export type GltfAssetData = {
  buffers: GltfBuffer[]
  textures: GltfTextureData[]
  materials: Material[]
}

export type GPUAssetData = {
  buffers: GPUBuffer[]
  textures: GPUTextureData[]
  materials: GPUMaterial[]
}

export class GltfAssetLoader {
  private path: string
  private gltfAsset!: GltfAsset
  private gltfAssetData: GltfAssetData = {
    buffers: [],
    textures: [],
    materials: [],
  }
  private gpuAssetData: GPUAssetData = {
    buffers: [],
    textures: [],
    materials: [],
  }

  constructor(path: string) {
    this.path = path
  }

  public async loadAssetData() {
    const asset = await new GltfLoader().load(this.path)
    this.gltfAsset = asset
    await this.loadBuffers(asset)
    await this.loadTextures(asset)
  }

  public writeAssetDataToGPU(gpuDataInterface: GPUDataInterface, defaultTextures: DefaultTextures) {
    this.gpuAssetData.buffers = gpuDataInterface.createBuffers(this.gltfAssetData.buffers)
    this.gpuAssetData.textures = gpuDataInterface.createTextures(this.gltfAssetData.textures)
    this.createMaterials(this.gltfAsset, defaultTextures)
    this.gpuAssetData.materials = gpuDataInterface.createMaterials(this.gltfAssetData.materials)
  }

  public createEntities(ecs: EntityComponentSystem, defaultMaterial: GPUMaterial, parentTransform?: TransformComponent) {
    const entityCreator = new GltfAssetEntityCreator(ecs, this.gltfAsset.gltf, this.gpuAssetData, defaultMaterial)
    entityCreator.createEntities(parentTransform)
  }

  private async loadBuffers(asset: GltfAsset) {
    if (asset.gltf.bufferViews) {
      await Promise.all(
        asset.gltf.bufferViews.map(async (bufferView, index) =>
          asset.bufferViewData(index).then((data) => {
            this.gltfAssetData.buffers[index] = {
              data: data,
              target: bufferView.target,
            }
          })
        )
      )
    }
  }

  private async loadTextures(asset: GltfAsset) {
    if (asset.gltf.textures) {
      await Promise.all(
        asset.gltf.textures.map(async (texture, index) =>
          asset.imageData.get(texture.source!).then((imageElement) => {
            let samplerData
            if (texture.sampler) {
              const sampler = asset.gltf.samplers![texture.sampler]
              samplerData = {
                wrapS: GltfAssetLoader.mapTextureWrapMode(sampler.wrapS),
                wrapT: GltfAssetLoader.mapTextureWrapMode(sampler.wrapT),
                magFilter: GltfAssetLoader.mapTextureFilterMode(sampler.magFilter),
                minFilter: GltfAssetLoader.mapTextureFilterMode(sampler.minFilter),
                mipMapFilter: GltfAssetLoader.mapMipMapFilterMode(sampler.minFilter),
              }
            }
            this.gltfAssetData.textures[index] = {
              image: imageElement,
              sampler: samplerData,
            }
          })
        )
      )
    }
  }

  private createMaterials(asset: GltfAsset, defaultTextures: DefaultTextures) {
    asset.gltf.materials?.forEach((materialData, index) => {
      const material = PbrMaterial.fromDefaultTextures(defaultTextures)
      const pbr = materialData.pbrMetallicRoughness
      material.albedoTexture = this.parseTextureInfo(pbr?.baseColorTexture, defaultTextures.white)
      material.metallicRoughnessTexture = this.parseTextureInfo(pbr?.metallicRoughnessTexture, defaultTextures.white)
      material.normalTexture = this.parseTextureInfo(materialData.normalTexture as TextureInfo, defaultTextures.normal)
      material.occlusionTexture = this.parseTextureInfo(materialData.occlusionTexture as TextureInfo, defaultTextures.white)
      material.emissiveTexture = this.parseTextureInfo(materialData.emissiveTexture as TextureInfo, defaultTextures.black)

      if (materialData.pbrMetallicRoughness) {
        const pbr = materialData.pbrMetallicRoughness
        if (pbr.baseColorFactor) material.albedoFactor = vec4.fromValues(...pbr.baseColorFactor)
        if (pbr.metallicFactor) material.metallicFactor = pbr.metallicFactor
        if (pbr.roughnessFactor) material.roughnessFactor = pbr.roughnessFactor
      }
      if (materialData.emissiveFactor) material.emissiveFactor = vec3.fromValues(...materialData.emissiveFactor)
      this.gltfAssetData.materials[index] = material
    })
  }

  private parseTextureInfo(textureInfo: TextureInfo | undefined, fallbackTexture: GPUTextureData): TextureIdentifier {
    if (textureInfo) {
      return {
        textureData: this.gpuAssetData.textures[textureInfo.index],
        texCoordId: (textureInfo.texCoord ??= 0),
      }
    } else {
      return {
        textureData: fallbackTexture,
        texCoordId: 0,
      }
    }
  }

  private static mapTextureWrapMode(wrapMode?: number): TextureWrapMode {
    switch (wrapMode) {
      case 33071:
        return TextureWrapMode.CLAMP_TO_EDGE
      case 33648:
        return TextureWrapMode.MIRRORED_REPEAT
      case 10497:
        return TextureWrapMode.REPEAT
      default:
        return TextureWrapMode.REPEAT
    }
  }

  private static mapTextureFilterMode(filterMode?: number): TextureFilterMode {
    switch (filterMode) {
      case 9728:
        return TextureFilterMode.NEAREST
      case 9729:
        return TextureFilterMode.LINEAR
      case 9984:
        return TextureFilterMode.NEAREST
      case 9985:
        return TextureFilterMode.LINEAR
      case 9986:
        return TextureFilterMode.NEAREST
      case 9987:
        return TextureFilterMode.LINEAR
      default:
        return TextureFilterMode.NEAREST
    }
  }

  private static mapMipMapFilterMode(filterMode?: number): TextureFilterMode | undefined {
    switch (filterMode) {
      case 9984:
        return TextureFilterMode.NEAREST
      case 9985:
        return TextureFilterMode.NEAREST
      case 9986:
        return TextureFilterMode.LINEAR
      case 9987:
        return TextureFilterMode.LINEAR
      default:
        return undefined
    }
  }
}
export { DefaultTextures }
