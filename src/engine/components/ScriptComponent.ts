import { ComponentType } from '.'
import { Script } from '../assets/Script'
import { Entity } from '../scenes/Entity'
import { Component } from './Component'

export type ScriptInitData = {
  scriptType: new (...args: any[]) => Script
  args: any[]
}

export type ScriptProps = {
  scriptsInitData?: ScriptInitData[]
}

export class ScriptComponent extends Component {
  public readonly scripts: Script[] = []

  constructor(entity: Entity, props: ScriptProps) {
    super(ComponentType.SHADOW_MAP, entity)
    props.scriptsInitData?.forEach(({ scriptType, args }) => this.addScript(scriptType, ...args))
  }

  public addScript<T extends Script>(TCreator: new (...args: any[]) => T, ...args: any[]): void {
    const script = new TCreator(...args)
    script.onCreate()
    this.scripts.push(script)
  }
}
