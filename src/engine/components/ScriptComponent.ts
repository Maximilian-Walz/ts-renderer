import { Component, ComponentType } from '.'
import { Script } from '../assets/Script'

export class ScriptComponent extends Component {
  private scripts: Script[] = []

  constructor() {
    super(ComponentType.SHADOW_MAP)
  }

  public addScript<T extends Script>(TCreator: new (...args: any[]) => T, ...args: any[]): void {
    const script = new TCreator(...args)
    script.onCreate()
    this.scripts.push(script)
  }

  public getScripts(): Script[] {
    return this.scripts
  }

  public toJson(): Object {
    throw new Error('Method not implemented.')
  }
}
