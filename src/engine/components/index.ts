export const NUM_OF_COMPONENT_TYPES = 6
export enum ComponentType {
  TRANSFORM = 'transform',
  CAMERA = 'camera',
  MESH_RENDERER = 'meshRenderer',
  LIGHT = 'light',
  BILLBOARD = 'billboard',
  SHADOW_MAP = 'shadowMap',
  SCRIPT = 'script',
}

export * from './BillboardComponent'
export * from './CameraComponent'
export * from './Component'
export * from './LightComponent'
export * from './MeshRendererComponent'
export * from './ScriptComponent'
export * from './ShadowMapComponent'
export * from './TransformComponent'
