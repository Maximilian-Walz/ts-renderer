import { GPUDataInterface } from "../GPUDataInterface"
import { AssetLoader } from "./loaders/AssetLoader"
import { BufferAssetLoader } from "./loaders/BufferAssetLoader"
import { MaterialAssetLoader } from "./loaders/MaterialAssetLoader"
import { MeshAssetLoader } from "./loaders/MeshAssetLoader"
import { TextureAssetLoader, TextureData } from "./loaders/TextureAssetLoader"
import { MaterialCreator, MaterialProps } from "./materials/Material"
import { DefaultPbrMaterial, DefaultPbrMaterialProps } from "./materials/pbr/DefaultPbrMaterial"
import { Mesh } from "./Mesh"

import blackImage from "../../assets/textures/1x1_black.png"
import normalImage from "../../assets/textures/1x1_default_normal.png"
import whiteImage from "../../assets/textures/1x1_white.png"
import errorImage from "../../assets/textures/error.png"

const defaultTexturesInfo: { identifier: string; image: string }[] = [
  { identifier: "error", image: errorImage },
  { identifier: "1x1_white", image: whiteImage },
  { identifier: "1x1_black", image: blackImage },
  { identifier: "1x1_default_normal", image: normalImage },
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
  private materialAssetLoaders: Map<string, MaterialAssetLoader<any>> = new Map()
  private bufferAssetLoaders: Map<string, BufferAssetLoader> = new Map()

  constructor(gpuDataInterface: GPUDataInterface) {
    this.gpuDataInterface = gpuDataInterface
  }

  public async loadDefaultAssets() {
    await Promise.all(
      defaultTexturesInfo.map(({ identifier, image }) =>
        this.addTextureFromPath(identifier, image).then(() => this.getTextureLoader(identifier).registerUsage())
      )
    )
    this.addMaterial(
      "default",
      DefaultPbrMaterial,
      DefaultPbrMaterialProps.fromDefaultTextures(this),
      "Default Material"
    )
  }

  private getAssetLoader<LoaderType extends AssetLoader<any>>(
    assetLoaders: Map<string, LoaderType>,
    identifier: string
  ): LoaderType {
    if (!assetLoaders.has(identifier)) {
      console.warn(`No according asset loaded with identifier '${identifier}'`)
      return assetLoaders.get("error")!
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

  public addMaterial<T extends MaterialProps>(
    identifier: string,
    MaterialCreator: MaterialCreator<T>,
    materialProps: T,
    displayName?: string
  ) {
    const loader = new MaterialAssetLoader(this.gpuDataInterface, MaterialCreator, materialProps, displayName)
    this.materialAssetLoaders.set(identifier, loader)
  }

  public getMaterialLoader(identifier: string): MaterialAssetLoader<any> {
    return this.getAssetLoader(this.materialAssetLoaders, identifier)
  }

  public getMaterialLoaders(): Map<string, MaterialAssetLoader<any>> {
    return this.materialAssetLoaders
  }

  public addMesh(identifier: string, mesh: Mesh, displayName?: string) {
    const loader = new MeshAssetLoader(this.gpuDataInterface, mesh, displayName)
    this.meshAssetLoaders.set(identifier, loader)
  }

  public getMeshLoader(identifier: string): MeshAssetLoader {
    return this.getAssetLoader(this.meshAssetLoaders, identifier)
  }

  public getMeshLoaders(): Map<string, MeshAssetLoader> {
    return this.meshAssetLoaders
  }

  public addBuffer(identifier: string, buffer: Uint8Array, usage: GPUBufferUsageFlags, displayName?: string) {
    const loader = new BufferAssetLoader(this.gpuDataInterface, buffer, usage, displayName)
    this.bufferAssetLoaders.set(identifier, loader)
  }

  public getBufferLoader(identifier: string): BufferAssetLoader {
    return this.getAssetLoader(this.bufferAssetLoaders, identifier)
  }
}
