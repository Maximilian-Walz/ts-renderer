import { ComponentType } from '.'

export abstract class Component {
  type: ComponentType
  abstract toJson(): Object

  constructor(type: ComponentType) {
    this.type = type
  }
}
