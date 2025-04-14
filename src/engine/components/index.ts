export enum ComponentType {
  TRANSFORM = 'transform',
  CAMERA = 'camera',
  MESH_RENDERER = 'meshRenderer',
  LIGHT = 'light',
  BILLBOARD = 'billboard',
  SHADOW_MAP = 'shadowMap',
  SCRIPT = 'script',
  HIERARCHY = 'hierarchy',
}

export * from './BillboardComponent'
export * from './CameraComponent'
export * from './Component'
export * from './HierarchyComponent'
export * from './LightComponent'
export * from './MeshRendererComponent'
export * from './ScriptComponent'
export * from './ShadowMapComponent'
export * from './TransformComponent'
