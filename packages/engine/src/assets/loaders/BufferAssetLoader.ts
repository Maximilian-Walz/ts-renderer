import { GPUDataInterface } from "../../GPUDataInterface"
import { AssetLoader, AssetLoaderId } from "./AssetLoader"

export class BufferAssetLoader extends AssetLoader<GPUBuffer> {
  private bufferData: Uint8Array
  private usage: GPUBufferUsageFlags

  constructor(
    gpuDataInterface: GPUDataInterface,
    id: AssetLoaderId,
    bufferData: Uint8Array,
    usage: GPUBufferUsageFlags,
    displayName?: string
  ) {
    super(gpuDataInterface, id, displayName)
    this.bufferData = bufferData
    this.usage = usage
  }

  public loadAssetDataToGPU(): void {
    this.gpuAssetData = this.gpuDataInterface.createBuffer(this.bufferData, this.usage)
  }

  public unloadAssetDatoFromGPU(): void {
    this.gpuAssetData.destroy()
  }
}
