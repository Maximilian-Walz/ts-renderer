import { Engine } from '../Engine'
import { Entity } from '../scenes/Entity'

export abstract class Script {
  public initialized: boolean = false

  protected readonly entity: Entity

  constructor(entity: Entity) {
    this.entity = entity
  }

  public abstract onCreate(): void
  public abstract onInit(engine: Engine): void
  public abstract onUpdate(engine: Engine): void
  public abstract onDestroy(engine: Engine): void
}
