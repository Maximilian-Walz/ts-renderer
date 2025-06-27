import { Engine } from "./Engine"

export abstract class Game {
  public engine: Engine
  public device?: GPUDevice

  constructor() {
    this.engine = new Engine()
  }

  public async init(rootDiv?: HTMLDivElement, device?: GPUDevice) {
    this.device = await this.engine.init(device)
    await this.afterInit()
    rootDiv && this.initCanvas(rootDiv)
  }

  public initCanvas(rootDiv: HTMLDivElement) {
    const canvas = document.createElement("canvas")
    rootDiv.appendChild(canvas)
    this.engine.setRenderTarget(canvas)
  }

  protected abstract afterInit(): Promise<void> | void
}
