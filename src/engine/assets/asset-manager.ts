import { GltfLoader } from 'gltf-loader-ts'
import { EntityComponentSystem } from '../entity-component-system'
import { SceneLoader } from './scene-loader'

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

export class AssetManager {
  private ecs: EntityComponentSystem
  private gltfLoader: GltfLoader

  buffers: Buffer[] = []
  textures: TextureData[] = []

  constructor(ecs: EntityComponentSystem) {
    this.ecs = ecs
    this.gltfLoader = new GltfLoader()
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
    console.log('Finished loading ' + path)
    SceneLoader.createEntitiesFromGltf(this.ecs, asset.gltf)

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

    if (asset.gltf.textures) {
      await Promise.all(
        asset.gltf.textures.map(async (texture, index) =>
          asset.imageData.get(texture.source!).then((imageElement) => {
            let samplerData
            if (texture.sampler) {
              const sampler = asset.gltf.samplers![texture.sampler]
              samplerData = {
                wrapS: AssetManager.mapTextureWrapMode(sampler.wrapS),
                wrapT: AssetManager.mapTextureWrapMode(sampler.wrapT),
                magFilter: AssetManager.mapTextureFilterMode(sampler.magFilter),
                minFilter: AssetManager.mapTextureFilterMode(sampler.minFilter),
                mipMapFilter: AssetManager.mapMipMapFilterMode(sampler.minFilter),
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
}
