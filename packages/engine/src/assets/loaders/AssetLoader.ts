import { GPUDataInterface } from "../../GPUDataInterface"

export type AssetLoaderId = string

export abstract class AssetLoader<GPUAssetType> {
  public id: AssetLoaderId
  public displayName?: string

  protected gpuDataInterface: GPUDataInterface
  protected gpuAssetData!: GPUAssetType
  private isLoaded: boolean = false
  private usages: number = 0

  constructor(gpuDataInterface: GPUDataInterface, id: AssetLoaderId, displayName?: string) {
    this.id = id
    this.gpuDataInterface = gpuDataInterface
    this.displayName = displayName
  }

  protected abstract loadAssetDataToGPU(): void
  protected abstract unloadAssetDatoFromGPU(): void

  private ensureAssetLoadedToGPU(): void {
    if (!this.isLoaded) {
      this.loadAssetDataToGPU()
      this.isLoaded = true
    }
  }

  private ensureAssetUnloadedFromGPU(): void {
    if (this.isLoaded) {
      this.unloadAssetDatoFromGPU()
      this.isLoaded = false
    }
  }

  public registerUsage() {
    this.usages++
  }

  public deregisterUsage() {
    this.usages--
    if (this.usages == 0) {
      this.ensureAssetUnloadedFromGPU()
    }
  }

  public getAssetData(): GPUAssetType {
    this.ensureAssetLoadedToGPU()
    return this.gpuAssetData
  }
}
