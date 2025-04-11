import { ComponentType } from '.'
import { MeshAssetLoader } from '../assets/loaders/MeshAssetLoader'
import { PbrMaterialAssetLoader } from '../assets/loaders/PbrMaterialAssetLoader'
import { Entity } from '../scenes/Entity'
import { Component } from './Component'

export type PrimitiveRenderData = {
  materialLoader: PbrMaterialAssetLoader
  meshLoader: MeshAssetLoader
}

export type MeshRendererProps = {
  primitives: PrimitiveRenderData[]
}

export class MeshRendererComponent extends Component<MeshRendererProps> {
  constructor(entity: Entity, props: MeshRendererProps) {
    super(ComponentType.MESH_RENDERER, entity, props)
  }

  get primitives() {
    return this.props.primitives
  }
}
