import { RenderData } from '../systems/Renderer'

export interface RenderStrategy {
  render(sceneData: RenderData): void
}
