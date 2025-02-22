import { EntityId } from './Entity'
import { Scene, SceneId } from './Scene'

export type SceneInfo = {
  sceneId: SceneId
  name: string
}

export class SceneManger {
  private scenes: Map<SceneId, Scene> = new Map()
  private activeScene: Scene | undefined

  public addScene(scene: Scene) {
    if (this.scenes.has(scene.sceneId)) {
      throw new Error(`Scene with id ${scene.sceneId} already exists.`)
    }
    this.scenes.set(scene.sceneId, scene)
  }

  public setActiveScene(sceneId: SceneId) {
    this.activeScene = this.getScene(sceneId)
  }

  public getActiveScene(): Scene {
    if (this.activeScene == undefined) {
      throw new Error(`No scene set as active.`)
    }
    return this.activeScene
  }

  public getScene(sceneId: SceneId): Scene {
    if (!this.scenes.has(sceneId)) {
      throw new Error(`Scene with id ${sceneId} does not exist.`)
    }
    return this.scenes.get(sceneId)!
  }

  public getScenes(): Scene[] {
    return Array.from(this.scenes.values())
  }

  public instanceScene(sourceScene: Scene, targetScene: Scene = this.activeScene!, parentEntityId?: EntityId) {
    targetScene.instanceScene(sourceScene, parentEntityId)
  }
}
