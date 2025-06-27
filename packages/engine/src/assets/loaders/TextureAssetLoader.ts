import { GPUDataInterface } from "../../GPUDataInterface"
import { GPUTextureData } from "../../systems/RendererSystem"
import { AssetLoader, AssetLoaderId } from "./AssetLoader"

export type TextureData = ImageBitmap | HTMLImageElement

export class TextureAssetLoader extends AssetLoader<GPUTextureData> {
  private textureData: TextureData

  constructor(gpuDataInterface: GPUDataInterface, id: AssetLoaderId, textureData: TextureData, displayName?: string) {
    super(gpuDataInterface, id, displayName)
    this.textureData = textureData
  }

  public static async fromPath(
    gpuDataInterface: GPUDataInterface,
    id: AssetLoaderId,
    path: string,
    displayName?: string
  ): Promise<TextureAssetLoader> {
    const res = await fetch(path)
    const blob = await res.blob()
    return new TextureAssetLoader(
      gpuDataInterface,
      id,
      await createImageBitmap(blob, { colorSpaceConversion: "none" }),
      displayName
    )
  }

  protected loadAssetDataToGPU(): void {
    this.gpuAssetData = this.gpuDataInterface.createTexture(this.textureData)
  }

  protected unloadAssetDatoFromGPU(): void {
    this.gpuAssetData.texture.destroy()
  }
}
