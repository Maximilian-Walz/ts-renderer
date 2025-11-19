import { HierarchyProps, TransformProps } from "../components"
import { ComponentMap } from "../components/ComponentTypes"
import { Entity, EntityId } from "./Entity"

export type SceneId = string

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

  public createEntity(entityId: string, tranformProps?: TransformProps, hierarchyProps?: HierarchyProps): Entity {
    if (this.entities.has(entityId)) {
      throw new Error(`Entity with id ${entityId} already exists`)
    }

    const entity = new Entity(entityId, tranformProps, hierarchyProps)
    this.addEntity(entity)
    return entity
  }

  public query<T extends (keyof ComponentMap)[]>(...types: T): Entity[] {
    return [...this.getEntities()].filter((entity) => types.every((type) => entity.hasComponent(type)))
  }
}
