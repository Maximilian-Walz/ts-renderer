import { CameraData, ModelData, ShadowMapLightData } from '../../systems/Renderer'

export abstract class ShadowMapper {
  protected device: GPUDevice

  constructor(device: GPUDevice) {
    this.device = device
  }

  public abstract renderShadowMap(commandEncoder: GPUCommandEncoder, modelsData: ModelData[], shadowMappingData: ShadowMapLightData, cameraData: CameraData): void
}
