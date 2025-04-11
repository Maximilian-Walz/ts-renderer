import { Script } from '../assets/Script'
import { ScriptComponent } from '../components'
import { Engine } from '../Engine'

export class ScriptExecutor {
  private readonly engine: Engine

  constructor(engine: Engine) {
    this.engine = engine
  }

  private executeForAllScripts(scriptComponents: ScriptComponent[], lifecycleFunction: (script: Script) => void) {
    scriptComponents.flatMap((scriptComponent) => scriptComponent.scripts).forEach((script) => lifecycleFunction(script))
  }

  public updateScripts(scriptComponents: ScriptComponent[]) {
    this.executeForAllScripts(scriptComponents, (script) => {
      if (!script.initialized) {
        script.onInit(this.engine)
        script.initialized = true
      }
    })
    this.executeForAllScripts(scriptComponents, (script) => script.onUpdate(this.engine))
  }

  public destroyScripts(scriptComponent: ScriptComponent[]) {
    this.executeForAllScripts(scriptComponent, (script) => script.onDestroy(this.engine))
  }
}
