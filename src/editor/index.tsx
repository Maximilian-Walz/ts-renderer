import React from 'react'
import { createRoot } from 'react-dom/client'
import { vec3 } from 'wgpu-matrix'
import { CameraComponent, CameraControllerComponent, CameraType, ComponentType, TransformComponent } from '../engine/components/components'
import { Engine, Scene } from '../engine/Engine'
import { EntityNode } from '../engine/entity-component-system'
import { Editor } from './components/Editor'
import './index.css'

createRoot(document.getElementById('editor')!).render(<Editor />)

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false
  private scenes: Scene[] = [
    { name: 'Shadow Test', source: 'assets/gltf/shadowTest.glb' },
    { name: 'Sponza', source: '/assets/gltf/Sponza.glb' },
    { name: 'Water Bottle', source: '/assets/gltf/WaterBottle.glb' },
    { name: 'BoomBox', source: '/assets/gltf/BoomBox.glb' },
    { name: 'DamagedHelmet', source: '/assets/gltf/DamagedHelmet.glb' },
  ]

  activeCameraEntityId: number | undefined

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

  private addEditorCamera() {
    let targetTransform = new TransformComponent()
    const editorCameraId = this.engine.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(0, 0, -0.3), undefined, undefined, targetTransform))
    this.engine.ecs.addComponentToEntity(editorCameraId, new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.001))
    this.engine.ecs.addComponentToEntity(editorCameraId, new CameraControllerComponent())
    this.engine.setActiveCamera(editorCameraId)
  }

  async setActiveScene(sceneIndex: number) {
    await this.engine.loadScene(this.scenes[sceneIndex].source)
    this.addEditorCamera()
    this.engine.prepareScene()
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

  setActiveCamera(cameraEntityId: number) {
    this.setActiveCamera(cameraEntityId)
    // TODO: Clone camera data to editorCam (to mirror Blenders camera behaviour, when moving inside a scene camera)
  }
}
