import { MaterialAssetLoader } from "../assets/loaders/MaterialAssetLoader"
import { MeshAssetLoader } from "../assets/loaders/MeshAssetLoader"
import { Component } from "./Component"

export type PrimitiveRenderData = {
  materialLoader: MaterialAssetLoader<any>
  meshLoader: MeshAssetLoader
}

export type MeshRendererProps = {
  primitives: PrimitiveRenderData[]
}

export class MeshRendererComponent extends Component<MeshRendererProps> {
  get primitives() {
    return this.props.primitives
  }
}
