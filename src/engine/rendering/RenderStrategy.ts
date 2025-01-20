import { SceneData } from '../systems/Renderer'

export interface RenderStrategy {
  render(sceneData: SceneData): void
}
