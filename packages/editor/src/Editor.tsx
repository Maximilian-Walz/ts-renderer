import { CoolGame } from "@my/cool-game"
import {
  BillboardComponent,
  CameraComponent,
  CameraType,
  ComponentType,
  Entity,
  Game,
  GltfImporter,
  LightComponent,
  LightType,
  MeshRendererComponent,
  PlainUnlitMaterial,
  PlainUnlitMaterialProps,
  Scene,
  SceneId,
  ScriptComponent,
  TransformProps,
} from "@my/engine"
import { createRoot } from "react-dom/client"
import { quat, vec3 } from "wgpu-matrix"
import arrow from "../assets/gltf/arrow.glb"
import camera from "../assets/textures/camera.png"
import lightbulb from "../assets/textures/lightbulb.png"
import sun from "../assets/textures/sun.png"
import "./editorEvents"
import "./index.css"
import { EditorInterface } from "./interface/EditorInterface"
import { FollowEntity } from "./scripts/FollowEntity"
import { OrbitingCameraController } from "./scripts/OrbitingCameraController"
import { StickToSelectedEntity } from "./scripts/StickToSelectedEntity"

const staticTextures: { identifier: string; path: string }[] = [
  { identifier: "lightbulb", path: lightbulb },
  { identifier: "sun", path: sun },
  { identifier: "camera", path: camera },
]

export class Editor extends Game {
  public game!: Game

  public activeCameraEntityId: number | undefined
  public activeEntity: Entity | undefined

  protected async afterInit() {
    createRoot(this.rootDiv).render(<EditorInterface editor={this} />)
    await Promise.all(
      staticTextures.map(async ({ identifier, path }) => {
        await this.engine.assetManager.addTextureFromPath(identifier, path, identifier)
      })
    )

    await new GltfImporter(this.engine.assetManager, this.engine.sceneManager, "arrow", arrow).importGltf()
  }

  public onGameDivInitialized(gameDiv: HTMLDivElement) {
    this.engine.eventManger.emit({ type: "log", message: "Loading Game" })
    this.game = new CoolGame(gameDiv)
    this.game.init(this.device).then(() => {
      this.engine.eventManger.emit({ type: "log", message: "Game loaded" })
    })
  }

  public setEditorRenderTarget(canvas: HTMLCanvasElement) {
    this.engine.setRenderTarget(canvas)
  }

  private addEditorCamera(scene: Scene) {
    const transformProps = {
      position: vec3.fromValues(0, 0, 10),
      rotation: quat.identity(),
      scale: vec3.fromValues(1, 1, 1),
    }

    const cameraProps = {
      cameraType: CameraType.PERSPECTIVE,
      projectionData: {
        fov: 1,
        aspect: 1,
      },
      zNear: 0.1,
      zFar: 100,
    }

    const editorCam = scene.createEntity("edior-cam", transformProps)
    editorCam.addComponent(CameraComponent, cameraProps)
    editorCam.addComponent(ScriptComponent, { scripts: [{ scriptType: OrbitingCameraController }] })

    this.engine.setActiveCamera(editorCam.entityId)
  }

  private addBillboards(scene: Scene) {
    const cameraTextureLoader = this.engine.assetManager.getTextureLoader("camera")
    scene.getComponents([ComponentType.CAMERA]).forEach(({ camera }) => {
      const target = camera?.entity
      const billboard = scene.createEntity(`camera_${target?.entityId}_billboard`)
      billboard.addComponent(BillboardComponent, { textureLoader: cameraTextureLoader })
      billboard.addComponent(ScriptComponent, { scripts: [{ scriptType: FollowEntity, props: { target: target } }] })
    })

    const sunTexture = this.engine.assetManager.getTextureLoader("sun")
    const lightbulbTexture = this.engine.assetManager.getTextureLoader("lightbulb")
    scene.getComponents([ComponentType.LIGHT]).forEach(({ light }) => {
      const target = light!.entity
      const billboard = scene.createEntity(`light_${target.entityId}_billboard`)
      billboard.addComponent(BillboardComponent, {
        textureLoader: (light as LightComponent).lightType == LightType.SUN ? sunTexture : lightbulbTexture,
      })
      billboard.addComponent(ScriptComponent, { scripts: [{ scriptType: FollowEntity, props: { target: target } }] })
    })
  }

  private addGizmo(scene: Scene) {
    const assetManager = this.engine.assetManager

    assetManager.addMaterial("unlit_red", PlainUnlitMaterial, new PlainUnlitMaterialProps(vec3.fromValues(1, 0, 0)))
    assetManager.addMaterial("unlit_green", PlainUnlitMaterial, new PlainUnlitMaterialProps(vec3.fromValues(0, 1, 0)))
    assetManager.addMaterial("unlit_blue", PlainUnlitMaterial, new PlainUnlitMaterialProps(vec3.fromValues(0, 0, 1)))
    const gizmo = scene
      .createEntity("gizmo")
      .addComponent(ScriptComponent, { scripts: [{ scriptType: StickToSelectedEntity }] })
    const gizmoId = gizmo.entityId
    scene
      .createEntity("xArrow", { rotation: quat.fromEuler(0, 0, 0, "xyz") } as TransformProps, { parentId: gizmoId })
      .addComponent(MeshRendererComponent, {
        primitives: [
          {
            materialLoader: assetManager.getMaterialLoader("unlit_red"),
            meshLoader: assetManager.getMeshLoader("arrow_mesh_0_primitive_0"),
          },
        ],
      })
    scene
      .createEntity("yArrow", { rotation: quat.fromEuler(0, 0, Math.PI / 2, "xyz") } as TransformProps, {
        parentId: gizmoId,
      })
      .addComponent(MeshRendererComponent, {
        primitives: [
          {
            materialLoader: assetManager.getMaterialLoader("unlit_green"),
            meshLoader: assetManager.getMeshLoader("arrow_mesh_0_primitive_0"),
          },
        ],
      })
    scene
      .createEntity("zArrow", { rotation: quat.fromEuler(0, -Math.PI / 2, 0, "xyz") } as TransformProps, {
        parentId: gizmoId,
      })
      .addComponent(MeshRendererComponent, {
        primitives: [
          {
            materialLoader: assetManager.getMaterialLoader("unlit_blue"),
            meshLoader: assetManager.getMeshLoader("arrow_mesh_0_primitive_0"),
          },
        ],
      })
  }

  public loadGameScene(sceneId: SceneId) {
    if (!this.engine.sceneManager.hasScene(sceneId)) {
      const copy = this.engine.sceneManager.addSceneCopy(this.game.engine.sceneManager.getScene(sceneId))
      this.addEditorCamera(copy)
      this.addBillboards(copy)
      this.addGizmo(copy)
    }
    this.engine.sceneManager.setActiveScene(sceneId)
    this.engine.reloadScene()
  }
}
