import { ComponentType } from '.'
import { Script } from '../assets/Script'
import { Entity } from '../scenes/Entity'
import { Component } from './Component'

export type ScriptInitData = {
  scriptType: new (...args: any[]) => Script
  args?: any[]
}

export type ScriptProps = {
  scripts?: ScriptInitData[]
}

export class ScriptComponent extends Component<ScriptProps> {
  private _scripts!: Script[]

  constructor(entity: Entity, props: ScriptProps) {
    super(ComponentType.SCRIPT, entity, props)
  }

  protected override onInit(props: ScriptProps): void {
    this._scripts = []
    props.scripts?.forEach(({ scriptType, args }) => this.addScript(scriptType, ...(args ?? [])))
  }

  public addScript<T extends Script>(TCreator: new (...args: any[]) => T, ...args: any[]): void {
    const script = new TCreator(this.entity, ...args)
    script.onCreate()
    this._scripts.push(script)
  }

  get scripts() {
    return this._scripts
  }
}
