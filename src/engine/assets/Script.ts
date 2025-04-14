import { Engine } from '../Engine'
import { Entity } from '../scenes/Entity'

export abstract class Script {
  public initialized: boolean = false

  protected readonly entity: Entity

  constructor(entity: Entity) {
    this.entity = entity
  }

  public onCreate(): void {}
  public onInit(_engine: Engine): void {}
  public onUpdate(_engine: Engine): void {}
  public onDestroy(_engine: Engine): void {}
}
