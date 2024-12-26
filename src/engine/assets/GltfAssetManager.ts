import { GltfAsset, GltfLoader } from 'gltf-loader-ts'
import { Material as GltfMaterial, TextureInfo } from 'gltf-loader-ts/lib/gltf'
import { vec3, vec4 } from 'wgpu-matrix'
import { EntityComponentSystem } from '../entity-component-system'
import { BasicMaterial, Material, PbrMaterial, TextureIdentifier } from '../material'
import { SceneLoader } from './SceneLoader'

export enum BufferTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

export type Buffer = {
  data: Uint8Array
  target?: BufferTarget
}

export enum TextureWrapMode {
  CLAMP_TO_EDGE = 'clamp-to-edge',
  MIRRORED_REPEAT = 'mirrored-repeat',
  REPEAT = 'repeat',
}

export enum TextureFilterMode {
  NEAREST = 'nearest',
  LINEAR = 'linear',
}

export type SamplerData = {
  wrapS: TextureWrapMode
  wrapT: TextureWrapMode
  magFilter: TextureFilterMode
  minFilter: TextureFilterMode
  mipMapFilter?: TextureFilterMode
}

export type TextureData = {
  image: HTMLImageElement
  sampler?: SamplerData
}

export class GltfAssetManager {
  private ecs: EntityComponentSystem
  private gltfLoader: GltfLoader

  buffers: Buffer[] = []
  textures: TextureData[] = []

  materials: Material[] = []
  defaultMaterial: Material

  constructor(ecs: EntityComponentSystem) {
    this.ecs = ecs
    this.gltfLoader = new GltfLoader()
    this.defaultMaterial = new BasicMaterial()
  }

  static mapTextureWrapMode(wrapMode?: number): TextureWrapMode {
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

  static mapTextureFilterMode(filterMode?: number): TextureFilterMode {
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

  static mapMipMapFilterMode(filterMode?: number): TextureFilterMode | undefined {
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

  async loadSceneFromGltf(path: string) {
    const asset = await this.gltfLoader.load(path)
    await this.loadBuffers(asset)
    await this.loadTextures(asset)
    this.createMaterials(asset)

    const sceneLoader = new SceneLoader(this.ecs, asset)
    sceneLoader.createEntities()
    console.log('Finished loading ' + path)
  }

  async loadBuffers(asset: GltfAsset) {
    if (asset.gltf.bufferViews) {
      await Promise.all(
        asset.gltf.bufferViews.map(async (bufferView, index) =>
          asset.bufferViewData(index).then((data) => {
            this.buffers[index] = {
              data: data,
              target: bufferView.target,
            }
          })
        )
      )
    }
  }

  async loadTextures(asset: GltfAsset) {
    if (asset.gltf.textures) {
      await Promise.all(
        asset.gltf.textures.map(async (texture, index) =>
          asset.imageData.get(texture.source!).then((imageElement) => {
            let samplerData
            if (texture.sampler) {
              const sampler = asset.gltf.samplers![texture.sampler]
              samplerData = {
                wrapS: GltfAssetManager.mapTextureWrapMode(sampler.wrapS),
                wrapT: GltfAssetManager.mapTextureWrapMode(sampler.wrapT),
                magFilter: GltfAssetManager.mapTextureFilterMode(sampler.magFilter),
                minFilter: GltfAssetManager.mapTextureFilterMode(sampler.minFilter),
                mipMapFilter: GltfAssetManager.mapMipMapFilterMode(sampler.minFilter),
              }
            }
            this.textures[index] = {
              image: imageElement,
              sampler: samplerData,
            }
          })
        )
      )
    }
  }

  createMaterials(asset: GltfAsset) {
    asset.gltf.materials?.forEach((materialData, index) => {
      let material
      // TODO: remove '&& false'
      if (GltfAssetManager.hasNoTexture(materialData) && false) {
      } else {
        material = new PbrMaterial()
        if (materialData.pbrMetallicRoughness) {
          const pbr = materialData.pbrMetallicRoughness
          material.albedoTexture = GltfAssetManager.parseTextureInfo(pbr.baseColorTexture)
          material.metallicRoughnessTexture = GltfAssetManager.parseTextureInfo(pbr.metallicRoughnessTexture)
        }
        material.normalTexture = GltfAssetManager.parseTextureInfo(materialData.normalTexture as TextureInfo)
        material.occlusionTexture = GltfAssetManager.parseTextureInfo(materialData.occlusionTexture as TextureInfo)
        material.emissiveTexture = GltfAssetManager.parseTextureInfo(materialData.emissiveTexture as TextureInfo)
      }
      // In both cases, set factors
      if (materialData.pbrMetallicRoughness) {
        const pbr = materialData.pbrMetallicRoughness
        if (pbr.baseColorFactor) material.albedoFactor = vec4.fromValues(...pbr.baseColorFactor)
        if (pbr.metallicFactor) material.metallicFactor = pbr.metallicFactor
        if (pbr.roughnessFactor) material.roughnessFactor = pbr.roughnessFactor
      }
      if (materialData.emissiveFactor) material.emissiveFactor = vec3.fromValues(...materialData.emissiveFactor)

      this.materials[index] = material
    })
  }

  static parseTextureInfo(textureInfo: TextureInfo | undefined): TextureIdentifier | undefined {
    if (textureInfo) {
      return {
        textureId: textureInfo.index,
        texCoordId: (textureInfo.texCoord ??= 0),
      }
    }
  }

  static hasNoTexture(materialData: GltfMaterial): boolean {
    return (
      materialData.pbrMetallicRoughness?.baseColorTexture == undefined &&
      materialData.pbrMetallicRoughness?.metallicRoughnessTexture == undefined &&
      materialData.normalTexture == undefined &&
      materialData.occlusionTexture == undefined &&
      materialData.emissiveTexture == undefined
    )
  }
}
