import React from 'react'
import { createRoot } from 'react-dom/client'
import { vec3 } from 'wgpu-matrix'
import { AssetInfo } from '../engine/assets/AssetManager'
import { CameraComponent, CameraControllerComponent, CameraType, ComponentType, TransformComponent } from '../engine/components'
import { Engine, Scene } from '../engine/Engine'
import { EntityNode } from '../engine/entity-component-system'
import { Editor } from './components/Editor'
import './index.css'

createRoot(document.getElementById('editor')!).render(<Editor />)

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false
  private scenes: AssetInfo[] = [
    { identifier: 'Shadow Test', path: 'assets/gltf/shadowTest.glb' },
    { identifier: 'Sponza', path: '/assets/gltf/Sponza.glb' },
    { identifier: 'Water Bottle', path: '/assets/gltf/WaterBottle.glb' },
    { identifier: 'BoomBox', path: '/assets/gltf/BoomBox.glb' },
    { identifier: 'DamagedHelmet', path: '/assets/gltf/DamagedHelmet.glb' },
  ]

  private staticTextures: AssetInfo[] = [
    { identifier: 'lightbulb', path: '/assets/textures/lightbulb.png' },
    { identifier: 'sun', path: '/assets/textures/sun.png' },
    { identifier: 'camera', path: '/assets/textures/camera.png' },
  ]

  activeCameraEntityId: number | undefined

  constructor() {
    this.engine = new Engine()
  }

  async init() {
    if (this.initialized) return
    await this.engine.init()
    this.initialized = true

    await Promise.all(
      this.staticTextures.map(async (assetInfo) => {
        await this.engine.assetManager.loadTextureData(assetInfo)
        this.engine.assetManager.loadTextureToGpu(assetInfo.identifier, this.engine.gpuDataInterface)
      })
    )
  }

  setRenderTarget(canvas: HTMLCanvasElement) {
    this.engine.setRenderTarget(canvas)
  }

  getScenes(): Scene[] {
    return this.scenes.map(({ identifier, path }) => {
      return {
        name: identifier,
        source: path,
      }
    })
  }

  private addEditorCamera() {
    let targetTransform = new TransformComponent()
    const editorCameraId = this.engine.ecs.createEntity(TransformComponent.fromValues(vec3.fromValues(0, 0, 10), undefined, undefined, targetTransform))
    this.engine.ecs.addComponentToEntity(editorCameraId, new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1, 100))
    this.engine.ecs.addComponentToEntity(editorCameraId, new CameraControllerComponent())
    this.engine.setActiveCamera(editorCameraId)
  }

  async setActiveScene(sceneIndex: number) {
    await this.engine.assetManager.loadGltfData(this.scenes[sceneIndex])
    await this.engine.loadScene(this.scenes[sceneIndex].identifier)
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
    this.engine.setActiveCamera(cameraEntityId)
    // TODO: Clone camera data to editorCam (to mirror Blenders camera behaviour, when moving inside a scene camera)
  }
}
