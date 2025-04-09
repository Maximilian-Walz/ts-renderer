import { ComponentType } from '.'
import { BindGroupData } from '../rendering/bind-group-data/BindGroupData'

export abstract class Component {
  [x: string]: any
  public readonly type: ComponentType
  public abstract toJson(): Object

  constructor(type: ComponentType) {
    this.type = type
  }
}

export abstract class BindGroupDataComponent<T extends BindGroupData> extends Component {
  protected bindGroupData: T | undefined

  public abstract createBindGroupData(device: GPUDevice): T

  public static getBindGroupLayout(device: GPUDevice): GPUBindGroupLayout {
    throw Error('Method not implemented! Use derived class')
  }

  public getOrCreateBindGroupData(device: GPUDevice): T {
    if (this.bindGroupData == undefined) {
      this.bindGroupData = this.createBindGroupData(device)
    }
    return this.bindGroupData
  }

  public getBindGroupData() {
    return this.bindGroupData
  }
}
