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
  name?: string
  primitives: PrimitiveRenderData[]
}

export class MeshRendererComponent extends Component {
  name?: string
  primitives: PrimitiveRenderData[] = []

  constructor(entity: Entity, props: MeshRendererProps) {
    super(ComponentType.MESH_RENDERER, entity)
    this.name = props.name
    this.primitives = props.primitives
  }
}
