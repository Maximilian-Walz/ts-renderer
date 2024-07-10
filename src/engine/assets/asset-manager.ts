import { GltfLoader } from 'gltf-loader-ts'
import { EntityComponentSystem } from '../entity-component-system'
import { SceneLoader } from './scene-loader'

export enum BufferTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

export type Buffer = {
  data: Uint8Array
  target?: BufferTarget
}

export class AssetManager {
  private ecs: EntityComponentSystem
  private gltfLoader: GltfLoader

  buffers: Buffer[] = []

  constructor(ecs: EntityComponentSystem) {
    this.ecs = ecs
    this.gltfLoader = new GltfLoader()
  }

  async loadSceneFromGltf(path: string) {
    const asset = await this.gltfLoader.load(path)
    console.log('Finished loading ' + path)
    SceneLoader.createEntitiesFromGltf(this.ecs, asset.gltf)
    await Promise.all(
      asset.gltf.bufferViews!.map(async (bufferView, index) => {
        await asset.bufferViewData(index).then((data) => {
          this.buffers[index] = {
            data: data,
            target: bufferView.target,
          }
        })
      })
    )
  }
}
