import { ComponentType } from '.'
import { TextureAssetLoader } from '../assets/loaders/TextureAssetLoader'
import { Component } from './Component'

export class BillboardComponent extends Component {
  textureLoader: TextureAssetLoader

  bindGroup: GPUBindGroup | undefined
  static bindGroupLayout: GPUBindGroupLayout

  constructor(textureLoader: TextureAssetLoader) {
    super(ComponentType.BILLBOARD)
    this.textureLoader = textureLoader
  }

  public toJson(): Object {
    throw new Error('Method not implemented.')
  }
}
