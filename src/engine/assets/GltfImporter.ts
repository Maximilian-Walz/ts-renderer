import { GltfLoader, ImageData } from 'gltf-loader-ts'
import { Accessor, BufferView, GlTf, Material, Mesh, Sampler, Texture, TextureInfo } from 'gltf-loader-ts/lib/gltf'
import { vec3, vec4 } from 'wgpu-matrix'
import { SceneManger } from '../scenes/SceneManager'
import { AssetManager } from './AssetManager'
import { GltfEntityLoader } from './GltfEntityLoader'
import { TextureIdentifier } from './materials/Material'
import { DefaultPbrMaterial, DefaultPbrMaterialProps } from './materials/pbr/DefaultPbrMaterial'
import { BufferAccessor, BufferDataType, VertexAttributeType } from './Mesh'

enum TextureWrapMode {
  CLAMP_TO_EDGE = 'clamp-to-edge',
  MIRRORED_REPEAT = 'mirrored-repeat',
  REPEAT = 'repeat',
}

enum TextureFilterMode {
  NEAREST = 'nearest',
  LINEAR = 'linear',
}

enum BufferTarget {
  ARRAY_BUFFER = 34962,
  ELEMENT_ARRAY_BUFFER = 34963,
}

type SamplerData = {
  wrapS: TextureWrapMode
  wrapT: TextureWrapMode
  magFilter: TextureFilterMode
  minFilter: TextureFilterMode
  mipMapFilter?: TextureFilterMode
}

export class GltfImporter {
  private assetManager: AssetManager
  private sceneManager: SceneManger
  private identifierPrefix: string
  private path: string

  constructor(assetManager: AssetManager, sceneManager: SceneManger, identifierPrefix: string, path: string) {
    this.assetManager = assetManager
    this.sceneManager = sceneManager
    this.identifierPrefix = identifierPrefix
    this.path = path
  }

  public async importGltf() {
    const asset = await new GltfLoader().load(this.path)

    // TODO:  Can the rest be loaded, while the textures are "awaited"?
    if (asset.gltf.textures) await this.importTextures(asset.gltf.textures, asset.imageData)
    if (asset.gltf.bufferViews) await this.importBuffers(asset.gltf.bufferViews, asset.bufferViewData.bind(asset))
    if (asset.gltf.samplers) this.importSamplers(asset.gltf.samplers)
    if (asset.gltf.materials) this.importMaterials(asset.gltf.materials)
    if (asset.gltf.meshes && asset.gltf.accessors) this.importMeshes(asset.gltf.meshes, asset.gltf.accessors)

    if (asset.gltf.scenes && asset.gltf.nodes) this.importScenes(asset.gltf)
  }

  private async importTextures(textures: Texture[], imageData: ImageData) {
    await Promise.all(
      textures.map(async (texture, index) =>
        imageData.get(texture.source!).then((imageElement) => {
          this.assetManager.addTexture(this.createTextureId(index), imageElement, texture.name)
        })
      )
    )
  }

  private async importBuffers(bufferViews: BufferView[], bufferViewData: (bufferViewIndex: number) => Promise<Uint8Array>) {
    await Promise.all(
      bufferViews.map(async (bufferView, index) =>
        bufferViewData(index).then((data) => {
          let usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.VERTEX | GPUBufferUsage.INDEX
          if (bufferView.target == BufferTarget.ARRAY_BUFFER) usage = GPUBufferUsage.VERTEX
          else if (bufferView.target == BufferTarget.ELEMENT_ARRAY_BUFFER) usage = GPUBufferUsage.INDEX
          this.assetManager.addBuffer(this.createBufferId(index), data, usage)
        })
      )
    )
  }

  private importSamplers(samplers: Sampler[]) {
    samplers.forEach((sampler, index) => {
      const samplerData: SamplerData = {
        wrapS: GltfImporter.mapTextureWrapMode(sampler.wrapS),
        wrapT: GltfImporter.mapTextureWrapMode(sampler.wrapT),
        magFilter: GltfImporter.mapTextureFilterMode(sampler.magFilter),
        minFilter: GltfImporter.mapTextureFilterMode(sampler.minFilter),
        mipMapFilter: GltfImporter.mapMipMapFilterMode(sampler.minFilter),
      }

      // TODO: add samplers
    })
  }

  private importMaterials(materials: Material[]) {
    materials.forEach((materialData, index) => {
      const materialProps = DefaultPbrMaterialProps.fromDefaultTextures(this.assetManager)
      const pbr = materialData.pbrMetallicRoughness
      if (pbr?.baseColorTexture) materialProps.albedoTexture = this.parseTextureInfo(pbr.baseColorTexture)
      if (pbr?.metallicRoughnessTexture) materialProps.metallicRoughnessTexture = this.parseTextureInfo(pbr.metallicRoughnessTexture)
      if (materialData.normalTexture) materialProps.normalTexture = this.parseTextureInfo(materialData.normalTexture as TextureInfo)
      if (materialData.occlusionTexture != undefined) materialProps.occlusionTexture = this.parseTextureInfo(materialData.occlusionTexture as TextureInfo)
      if (materialData.emissiveTexture != undefined) materialProps.emissiveTexture = this.parseTextureInfo(materialData.emissiveTexture)

      if (materialData.pbrMetallicRoughness) {
        const pbr = materialData.pbrMetallicRoughness
        if (pbr.baseColorFactor) materialProps.albedoFactor = vec4.fromValues(...pbr.baseColorFactor)
        if (pbr.metallicFactor) materialProps.metallicFactor = pbr.metallicFactor
        if (pbr.roughnessFactor) materialProps.roughnessFactor = pbr.roughnessFactor
      }

      if (materialData.emissiveFactor) materialProps.emissiveFactor = vec3.fromValues(...materialData.emissiveFactor)
      this.assetManager.addPbrMaterial(this.createMaterialId(index), DefaultPbrMaterial, materialProps, materialData.name)
    })
  }

  private importMeshes(meshes: Mesh[], accessors: Accessor[]) {
    meshes.forEach((mesh, meshIndex) => {
      mesh.primitives.forEach((primitive, primitiveIndex) => {
        const vertexAttributes = new Map<VertexAttributeType, BufferAccessor>()

        const loadAttributeIfPresent = (attributeType: VertexAttributeType): Boolean => {
          const attributeIndex = primitive.attributes[attributeType]
          if (attributeIndex != undefined) {
            vertexAttributes.set(attributeType, this.createAccessor(accessors[attributeIndex]))
            return true
          }
          return false
        }

        const requiredAttributesLoaded = loadAttributeIfPresent(VertexAttributeType.POSITION) && loadAttributeIfPresent(VertexAttributeType.NORMAL)
        if (!requiredAttributesLoaded) {
          console.error(`Could not load primitive of mesh ${mesh.name}`)
          return
        }

        if (!loadAttributeIfPresent(VertexAttributeType.TEXCOORD_0)) {
          console.warn(`No texcoords found for primitive of mesh ${mesh.name}`)
        }

        if (!loadAttributeIfPresent(VertexAttributeType.TANGENT)) {
          console.warn(`No tangents found. Calculating tangents not implemented yet. Skipping primitive of mesh ${mesh.name}.`)
          return
        }

        this.assetManager.addMesh(
          this.createMeshId(meshIndex, primitiveIndex),
          {
            indexBufferAccessor: this.createAccessor(accessors[primitive.indices!]),
            vertexAttributes: vertexAttributes,
            mode: primitive.mode,
          },
          mesh.name
        )
      })
    })
  }

  private importScenes(gltf: GlTf) {
    const loader = new GltfEntityLoader(this.assetManager, gltf, this.createMeshId.bind(this), this.createMaterialId.bind(this))
    gltf.scenes!.forEach((scene, index) => {
      this.sceneManager.addScene(loader.importScene(this.createSceneId(index), scene))
    })
  }

  private createAccessor(accessor: Accessor): BufferAccessor {
    return {
      buffer: this.assetManager.getBufferLoader(this.createBufferId(accessor.bufferView!)),
      componentType: accessor.componentType,
      offset: accessor.byteOffset ?? 0,
      count: accessor.count,
      type: BufferDataType[accessor.type as keyof typeof BufferDataType],
    }
  }

  private createSceneId(sceneIndex: number): string {
    return `${this.identifierPrefix}_scene_${sceneIndex}`
  }

  private createTextureId(textureIndex: number) {
    return `${this.identifierPrefix}_texture_${textureIndex}`
  }

  private createSamplerId(samplerIndex: number) {
    return `${this.identifierPrefix}_sampler_${samplerIndex}`
  }

  private createMaterialId(materialIndex: number) {
    return `${this.identifierPrefix}_material_${materialIndex}`
  }

  private createMeshId(meshIndex: number, primitiveIndex: number) {
    return `${this.identifierPrefix}_mesh_${meshIndex}_primitive_${primitiveIndex}`
  }

  private createBufferId(bufferIndex: number) {
    return `${this.identifierPrefix}_buffer_${bufferIndex}`
  }

  private parseTextureInfo(textureInfo: TextureInfo): TextureIdentifier {
    return {
      textureData: this.assetManager.getTextureLoader(this.createTextureId(textureInfo.index)),
      texCoordId: (textureInfo.texCoord ??= 0),
    }
  }

  private static mapTextureWrapMode(wrapMode?: number): TextureWrapMode {
    switch (wrapMode) {
      case 33071:
        return TextureWrapMode.CLAMP_TO_EDGE
      case 33648:
        return TextureWrapMode.MIRRORED_REPEAT
      case 10497:
        return TextureWrapMode.REPEAT
      default:
        return TextureWrapMode.REPEAT
    }
  }

  private static mapTextureFilterMode(filterMode?: number): TextureFilterMode {
    switch (filterMode) {
      case 9728:
        return TextureFilterMode.NEAREST
      case 9729:
        return TextureFilterMode.LINEAR
      case 9984:
        return TextureFilterMode.NEAREST
      case 9985:
        return TextureFilterMode.LINEAR
      case 9986:
        return TextureFilterMode.NEAREST
      case 9987:
        return TextureFilterMode.LINEAR
      default:
        return TextureFilterMode.NEAREST
    }
  }

  private static mapMipMapFilterMode(filterMode?: number): TextureFilterMode | undefined {
    switch (filterMode) {
      case 9984:
        return TextureFilterMode.NEAREST
      case 9985:
        return TextureFilterMode.NEAREST
      case 9986:
        return TextureFilterMode.LINEAR
      case 9987:
        return TextureFilterMode.LINEAR
      default:
        return undefined
    }
  }
}
