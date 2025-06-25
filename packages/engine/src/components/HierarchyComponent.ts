import { ComponentType } from '.'
import { Entity, EntityId } from '../scenes/Entity'
import { Component } from './Component'

export type HierarchyProps = {
  parentId?: EntityId
}

export class HierarchyComponent extends Component<HierarchyProps> {
  public parent?: Entity
  public children: Entity[] = []

  get type(): ComponentType {
    return HierarchyComponent.getType()
  }

  public static override getType(): ComponentType {
    return ComponentType.HIERARCHY
  }

  get parentId() {
    return this.props.parentId
  }
}
