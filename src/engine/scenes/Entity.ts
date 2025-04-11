import { Component, ComponentType, TransformComponent, TransformProps } from '../components'

export type EntityId = string

export class Entity {
  public readonly entityId: EntityId
  private componentMap: Map<ComponentType, Component<any>> = new Map()

  constructor(entityId: EntityId, transformProps: TransformProps) {
    this.entityId = entityId
    this.addComponent(TransformComponent, transformProps)
  }

  public hasComponent(type: ComponentType): boolean {
    return this.componentMap.has(type)
  }

  public getComponentOrUndefined(type: ComponentType): Component<any> | undefined {
    return this.componentMap.get(type)
  }

  public getComponents(): Component<any>[] {
    return Array.from(this.componentMap.values())
  }

  public getComponent(type: ComponentType): Component<any> {
    if (!this.componentMap.has(type)) {
      throw new Error(`Entity with id ${this.entityId} does not have component of type ${type}.`)
    }
    return this.componentMap.get(type)!
  }

  public getTransform(): TransformComponent {
    return this.componentMap.get(ComponentType.TRANSFORM) as TransformComponent
  }

  public getComponentTypes(): ComponentType[] {
    return Array.from(this.componentMap.keys())
  }

  public addComponent<Props, T extends Component<Props>>(TCreator: new (entity: Entity, props: Props) => T, props: Props): T {
    const component = new TCreator(this, props)
    if (this.componentMap.has(component.type)) {
      console.warn(`Entiy with id ${this.entityId} alreay had compnenty of type ${component.type}, which is now overriden.`)
    }
    this.componentMap.set(component.type, component)
    return component
  }
}
