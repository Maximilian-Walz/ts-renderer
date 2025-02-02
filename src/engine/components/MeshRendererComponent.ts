import { Component, ComponentType } from '.'
import { MeshAssetLoader } from '../assets/loaders/MeshAssetLoader'
import { PbrMaterialAssetLoader } from '../assets/loaders/PbrMaterialAssetLoader'

export type PrimitiveRenderData = {
  materialLoader: PbrMaterialAssetLoader
  meshLoader: MeshAssetLoader
}

export class MeshRendererComponent extends Component {
  name?: string
  primitives: PrimitiveRenderData[] = []

  constructor() {
    super(ComponentType.MESH_RENDERER)
  }

  toJson(): Object {
    return {
      type: this.type,
      name: this.name,
      primitives: this.primitives.map((primitiveData) => {
        return {
          material: 'Some material data...',
        }
      }),
    }
  }
}
