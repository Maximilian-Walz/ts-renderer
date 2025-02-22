import { Component, ComponentType, TransformComponent } from '../components'

export type EntityId = string

export class Entity {
  public readonly entityId: EntityId
  private componentMap: Map<ComponentType, Component> = new Map()

  constructor(entityId: EntityId, transform: TransformComponent) {
    this.entityId = entityId
    this.addComponent(transform)
  }

  public hasComponent(type: ComponentType): boolean {
    return this.componentMap.has(type)
  }

  public getComponentOrUndefined(type: ComponentType): Component | undefined {
    return this.componentMap.get(type)
  }

  public getComponents(): Component[] {
    return Array.from(this.componentMap.values())
  }

  public getComponent(type: ComponentType): Component {
    if (!this.componentMap.has(type)) {
      throw new Error(`Entity with id ${this.entityId} does not have component of type ${type}.`)
    }
    return this.componentMap.get(type)!
  }

  public getComponentTypes(): ComponentType[] {
    return Array.from(this.componentMap.keys())
  }

  public addComponent(component: Component) {
    if (this.componentMap.has(component.type)) {
      console.warn(`Entiy with id ${this.entityId} alreay had compnenty of type ${component.type}, which is now overriden.`)
    }
    this.componentMap.set(component.type, component)
  }
}
