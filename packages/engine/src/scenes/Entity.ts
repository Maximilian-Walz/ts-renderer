import { HierarchyComponent, HierarchyProps, TransformComponent, TransformProps } from "../components"
import { AnyComponent, ComponentMap, ComponentOf } from "../components/ComponentTypes"

export type EntityId = string

export class Entity {
  public readonly entityId: EntityId

  private components: {
    [K in keyof ComponentMap]?: ComponentOf<K>
  } = {}

  public addComponent<K extends keyof ComponentMap>(component: ComponentOf<K>): void {
    this.components[component.type] = component as any
  }

  public getComponent<K extends keyof ComponentMap>(type: K): ComponentOf<K> | undefined {
    return this.components[type]
  }

  public removeComponent<K extends keyof ComponentMap>(type: K): void {
    delete this.components[type]
  }

  public getAllComponents(): AnyComponent[] {
    return Object.values(this.components).filter((c): c is AnyComponent => c !== undefined)
  }

  public getAllComponentTypes(): (keyof ComponentMap)[] {
    return Object.keys(this.components) as (keyof ComponentMap)[]
  }

  public hasComponent<K extends keyof ComponentMap>(type: K): boolean {
    return this.components[type] !== undefined
  }

  constructor(entityId: EntityId, transformProps?: TransformProps, hierarchyProps?: HierarchyProps) {
    this.entityId = entityId
    this.addComponent({type: "transform"})
    this.addComponent(HierarchyComponent, hierarchyProps ?? {})
  }
}
