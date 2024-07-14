import React from 'react'
import { createRoot } from 'react-dom/client'
import { quat, vec3 } from 'wgpu-matrix'
import { CameraComponent, ComponentType, TransformComponent } from '../engine/components'
import { Engine, Scene } from '../engine/engine'
import { EntityNode } from '../engine/entity-component-system'
import { CameraData } from '../engine/systems/renderer'
import { Editor } from './components/Editor'
import './index.css'

createRoot(document.getElementById('editor')!).render(<Editor />)

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false
  private scenes: Scene[] = [
    { name: 'Hierarchy', source: '/assets/gltf/hirarchy_separate.gltf' },
    { name: 'Helmet', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf' },
    { name: 'Duck', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Embedded/Duck.gltf' },
    { name: 'Box', source: '/assets/gltf/Box.gltf' },
  ]

  private cameras: CameraData[] = [
    {
      camera: new CameraComponent((Math.PI * 2) / 5, undefined, 1, 100),
      transform: TransformComponent.fromValues(vec3.fromValues(0, 0, -3), undefined, undefined),
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

  getComponentsByEntityId(entityId: number) {
    return this.engine.ecs.getComponentsByEntityId(entityId).map((component) => component.toJson())
  }

  getComponentByEntityId(entityId: number, type: ComponentType) {
    return this.engine.ecs.getComponentByEntityId(entityId, type)
  }

  getComponentTypesByEntityId(entityId: number): ComponentType[] {
    return this.engine.ecs.getComponentTypesByEntityId(entityId)
  }
}
