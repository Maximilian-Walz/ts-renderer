import { Entity, Script, TransformComponent } from "@my/engine"

export type FollowEntityProps = {
  target: Entity
}

export class FollowEntity extends Script<FollowEntityProps> {
  public override onUpdate() {
    this.entity.getComponent(TransformComponent).position = this.props.target.getComponent(TransformComponent).position
  }
}
