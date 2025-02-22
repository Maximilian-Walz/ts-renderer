import { EntityId } from './Entity'
import { Scene } from './Scene'

export type SceneInfo = {
  identifier: string
  name: string
}

export class SceneManger {
  private scenes: Map<string, Scene> = new Map()
  private activeScene: Scene | undefined

  public addScene(identifier: string, scene: Scene) {
    if (this.scenes.has(identifier)) {
      throw new Error(`Scene with identifier ${identifier} already exists.`)
    }
    this.scenes.set(identifier, scene)
  }

  public setActiveScene(identifier: string) {
    this.activeScene = this.getScene(identifier)
  }

  public getActiveScene(): Scene {
    if (this.activeScene == undefined) {
      throw new Error(`No scene set as active.`)
    }
    return this.activeScene
  }

  public getScene(identifier: string): Scene {
    if (!this.scenes.has(identifier)) {
      throw new Error(`Scene with identifier ${identifier} does not exist.`)
    }
    return this.scenes.get(identifier)!
  }

  public getScenesInfo(): SceneInfo[] {
    return Array.from(this.scenes).map(([identifier, scene]) => {
      return { identifier: identifier, name: scene.name }
    })
  }

  public instanceScene(sourceSceneIdentifier: string, targetSceneIdentifier?: string, parentEntityId?: EntityId) {
    const sourceScene = this.getScene(sourceSceneIdentifier)
    const targetScene = targetSceneIdentifier != undefined ? this.getScene(targetSceneIdentifier) : this.activeScene!
    targetScene.instanceScene(sourceScene, parentEntityId)
  }
}
