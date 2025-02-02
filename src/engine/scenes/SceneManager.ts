import { Component, ComponentType, TransformComponent } from '../components'
import { Entity, Scene } from './Scene'

export type SceneInfo = {
  identifier: string
  name: string
}

export type ComponentQueryResult = Record<ComponentType, Component | undefined>[]

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

  public getScene(identifier: string): Scene {
    if (!this.scenes.has(identifier)) {
      throw new Error(`Scene with identifier ${identifier} does not exist.`)
    }
    return this.scenes.get(identifier)!
  }

  public instanceScene(identifier: string, parentTransform?: TransformComponent) {
    const entities = this.getScene(identifier).entities

    entities.forEach((entity, entityId) => {
      const tranform = entity.get(ComponentType.TRANSFORM) as TransformComponent
      if (tranform.parent == undefined) {
        tranform.parent = parentTransform
      }
      this.createEntity(entityId, tranform)

      entity.forEach((component, type) => {
        if (!(type == ComponentType.TRANSFORM)) {
          this.addComponentToEntity(entityId, component)
        }
      })
    })
  }

  public getScenesInfo(): SceneInfo[] {
    return Array.from(this.scenes).map(([identifier, scene]) => {
      return { identifier: identifier, name: scene.name }
    })
  }

  public getEntities(): Map<string, Entity> {
    if (this.activeScene == undefined) {
      throw new Error('No scene set as active.')
    }
    return this.activeScene?.entities
  }

  public getEntity(entityId: string): Entity {
    const entities = this.getEntities()
    if (!entities.has(entityId)) {
      throw new Error(`Active scene has no entity with id ${entityId}`)
    }
    return entities.get(entityId)!
  }

  public createEntity(entityId: string, tranform: TransformComponent) {
    const entity: Entity = new Map()
    entity.set(ComponentType.TRANSFORM, tranform)
    this.getEntities().set(entityId, entity)
  }

  public addComponentToEntity(entityId: string, component: Component) {
    this.getEntity(entityId).set(component.type, component)
  }

  public getComponents(componentTypes: ComponentType[]): ComponentQueryResult {
    const result: ComponentQueryResult = []
    this.getEntities().forEach((components) => {
      let record: Record<ComponentType, Component | undefined> = {
        [ComponentType.TRANSFORM]: undefined,
        [ComponentType.CAMERA]: undefined,
        [ComponentType.MESH_RENDERER]: undefined,
        [ComponentType.LIGHT]: undefined,
        [ComponentType.AUTO_ROTATE]: undefined,
        [ComponentType.CAMERA_CONTROLLER]: undefined,
      }

      const componentMap = new Map()
      components.forEach((component) => {
        componentMap.set(component.type, component)
        record[component.type] = component
      })

      const containsAll = componentTypes.every((type) => record[type] != undefined)
      if (containsAll) {
        result.push(record)
      }
    })
    return result
  }

  public getComponentsByEntityId(entityId: string): Entity {
    return this.getEntity(entityId)
  }

  public getComponentByEntityId(entityId: string, type: ComponentType): Component {
    const entity = this.getEntity(entityId)
    if (!entity.has(type)) {
      throw new Error(`Entity with id ${entityId} does not have component of type ${type}.`)
    }
    return entity.get(type)!
  }

  public getComponentTypesByEntityId(entityId: string): ComponentType[] {
    return Array.from(this.getEntity(entityId).keys())
  }
}
