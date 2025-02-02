import { Engine } from './Engine'

export abstract class Game {
  public engine: Engine

  constructor() {
    this.engine = new Engine()
  }

  public async init(device?: GPUDevice) {
    await this.engine.init(device)
    await this.afterInit()
  }

  protected abstract afterInit(): Promise<void> | void
}
