import React from 'react'
import { createRoot } from 'react-dom/client'
import { mat4, quat, utils, vec3 } from 'wgpu-matrix'
import { CameraComponent, CameraType, ComponentType, TransformComponent } from '../engine/components/components'
import { Engine, Scene } from '../engine/Engine'
import { EntityNode } from '../engine/entity-component-system'
import { CameraData } from '../engine/systems/Renderer'
import { Editor } from './components/Editor'
import './index.css'

createRoot(document.getElementById('editor')!).render(<Editor />)

export class GraphicEditor {
  private engine: Engine
  private initialized: boolean = false
  private scenes: Scene[] = [
    { name: 'Water Bottle', source: '/assets/gltf/WaterBottle.glb' },
    { name: 'BoomBox', source: '/assets/gltf/BoomBox.glb' },
    { name: 'Sponza', source: '/assets/gltf/Sponza.glb' },
    { name: 'DamagedHelmet', source: '/assets/gltf/DamagedHelmet.glb' },
  ]

  private editorCamera: CameraData

  activeCameraEntityId: number | undefined

  constructor() {
    this.engine = new Engine()

    let targetTransform = new TransformComponent()
    this.editorCamera = {
      transform: TransformComponent.fromValues(vec3.fromValues(0, 0, -0.3), undefined, undefined, targetTransform),
      camera: new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1),
    }
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
    this.engine.setActiveCamera(this.editorCamera)

    const cameras = this.engine.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA]) as [TransformComponent, CameraComponent][]
    if (cameras.length > 0 && false) {
    } else {
      console.log('Using default camera')
      this.engine.setActiveCamera(this.editorCamera)
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

  setActiveCamera(cameraEntityId: number) {
    const cameraData: CameraData = {
      camera: this.engine.ecs.getComponentByEntityId(cameraEntityId, ComponentType.CAMERA) as CameraComponent,
      transform: this.engine.ecs.getComponentByEntityId(cameraEntityId, ComponentType.TRANSFORM) as TransformComponent,
    }
    // TODO: Clone camera data to editorCam (to mirror Blenders camera behaviour, when moving inside a scene camera)
  }

  applyCameraPan(deltaX: number, deltaY: number) {
    const currentMatrix = this.editorCamera.transform.toMatrix()
    const cameraX = mat4.getAxis(mat4.transpose(currentMatrix), 0)
    const cameraZ = mat4.getAxis(mat4.transpose(currentMatrix), 1)

    const target = this.editorCamera.transform.parent!.position
    const scale = 1 / (this.editorCamera.transform.scale[0] * this.editorCamera.transform.scale[0] * 100)
    vec3.add(target, vec3.scale(cameraX, deltaX * scale), target)
    vec3.add(target, vec3.scale(cameraZ, -deltaY * scale), target)
  }

  applyCameraRotation(deltaX: number, deltaY: number) {
    const angleY = utils.degToRad(deltaX / 10)
    const angleX = utils.degToRad(deltaY / 10)
    const rotation = this.editorCamera.transform.rotation

    // Get current camera x-axis
    const axis = mat4.getAxis(mat4.transpose(this.editorCamera.transform.toMatrix()), 0)
    vec3.normalize(axis, axis)
    const rotQuat = quat.fromAxisAngle(axis, angleX)
    quat.mul(rotation, rotQuat, rotation)
    quat.rotateY(rotation, angleY, rotation)
    quat.normalize(rotation, rotation)
  }

  applyCameraScale(delta: number) {
    const scale = this.editorCamera.transform.scale
    vec3.addScaled(scale, vec3.fromValues(1, 1, 1), delta, scale)
    vec3.clamp(scale, 0.00001, 10000, scale)
  }
}
