import { ComponentType } from '.'
import { TextureAssetLoader } from '../assets/loaders/TextureAssetLoader'
import { TextureBindGroupData } from '../rendering/bind-group-data/TextureBindGroupData'
import { BindGroupDataComponent } from './Component'

export class BillboardComponent extends BindGroupDataComponent<TextureBindGroupData> {
  textureLoader: TextureAssetLoader

  constructor(textureLoader: TextureAssetLoader) {
    super(ComponentType.BILLBOARD)
    this.textureLoader = textureLoader
  }

  public createBindGroupData(device: GPUDevice): TextureBindGroupData {
    return new TextureBindGroupData(device, this.textureLoader.getAssetData())
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return TextureBindGroupData.getLayout(device)
  }

  public toJson(): Object {
    throw new Error('Method not implemented.')
  }
}
