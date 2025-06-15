import { EntityId } from '../../scenes/Entity'
import { Scene } from '../../scenes/Scene'

export type RenderingData = {
  target: GPUTextureView
  depth?: GPUTextureView
  scene: Scene
  cameraId: EntityId
  width: number
  height: number
}

export abstract class Renderer {
  protected device: GPUDevice

  constructor(device: GPUDevice) {
    this.device = device
  }

  public abstract render(commandEncoder: GPUCommandEncoder, renderingData: RenderingData): RenderingData
}
