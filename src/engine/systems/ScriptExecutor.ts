import { Script } from '../assets/Script'
import { ScriptComponent } from '../components'

export class ScriptExecutor {
  private executeForAllScripts(scriptComponents: ScriptComponent[], lifecycleFunction: (script: Script) => void) {
    scriptComponents.flatMap((scriptComponent) => scriptComponent.scripts).forEach((script) => lifecycleFunction(script))
  }

  public startScripts(scriptComponent: ScriptComponent[]) {
    this.executeForAllScripts(scriptComponent, Script.prototype.onStart)
  }

  public updateScripts(scriptComponents: ScriptComponent[]) {
    this.executeForAllScripts(scriptComponents, Script.prototype.onUpdate)
  }

  public destroyScripts(scriptComponent: ScriptComponent[]) {
    this.executeForAllScripts(scriptComponent, Script.prototype.onDestroy)
  }
}
