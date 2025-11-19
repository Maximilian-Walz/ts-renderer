import { Entity, EntityId } from "../scenes/Entity"
import { Component } from "./Component"

export type HierarchyProps = {
  parentId?: EntityId
}

export class HierarchyComponent extends Component<HierarchyProps> {
  public parent?: Entity
  public children: Entity[] = []

  get parentId() {
    return this.props.parentId
  }
}
