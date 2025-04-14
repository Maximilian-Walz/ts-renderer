import { Engine } from '../Engine'
import { Entity } from '../scenes/Entity'

export abstract class Script<Props> {
  public initialized: boolean = false
  protected props: Props

  protected readonly entity: Entity

  constructor(entity: Entity, props: Props) {
    this.entity = entity
    this.props = props

    this.onCreate(props)
  }

  protected onCreate(_props: Props): void {}
  public onInit(_engine: Engine): void {}
  public onUpdate(_engine: Engine): void {}
  public onDestroy(_engine: Engine): void {}
}
