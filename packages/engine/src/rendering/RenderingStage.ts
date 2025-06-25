import { Renderer, RenderingData } from "./renderers/Renderer"

export class RenderingStage {
  private renderer: Renderer

  constructor(renderer: Renderer) {
    this.renderer = renderer
  }

  public execute(commandEncoder: GPUCommandEncoder, renderingData: RenderingData) {
    this.renderer.render(commandEncoder, renderingData)
  }
}
