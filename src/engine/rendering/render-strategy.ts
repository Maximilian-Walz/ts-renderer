import { CameraData, ModelData } from '../systems/renderer'

export interface RenderStrategy {
  setRenderingDevice(device: GPUDevice): void
  setBuffers(buffers: GPUBuffer[]): void
  setRenderingContext(context: GPUCanvasContext): void
  render(modelsData: ModelData[], cameraData: CameraData): void
}
