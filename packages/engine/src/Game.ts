import { Engine } from "./Engine"

export abstract class Game {
  public engine: Engine
  public rootDiv: HTMLDivElement

  public device?: GPUDevice

  constructor(rootDiv: HTMLDivElement) {
    this.engine = new Engine()
    this.rootDiv = rootDiv
  }

  public async init(device?: GPUDevice) {
    this.device = await this.engine.init(device)

    const canvas = document.createElement("canvas")
    this.rootDiv.appendChild(canvas)
    this.engine.setRenderTarget(canvas)

    await this.afterInit()
  }

  protected abstract afterInit(): Promise<void> | void
}
