import { GPUDataInterface } from '../GPUDataInterface'
import { GPUTextureData } from '../systems/Renderer'

export class TextureAssetLoader {
  private path: string
  private textureData!: ImageBitmap
  private gpuTextureData!: GPUTextureData

  constructor(path: string) {
    this.path = path
  }

  public async loadAssetData() {
    const res = await fetch(this.path)
    const blob = await res.blob()
    this.textureData = await createImageBitmap(blob, { colorSpaceConversion: 'none' })
  }

  public writeTextureDataToGpu(gpuDataInterface: GPUDataInterface) {
    this.gpuTextureData = gpuDataInterface.createTexture({ image: this.textureData })
  }

  public getTextureData(): GPUTextureData {
    return this.gpuTextureData
  }
}
