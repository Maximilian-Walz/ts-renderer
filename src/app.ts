import { Renderer } from "./renderer"

export class App {
  constructor() {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      const renderer = new Renderer()
      renderer.init(canvas)
    } else {
      throw new Error("No canvas found to render to")
    }
  }
}

new App()
