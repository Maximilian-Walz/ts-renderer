import React from 'react'
import { createRoot } from 'react-dom/client'
import { Editor } from './components/Editor'
import { Engine } from '../engine/engine'

createRoot(document.getElementById('editor')!).render(<Editor />)

export type EntityTree = {
  rootNodes: number[]
}

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false

  constructor() {
    this.engine = new Engine()
  }

  async init() {
    if (this.initialized) return

    await this.engine.init()
    this.initialized = true
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.engine.setRenderTarget(canvas)
  }

  getEntityTree() {
    return {
      rootNodes: this.engine.ecs.getEntityTree().rootNodes,
    }
  }
}
