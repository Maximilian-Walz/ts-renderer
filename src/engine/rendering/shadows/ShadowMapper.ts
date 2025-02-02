import { CameraData, LightData, ModelData } from '../../systems/Renderer'

export abstract class ShadowMapper {
  protected device: GPUDevice

  constructor(device: GPUDevice) {
    this.device = device
  }

  public abstract renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], lightData: LightData, cameraData: CameraData): void
}
