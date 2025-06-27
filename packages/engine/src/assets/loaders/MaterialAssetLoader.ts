import { GPUDataInterface } from "../../GPUDataInterface"
import { Material, MaterialCreator, MaterialProps } from "../materials/Material"
import { AssetLoader, AssetLoaderId } from "./AssetLoader"

export class MaterialAssetLoader<T extends MaterialProps> extends AssetLoader<Material> {
  private MaterialCreator: MaterialCreator<T>
  private materialProps: T

  constructor(
    gpuDataInterface: GPUDataInterface,
    id: AssetLoaderId,
    MaterialCreator: MaterialCreator<T>,
    materialProps: T,
    displayName?: string
  ) {
    super(gpuDataInterface, id, displayName)
    this.MaterialCreator = MaterialCreator
    this.materialProps = materialProps
  }

  protected loadAssetDataToGPU(): void {
    this.gpuAssetData = this.gpuDataInterface.createMaterial(this.MaterialCreator, this.materialProps)
  }
  protected unloadAssetDatoFromGPU(): void {
    this.materialProps.destroyGpuData()
  }
}
