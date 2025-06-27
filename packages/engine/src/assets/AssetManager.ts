import { GPUDataInterface } from "../GPUDataInterface"
import { AssetLoader, AssetLoaderId } from "./loaders/AssetLoader"
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

const defaultTexturesInfo: { id: AssetLoaderId; image: string }[] = [
  { id: "error", image: errorImage },
  { id: "1x1_white", image: whiteImage },
  { id: "1x1_black", image: blackImage },
  { id: "1x1_default_normal", image: normalImage },
]

export enum AssetType {
  TEXTURE,
  MESH,
  BUFFER,
  MATERIAL,
}

export class AssetManager {
  private gpuDataInterface: GPUDataInterface

  private textureAssetLoaders: Map<AssetLoaderId, TextureAssetLoader> = new Map()
  private meshAssetLoaders: Map<AssetLoaderId, MeshAssetLoader> = new Map()
  private materialAssetLoaders: Map<AssetLoaderId, MaterialAssetLoader<any>> = new Map()
  private bufferAssetLoaders: Map<AssetLoaderId, BufferAssetLoader> = new Map()

  constructor(gpuDataInterface: GPUDataInterface) {
    this.gpuDataInterface = gpuDataInterface
  }

  public async loadDefaultAssets() {
    await Promise.all(
      defaultTexturesInfo.map(({ id, image }) =>
        this.addTextureFromPath(id, image).then(() => this.getTextureLoader(id).registerUsage())
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
    id: AssetLoaderId
  ): LoaderType {
    if (!assetLoaders.has(id)) {
      console.warn(`No according asset loaded with identifier '${id}'`)
      return assetLoaders.get("error")!
    }
    const loader = assetLoaders.get(id)!
    loader.registerUsage()
    return loader
  }

  public addTexture(id: AssetLoaderId, textureData: TextureData, displayName?: string) {
    const loader = new TextureAssetLoader(this.gpuDataInterface, id, textureData, displayName)
    this.textureAssetLoaders.set(id, loader)
  }

  public async addTextureFromPath(id: string, path: string, displayName?: string) {
    const loader = await TextureAssetLoader.fromPath(this.gpuDataInterface, id, path, displayName)
    this.textureAssetLoaders.set(id, loader)
  }

  public getTextureLoader(id: AssetLoaderId): TextureAssetLoader {
    return this.getAssetLoader(this.textureAssetLoaders, id)
  }

  public addMaterial<T extends MaterialProps>(
    id: AssetLoaderId,
    MaterialCreator: MaterialCreator<T>,
    materialProps: T,
    displayName?: string
  ) {
    const loader = new MaterialAssetLoader(this.gpuDataInterface, id, MaterialCreator, materialProps, displayName)
    this.materialAssetLoaders.set(id, loader)
  }

  public getMaterialLoader(id: string): MaterialAssetLoader<any> {
    return this.getAssetLoader(this.materialAssetLoaders, id)
  }

  public getMaterialLoaders(): Map<string, MaterialAssetLoader<any>> {
    return this.materialAssetLoaders
  }

  public addMesh(id: AssetLoaderId, mesh: Mesh, displayName?: string) {
    const loader = new MeshAssetLoader(this.gpuDataInterface, id, mesh, displayName)
    this.meshAssetLoaders.set(id, loader)
  }

  public getMeshLoader(identifier: string): MeshAssetLoader {
    return this.getAssetLoader(this.meshAssetLoaders, identifier)
  }

  public getMeshLoaders(): Map<string, MeshAssetLoader> {
    return this.meshAssetLoaders
  }

  public addBuffer(id: AssetLoaderId, buffer: Uint8Array, usage: GPUBufferUsageFlags, displayName?: string) {
    const loader = new BufferAssetLoader(this.gpuDataInterface, id, buffer, usage, displayName)
    this.bufferAssetLoaders.set(id, loader)
  }

  public getBufferLoader(id: AssetLoaderId): BufferAssetLoader {
    return this.getAssetLoader(this.bufferAssetLoaders, id)
  }
}
