import React from 'react'
import { createRoot } from 'react-dom/client'
import { mat4, quat, utils, vec3 } from 'wgpu-matrix'
import { CameraComponent, CameraType, ComponentType, TransformComponent } from '../engine/components'
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
    { name: 'Water Bottle', source: '/assets/gltf/WaterBottle.glb' },
    { name: 'BoxTextured', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/BoxTextured/glTF-Embedded/BoxTextured.gltf' },
    { name: 'BoomBox', source: '/assets/gltf/BoomBox.glb' },
    { name: 'Sponza', source: '/assets/gltf/Sponza/Sponza.gltf' },
    { name: 'Helmet', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Embedded/DamagedHelmet.gltf' },
    { name: 'Hierarchy', source: '/assets/gltf/hirarchy_separate.gltf' },
    { name: 'Box', source: '/assets/gltf/Box.gltf' },
    { name: 'Duck', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Embedded/Duck.gltf' },
    { name: 'CylinderEngine', source: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/2CylinderEngine/glTF-Embedded/2CylinderEngine.gltf' },
  ]

  private editorCamera = {
    cameraData: {
      camera: new CameraComponent(CameraType.PERSPECTIVE, { fov: 1, aspect: 1 }, 0.1),
      transform: TransformComponent.fromValues(vec3.fromValues(0, 0, -0.3), undefined, undefined),
    },
    cameraTarget: vec3.zero(),
  }

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

  async setActiveScene(sceneIndex: number) {
    await this.engine.loadScene(this.scenes[sceneIndex].source)
    this.engine.renderer.setActiveCamera(this.editorCamera.cameraData)

    const cameras = this.engine.ecs.getComponentsAsTuple([ComponentType.TRANSFORM, ComponentType.CAMERA]) as [TransformComponent, CameraComponent][]
    if (cameras.length > 0 && false) {
    } else {
      console.log('Using default camera')
      this.engine.renderer.setActiveCamera(this.editorCamera.cameraData)
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
    this.engine.renderer.setActiveCamera(cameraData)
    this.activeCameraEntityId = cameraEntityId
  }

  applyCameraPan(deltaX: number, deltaY: number) {
    // Set ediorCamera as active
    this.engine.renderer.setActiveCamera(this.editorCamera.cameraData)
    this.activeCameraEntityId = undefined

    const position = this.editorCamera.cameraData.transform.position
    const currentMatrix = this.editorCamera.cameraData.transform.toMatrix()
    const cameraX = mat4.getAxis(mat4.transpose(currentMatrix), 0)
    const cameraZ = mat4.getAxis(mat4.transpose(currentMatrix), 2)

    vec3.add(position, vec3.scale(cameraX, deltaX / 100), position)
    vec3.add(position, vec3.scale(cameraZ, -deltaY / 100), position)
  }

  applyCameraRotation(deltaX: number, deltaY: number) {
    // Set ediorCamera as active
    this.engine.renderer.setActiveCamera(this.editorCamera.cameraData)
    this.activeCameraEntityId = undefined

    const angleY = utils.degToRad(deltaX / 10)
    const angleX = utils.degToRad(deltaY / 10)
    const position = this.editorCamera.cameraData.transform.position
    const rotation = this.editorCamera.cameraData.transform.rotation
    const scale = this.editorCamera.cameraData.transform.scale
    const up = vec3.fromValues(0, 1, 0)

    // Get current camera x-axis
    const currentMatrix = this.editorCamera.cameraData.transform.toMatrix()
    const cameraZ = mat4.getAxis(mat4.transpose(currentMatrix), 2)
    const cameraX = mat4.getAxis(mat4.transpose(currentMatrix), 0)
    const rotX = quat.fromAxisAngle(cameraX, angleX)
    quat.mul(rotation, rotX, rotation)
    quat.rotateY(rotation, angleY, rotation)
    vec3.getTranslation(currentMatrix, position)
  }
}
