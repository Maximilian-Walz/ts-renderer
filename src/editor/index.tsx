import React from 'react'
import { createRoot } from 'react-dom/client'
import { mat4, vec3 } from 'wgpu-matrix'
import { CameraComponent, TransformComponent } from '../engine/components'
import { Engine, Scene } from '../engine/engine'
import { ComponentType, EntityNode } from '../engine/entity-component-system'
import { CameraData } from '../engine/systems/renderer'
import { Editor } from './components/Editor'
import './index.css'

createRoot(document.getElementById('editor')!).render(<Editor />)

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false
  private scenes: Scene[] = [
    { name: 'Helmet', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf' },
    { name: 'Duck', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Embedded/Duck.gltf' },
    { name: 'Box', source: '/assets/gltf/Box.gltf' },
    { name: 'Hierarchy', source: '/assets/gltf/hirarchy.glb' },
  ]

  private cameras: CameraData[] = [
    {
      viewMatrix: mat4.translate(mat4.identity(), vec3.fromValues(0, -0.8, -2.37)),
      fov: 2,
      aspect: 'canvas',
      zNear: 1,
      zFar: 100,
    },
  ]

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

  getScenes(): Scene[] {
    return this.scenes
  }

  async setActiveScene(sceneIndex: number) {
    await this.engine.loadScene(this.scenes[sceneIndex].source)
    this.engine.renderer.setActiveCamera(this.cameras[0])

    const cameras = this.engine.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA]) as [TransformComponent, CameraComponent][]
    if (cameras.length > 0) {
      console.log('Using scene camera')
      this.engine.renderer.setActiveCameraComponent(cameras[0])
    } else {
      console.log('Using default camera')
      this.engine.renderer.setActiveCamera(this.cameras[0])
    }
  }

  getEntityTree() {
    const entityTree = this.engine.ecs.getEntityTree()
    const nodes: EntityNode[] = Array(entityTree.nodes.size)
    for (let [entityId, entityNode] of entityTree.nodes.entries()) {
      nodes[entityId] = entityNode
    }

    return {
      rootNodeIds: entityTree.rootNodeIds,
      nodes: nodes,
    }
  }
}
