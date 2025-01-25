import { TransformComponent } from '../components'
import { EntityComponentSystem } from '../entity-component-system'
import { GPUDataInterface } from '../GPUDataInterface'
import { GPUMaterial, PbrMaterial } from '../material'
import { GPUTextureData } from '../systems/Renderer'
import { DefaultTextures, GltfAssetLoader } from './GltfAssetLoader'
import { TextureAssetLoader } from './TextureAssetLoader'

export type AssetInfo = {
  identifier: string
  path: string
}

const defaultTexturesInfo: AssetInfo[] = [
  { identifier: 'error', path: '/assets/textures/error.png' },
  { identifier: '1x1_white', path: '/assets/textures/1x1_white.png' },
  { identifier: '1x1_black', path: '/assets/textures/1x1_black.png' },
  { identifier: '1x1_default_normal', path: '/assets/textures/1x1_default_normal.png' },
]

export class AssetManager {
  public defaultMaterial!: GPUMaterial
  private gltfAssetLoaders: Map<string, GltfAssetLoader> = new Map()
  private textureAssetLoaders: Map<string, TextureAssetLoader> = new Map()

  constructor() {}

  public async loadDefaultAssets(gpuDataInterface: GPUDataInterface) {
    await Promise.all(defaultTexturesInfo.map((assetInfo) => this.loadTextureData(assetInfo).then(() => this.loadTextureToGpu(assetInfo.identifier, gpuDataInterface))))

    const defaultTextures: DefaultTextures = {
      white: this.getTextureData('1x1_white'),
      black: this.getTextureData('1x1_black'),
      normal: this.getTextureData('1x1_default_normal'),
    }
    this.defaultMaterial = gpuDataInterface.createPbrMaterial(PbrMaterial.fromDefaultTextures(defaultTextures))
  }

  public async loadGltfData({ identifier, path }: AssetInfo) {
    const loader = new GltfAssetLoader(path)
    this.gltfAssetLoaders.set(identifier, loader)

    await loader.loadAssetData()
  }

  public loadGltfToGpu(identifier: string, gpuDataInterface: GPUDataInterface) {
    if (!this.gltfAssetLoaders.has(identifier)) {
      throw 'No gltf loaded with identifier ' + identifier
    }
    const defaultTextures: DefaultTextures = {
      white: this.getTextureData('1x1_white'),
      black: this.getTextureData('1x1_black'),
      normal: this.getTextureData('1x1_default_normal'),
    }
    this.gltfAssetLoaders.get(identifier)?.writeAssetDataToGPU(gpuDataInterface, defaultTextures)
  }

  public spawnGltf(identifier: string, ecs: EntityComponentSystem, parentTransform?: TransformComponent) {
    if (!this.gltfAssetLoaders.has(identifier)) {
      throw 'No gltf loaded with identifier ' + identifier
    }
    this.gltfAssetLoaders.get(identifier)?.createEntities(ecs, this.defaultMaterial, parentTransform)
  }

  public async loadTextureData({ identifier, path }: AssetInfo) {
    const loader = new TextureAssetLoader(path)
    this.textureAssetLoaders.set(identifier, loader)
    await loader.loadAssetData()
  }

  public loadTextureToGpu(identifier: string, gpuDataInterface: GPUDataInterface) {
    if (!this.textureAssetLoaders.has(identifier)) {
      throw 'No texture loaded with identifier ' + identifier
    }
    this.textureAssetLoaders.get(identifier)?.writeTextureDataToGpu(gpuDataInterface)
  }

  public getTextureData(identifier: string): GPUTextureData {
    if (!this.textureAssetLoaders.has(identifier)) {
      throw 'No texture loaded with identifier ' + identifier
    }
    return this.textureAssetLoaders.get(identifier)!.getTextureData()
  }
}
