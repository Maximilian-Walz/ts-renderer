import { Component, ComponentClass, ComponentType, HierarchyComponent, HierarchyProps, TransformComponent, TransformProps } from '../components'

export type EntityId = string

export class Entity {
  public readonly entityId: EntityId
  private componentMap: Map<ComponentType, Component<any>> = new Map()

  constructor(entityId: EntityId, transformProps?: TransformProps, hierarchyProps?: HierarchyProps) {
    this.entityId = entityId
    this.addComponent(TransformComponent, transformProps ?? {})
    this.addComponent(HierarchyComponent, hierarchyProps ?? {})
  }

  public hasComponent<T extends Component<any>>(componentClass: ComponentClass<T>): boolean {
    return this.componentMap.has(componentClass.getType())
  }

  public getComponent<T extends Component<any>>(componentClass: ComponentClass<T>): T {
    const type = componentClass.getType()
    if (!this.componentMap.has(type)) {
      throw new Error(`Entity with id ${this.entityId} does not have component of type ${type}.`)
    }
    return this.componentMap.get(type) as T
  }

  public getComponentFromTypeOrUndefined(type: ComponentType): Component<any> | undefined {
    return this.componentMap.get(type)
  }

  public getComponentOrUndefined<T extends Component<any>>(componentClass: ComponentClass<T>): T | undefined {
    const type = componentClass.getType()
    if (!this.componentMap.has(type)) {
      return undefined
    }
    return this.componentMap.get(type) as T
  }

  public getComponents(): Component<any>[] {
    return Array.from(this.componentMap.values())
  }

  public getComponentTypes(): ComponentType[] {
    return Array.from(this.componentMap.keys())
  }

  public addComponent<Props, T extends Component<Props>>(TCreator: new (entity: Entity, props: Props) => T, props: Partial<Props>): Entity {
    const component = new TCreator(this, props as Props)
    component.onCreate(props as Props)
    if (this.componentMap.has(component.type)) {
      console.warn(`Entiy with id ${this.entityId} alreay had compnenty of type ${component.type}, which is now overriden.`)
    }
    this.componentMap.set(component.type, component)
    return this
  }
}
