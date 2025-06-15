import { EntityId } from '../scenes/Entity'
import { Scene } from '../scenes/Scene'
import { RenderingData } from './renderers/Renderer'
import RenderingStage from './RenderingStage'

export default class RenderingProcedure {
  private device: GPUDevice
  private stages: RenderingStage[]

  constructor(device: GPUDevice, stages: RenderingStage[]) {
    this.device = device
    this.stages = stages
  }

  public execute(context: GPUCanvasContext, scene: Scene, cameraId: EntityId) {
    const commandEncoder = this.device.createCommandEncoder()

    const renderingData: RenderingData = {
      target: context.getCurrentTexture().createView(),
      width: context.canvas.width,
      height: context.canvas.height,
      scene: scene,
      cameraId: cameraId,
    }

    this.stages.forEach((stage) => stage.execute(commandEncoder, renderingData))

    this.device.queue.submit([commandEncoder.finish()])
  }
}
