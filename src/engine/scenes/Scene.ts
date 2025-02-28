import { Component, ComponentType, TransformComponent } from '../components'
import { Entity, EntityId } from './Entity'

export type SceneId = string
export type ComponentQueryResult = Record<ComponentType, Component | undefined>[]

export class Scene {
  public readonly sceneId: SceneId
  public readonly name: string
  private entities: Map<EntityId, Entity> = new Map()

  constructor(sceneId: SceneId, name: string) {
    this.sceneId = sceneId
    this.name = name
  }

  public getEntity(entityId: EntityId): Entity {
    if (!this.entities.has(entityId)) {
      throw new Error(`Scene with name ${this.name} does not have entity with id ${entityId}.`)
    }
    return this.entities.get(entityId)!
  }

  public getEntityOrUndefined(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId)
  }

  public getEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  public addEntity(entity: Entity) {
    if (this.entities.has(entity.entityId)) {
      console.warn(`Scene with name ${this.name} alreay had entity with id ${entity.entityId}, which is now overriden.`)
    }
    this.entities.set(entity.entityId, entity)
  }

  public createEntity(entityId: string, tranform: TransformComponent): Entity {
    if (this.entities.has(entityId)) {
      throw new Error(`Entity with id ${entityId} already exists`)
    }

    const entity = new Entity(entityId, tranform)
    this.addEntity(entity)
    return entity
  }

  public getComponents(componentTypes: ComponentType[]): ComponentQueryResult {
    const result: ComponentQueryResult = []
    this.entities.forEach((entity) => {
      let record: Record<ComponentType, Component | undefined> = {
        [ComponentType.TRANSFORM]: undefined,
        [ComponentType.CAMERA]: undefined,
        [ComponentType.MESH_RENDERER]: undefined,
        [ComponentType.LIGHT]: undefined,
        [ComponentType.AUTO_ROTATE]: undefined,
        [ComponentType.CAMERA_CONTROLLER]: undefined,
        [ComponentType.BILLBOARD]: undefined,
      }
      Object.keys(ComponentType).forEach(
        (type) => (record[ComponentType[type as keyof typeof ComponentType]] = entity.getComponentOrUndefined(ComponentType[type as keyof typeof ComponentType]))
      )

      const containsAll = componentTypes.every((type) => record[type] != undefined)
      if (containsAll) {
        result.push(record)
      }
    })

    return result
  }

  public instanceScene(sourceScene: Scene, parentEntityId?: EntityId) {
    const parentEntityTransform = parentEntityId != undefined ? (this.getEntity(parentEntityId).getComponent(ComponentType.TRANSFORM) as TransformComponent) : undefined

    sourceScene.getEntities().forEach((entity) => {
      const tranform = entity.getComponent(ComponentType.TRANSFORM) as TransformComponent
      if (tranform.parent == undefined) {
        tranform.parent = parentEntityTransform
      }
      const instancedEntity = this.createEntity(entity.entityId, tranform)

      // TODO: Need to think about what instancing means (deep or shallow copy?)
      //        - Probably need both: For most in-game stuff a deep copy,
      //          but for the editor we need a shallow copy of the game
      //          since we want to apply changes to the actual game entities

      entity
        .getComponents()
        .filter((component) => component.type != ComponentType.TRANSFORM)
        .forEach((component) => instancedEntity.addComponent(component))
    })
  }
}
