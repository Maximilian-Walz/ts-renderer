import { CameraData, LightData, ModelData } from '../systems/Renderer'

export interface RenderStrategy {
  setRenderingDevice(device: GPUDevice): void
  setBuffers(buffers: GPUBuffer[]): void
  setRenderingContext(context: GPUCanvasContext): void
  render(modelsData: ModelData[], lightsData: LightData[], cameraData: CameraData): void
}
