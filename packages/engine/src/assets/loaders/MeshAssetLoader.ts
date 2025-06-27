import { GPUDataInterface } from "../../GPUDataInterface"
import { Mesh } from "../Mesh"
import { AssetLoader, AssetLoaderId } from "./AssetLoader"

export class MeshAssetLoader extends AssetLoader<Mesh> {
  constructor(gpuDataInterface: GPUDataInterface, id: AssetLoaderId, meshData: Mesh, displayName?: string) {
    super(gpuDataInterface, id, displayName)
    this.gpuAssetData = meshData
  }

  protected loadAssetDataToGPU(): void {
    this.gpuAssetData.indexBufferAccessor.buffer.registerUsage()
    this.gpuAssetData.vertexAttributes.forEach((accessor) => {
      accessor.buffer.registerUsage()
    })
  }

  protected unloadAssetDatoFromGPU(): void {
    this.gpuAssetData.indexBufferAccessor.buffer.deregisterUsage()
    this.gpuAssetData.vertexAttributes.forEach((accessor) => accessor.buffer.deregisterUsage())
  }
}
