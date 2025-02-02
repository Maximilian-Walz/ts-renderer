import { GPUDataInterface } from '../../GPUDataInterface'
import { GPUMaterial, PbrMaterial } from '../Material'
import { AssetLoader } from './AssetLoader'

export class PbrMaterialAssetLoader extends AssetLoader<GPUMaterial> {
  private materialData!: PbrMaterial

  constructor(gpuDataInterface: GPUDataInterface, materialData: PbrMaterial, displayName?: string) {
    super(gpuDataInterface, displayName)
    this.materialData = materialData
  }

  protected loadAssetDataToGPU(): void {
    this.gpuAssetData = this.gpuDataInterface.createPbrMaterial(this.materialData)
  }
  protected unloadAssetDatoFromGPU(): void {
    this.materialData.albedoTexture.textureData.deregisterUsage()
    this.materialData.metallicRoughnessTexture.textureData.deregisterUsage()
    this.materialData.normalTexture.textureData.deregisterUsage()
    this.materialData.occlusionTexture.textureData.deregisterUsage()
    this.materialData.emissiveTexture.textureData.deregisterUsage()
  }
}
