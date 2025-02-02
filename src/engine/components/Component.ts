import { ComponentType } from '.'

export abstract class Component {
  public readonly type: ComponentType
  public abstract toJson(): Object

  constructor(type: ComponentType) {
    this.type = type
  }
}
