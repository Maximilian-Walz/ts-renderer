import { TextureAssetLoader } from "../assets/loaders/TextureAssetLoader"
import { TextureBindGroupData } from "../rendering/bind-group-data/TextureBindGroupData"
import { BindGroupDataComponent } from "./Component"

export type BillboardProps = {
  textureLoader: TextureAssetLoader
}

export class BillboardComponent extends BindGroupDataComponent<TextureBindGroupData, BillboardProps> {
  public override createBindGroupData(device: GPUDevice): TextureBindGroupData {
    return new TextureBindGroupData(device, this.props.textureLoader.getAssetData())
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return TextureBindGroupData.getLayout(device)
  }

  get textureLoader() {
    return this.props.textureLoader
  }
}
