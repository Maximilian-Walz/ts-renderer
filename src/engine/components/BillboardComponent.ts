import { ComponentType } from '.'
import { TextureAssetLoader } from '../assets/loaders/TextureAssetLoader'
import { TextureBindGroupData } from '../rendering/bind-group-data/TextureBindGroupData'
import { Entity } from '../scenes/Entity'
import { BindGroupDataComponent } from './Component'

export type BillboardProps = {
  textureLoader: TextureAssetLoader
}

export class BillboardComponent extends BindGroupDataComponent<TextureBindGroupData> {
  textureLoader: TextureAssetLoader

  constructor(entity: Entity, props: BillboardProps) {
    super(ComponentType.BILLBOARD, entity)
    this.textureLoader = props.textureLoader
  }

  public createBindGroupData(device: GPUDevice): TextureBindGroupData {
    return new TextureBindGroupData(device, this.textureLoader.getAssetData())
  }

  public static override getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    return TextureBindGroupData.getLayout(device)
  }
}
