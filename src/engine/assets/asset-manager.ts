import { EntityComponentSystem } from "../entity-component-system";
import { GltfLoader } from 'gltf-loader-ts';
import { SceneLoader } from "./scene-loader";

export enum BufferTarget {
    ARRAY_BUFFER=34962,
    ELEMENT_ARRAY_BUFFER=34963
}

export type Buffer = {
    data: Uint8Array,
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

    async loadSceneFromGltf(path: string, onProgress?: ((xhr: ProgressEvent<EventTarget>) => void) | undefined) {
        return this.gltfLoader.load(path, (xhr) => {
            // @ts-ignore
            if (xhr.total)
                // @ts-ignore
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            else
                console.log("Finished loading " + path)
            // @ts-ignore
            onProgress??(xhr)
        }).then(asset => {
            SceneLoader.createEntitiesFromGltf(this.ecs, asset.gltf)
            asset.gltf.bufferViews!.forEach(async (bufferView, index) => 
                await asset.bufferViewData(index).then(data => 
                    this.buffers[index] = {
                        data: data,
                        target: bufferView.target
                    }
                )
            )
        })
    }
}