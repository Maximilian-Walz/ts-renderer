import { CameraData, LightData, ModelData } from '../systems/Renderer'

export interface RenderStrategy {
  render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData): void
}
