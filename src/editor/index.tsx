import React from 'react'
import './index.css'
import { createRoot } from 'react-dom/client'
import { Editor } from './components/Editor'
import { Engine } from '../engine/engine'

createRoot(document.getElementById('editor')!).render(<Editor />)

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
    return this.engine.ecs.getEntityTree()
  }

  getEntityComponentMap() {
    return this.engine.ecs.getEntityComponentMap()
  }
}
