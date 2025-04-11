import { ComponentType } from '.'
import { MeshAssetLoader } from '../assets/loaders/MeshAssetLoader'
import { PbrMaterialAssetLoader } from '../assets/loaders/PbrMaterialAssetLoader'
import { Component } from './Component'

export type PrimitiveRenderData = {
  materialLoader: PbrMaterialAssetLoader
  meshLoader: MeshAssetLoader
}

export type MeshRendererProps = {
  primitives: PrimitiveRenderData[]
}

export class MeshRendererComponent extends Component<MeshRendererProps> {
  get type(): ComponentType {
    return MeshRendererComponent.getType()
  }

  public static override getType(): ComponentType {
    return ComponentType.MESH_RENDERER
  }

  get primitives() {
    return this.props.primitives
  }
}
