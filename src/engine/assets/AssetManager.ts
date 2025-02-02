import { GPUDataInterface } from '../GPUDataInterface'
import { AssetLoader } from './loaders/AssetLoader'
import { BufferAssetLoader } from './loaders/BufferAssetLoader'
import { MeshAssetLoader } from './loaders/MeshAssetLoader'
import { PbrMaterialAssetLoader } from './loaders/PbrMaterialAssetLoader'
import { TextureAssetLoader, TextureData } from './loaders/TextureAssetLoader'
import { PbrMaterial } from './Material'
import { Mesh } from './Mesh'

const defaultTexturesInfo: { identifier: string; path: string }[] = [
  { identifier: 'error', path: '/assets/textures/error.png' },
  { identifier: '1x1_white', path: '/assets/textures/1x1_white.png' },
  { identifier: '1x1_black', path: '/assets/textures/1x1_black.png' },
  { identifier: '1x1_default_normal', path: '/assets/textures/1x1_default_normal.png' },
]

export enum AssetType {
  TEXTURE,
  MESH,
  BUFFER,
  MATERIAL,
}

export class AssetManager {
  private gpuDataInterface: GPUDataInterface

  private textureAssetLoaders: Map<string, TextureAssetLoader> = new Map()
  private meshAssetLoaders: Map<string, MeshAssetLoader> = new Map()
  private materialAssetLoaders: Map<string, PbrMaterialAssetLoader> = new Map()
  private bufferAssetLoaders: Map<string, BufferAssetLoader> = new Map()

  constructor(gpuDataInterface: GPUDataInterface) {
    this.gpuDataInterface = gpuDataInterface
  }

  public async loadDefaultAssets() {
    await Promise.all(defaultTexturesInfo.map(({ identifier, path }) => this.addTextureFromPath(identifier, path).then(() => this.getTextureLoader(identifier).registerUsage())))
    this.addPbrMaterial('default', PbrMaterial.fromDefaultTextures(this), 'Default Material')
  }

  private getAssetLoader<LoaderType extends AssetLoader<any>>(assetLoaders: Map<string, LoaderType>, identifier: string): LoaderType {
    if (!assetLoaders.has(identifier)) {
      console.warn(`No according asset loaded with identifier '${identifier}'`)
      return assetLoaders.get('error')!
    }
    const loader = assetLoaders.get(identifier)!
    loader.registerUsage()
    return loader
  }

  public addTexture(identifier: string, textureData: TextureData, displayName?: string) {
    const loader = new TextureAssetLoader(this.gpuDataInterface, textureData, displayName)
    this.textureAssetLoaders.set(identifier, loader)
  }

  public async addTextureFromPath(identifier: string, path: string, displayName?: string) {
    const loader = await TextureAssetLoader.fromPath(this.gpuDataInterface, path, displayName)
    this.textureAssetLoaders.set(identifier, loader)
  }

  public getTextureLoader(identifier: string): TextureAssetLoader {
    return this.getAssetLoader(this.textureAssetLoaders, identifier)
  }

  public addPbrMaterial(identifier: string, material: PbrMaterial, displayName?: string) {
    const loader = new PbrMaterialAssetLoader(this.gpuDataInterface, material, displayName)
    this.materialAssetLoaders.set(identifier, loader)
  }

  public getMaterialLoader(identifier: string): PbrMaterialAssetLoader {
    return this.getAssetLoader(this.materialAssetLoaders, identifier)
  }

  public addMesh(identifier: string, mesh: Mesh, displayName?: string) {
    const loader = new MeshAssetLoader(this.gpuDataInterface, mesh, displayName)
    this.meshAssetLoaders.set(identifier, loader)
  }

  public getMeshLoader(identifier: string): MeshAssetLoader {
    return this.getAssetLoader(this.meshAssetLoaders, identifier)
  }

  public addBuffer(identifier: string, buffer: Uint8Array, usage: GPUBufferUsageFlags, displayName?: string) {
    const loader = new BufferAssetLoader(this.gpuDataInterface, buffer, usage, displayName)
    this.bufferAssetLoaders.set(identifier, loader)
  }

  public getBufferLoader(identifier: string): BufferAssetLoader {
    return this.getAssetLoader(this.bufferAssetLoaders, identifier)
  }
}
