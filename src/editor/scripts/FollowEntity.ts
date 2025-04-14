import { Script } from '../../engine/assets/Script'
import { TransformComponent } from '../../engine/components'
import { Entity } from '../../engine/scenes/Entity'

export type FollowEntityProps = {
  target: Entity
}

export class FollowEntity extends Script<FollowEntityProps> {
  public override onUpdate() {
    this.entity.getComponent(TransformComponent).globalTransform = this.props.target.getComponent(TransformComponent).globalTransform
  }
}
