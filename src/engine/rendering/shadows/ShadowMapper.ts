import { GPUDataInterface } from '../../GPUDataInterface'
import { CameraData, LightData, ModelData } from '../../systems/Renderer'

export abstract class ShadowMapper {
  protected device: GPUDevice
  protected gpuDataInterface: GPUDataInterface

  constructor(device: GPUDevice, gpuDataInterface: GPUDataInterface) {
    this.device = device
    this.gpuDataInterface = gpuDataInterface
  }

  public abstract renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], lightData: LightData, cameraData: CameraData): void
}
