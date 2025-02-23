import { EntityId } from './Entity'
import { Scene, SceneId } from './Scene'

export type SceneInfo = {
  sceneId: SceneId
  name: string
}

export class SceneManger {
  private scenes: Map<SceneId, Scene> = new Map()
  private activeScene: Scene | undefined

  public hasScene(sceneId: SceneId) {
    return this.scenes.has(sceneId)
  }

  public addScene(scene: Scene) {
    if (this.scenes.has(scene.sceneId)) {
      throw new Error(`Scene with id ${scene.sceneId} already exists.`)
    }
    this.scenes.set(scene.sceneId, scene)
  }

  public hasActiveScene() {
    return this.activeScene != undefined
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

  // TODO: Should copy everything down to component level
  public instanceScene(sourceScene: Scene, targetScene: Scene = this.activeScene!, parentEntityId?: EntityId) {
    targetScene.instanceScene(sourceScene, parentEntityId)
  }

  // TODO: Shouldn't be the same entities but only the same components (at least for the editor use-case)
  // Shallow copy: Different scene object but the same entities.
  public addSceneCopy(scene: Scene) {
    const copy = new Scene(scene.sceneId, scene.name)
    scene.getEntities().forEach((entity) => copy.addEntity(entity))
    this.addScene(copy)
    return copy
  }
}
