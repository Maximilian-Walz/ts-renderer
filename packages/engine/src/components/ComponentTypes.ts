import { BillboardComponent } from "./BillboardComponent"
import { HierarchyComponent } from "./HierarchyComponent"
import { LightComponent } from "./LightComponent"
import { MeshRendererComponent } from "./MeshRendererComponent"
import { ScriptComponent } from "./ScriptComponent"
import { ShadowMapComponent } from "./ShadowMapComponent"
import { TransformComponent } from "./TransformComponent"

export interface ComponentMap {
  transform: TransformComponent
  hierarchy: HierarchyComponent
  light: LightComponent
  meshRenderer: MeshRendererComponent
  shadowMap: ShadowMapComponent
  billboard: BillboardComponent
  script: ScriptComponent
}

export type ComponentOf<K extends keyof ComponentMap> = {
  type: K
} & ComponentMap[K]

export type AnyComponent = {
  [K in keyof ComponentMap]: ComponentOf<K>
}[keyof ComponentMap]
