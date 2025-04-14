import { ComponentType } from '.'
import { Script } from '../assets/Script'
import { Entity } from '../scenes/Entity'
import { Component } from './Component'

export type ScriptInitData<Props> = {
  scriptType: new (enity: Entity, props: Props) => Script<Props>
  props?: Props
}

export type ScriptProps = {
  scripts?: ScriptInitData<any>[]
}

export class ScriptComponent extends Component<ScriptProps> {
  get type(): ComponentType {
    return ScriptComponent.getType()
  }

  private _scripts!: Script<any>[]

  public static override getType(): ComponentType {
    return ComponentType.SCRIPT
  }

  public override onCreate(props: ScriptProps): void {
    this._scripts = []
    props.scripts?.forEach(({ scriptType, props }) => this.addScript(scriptType, props))
  }

  public addScript<Props, T extends Script<Props>>(TCreator: new (entity: Entity, props: Props) => T, props: Partial<Props>): void {
    const script = new TCreator(this.entity, props as Props)
    this._scripts.push(script)
  }

  get scripts() {
    return this._scripts
  }
}
