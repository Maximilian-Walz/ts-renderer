import { ComponentType } from '.'
import { BindGroupData } from '../rendering/bind-group-data/BindGroupData'
import { Entity } from '../scenes/Entity'

export abstract class Component {
  public readonly type: ComponentType
  public readonly entity: Entity

  constructor(type: ComponentType, entity: Entity) {
    this.type = type
    this.entity = entity
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
