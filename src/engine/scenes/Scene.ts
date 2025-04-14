import { Component, ComponentType, HierarchyProps, TransformProps } from '../components'
import { Entity, EntityId } from './Entity'

export type SceneId = string

export type ComponentRecord = Partial<Record<ComponentType, Component<any> | undefined>>
export type ComponentQueryResult = ComponentRecord[]

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

  public createEntity(entityId: string, tranformProps: TransformProps, hierarchyProps?: HierarchyProps): Entity {
    if (this.entities.has(entityId)) {
      throw new Error(`Entity with id ${entityId} already exists`)
    }

    const entity = new Entity(entityId, tranformProps, hierarchyProps)
    this.addEntity(entity)
    return entity
  }

  public getComponents(componentTypes: ComponentType[]): ComponentQueryResult {
    const result: ComponentQueryResult = []
    this.entities.forEach((entity) => {
      let record: ComponentRecord = {}
      Object.keys(ComponentType).forEach(
        (type) => (record[ComponentType[type as keyof typeof ComponentType]] = entity.getComponentFromTypeOrUndefined(ComponentType[type as keyof typeof ComponentType]))
      )

      const containsAll = componentTypes.every((type) => record[type] != undefined)
      if (containsAll) {
        result.push(record)
      }
    })

    return result
  }
}
