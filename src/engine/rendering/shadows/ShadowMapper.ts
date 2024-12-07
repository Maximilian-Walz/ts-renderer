import { CameraData, LightData, ModelData } from '../../systems/Renderer'

export abstract class ShadowMapper {
  protected device: GPUDevice
  protected buffers: GPUBuffer[]

  constructor(device: GPUDevice, buffers: GPUBuffer[]) {
    this.device = device
    this.buffers = buffers
  }

  public abstract renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], lightData: LightData, cameraData: CameraData): void
}
