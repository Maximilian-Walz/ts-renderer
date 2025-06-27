import { Entity, MaterialAssetLoader, MeshAssetLoader, MeshRendererComponent } from "@my/engine"
import { LuBox } from "react-icons/lu"
import { useEditor } from "../../state/EditorProvider"
import { AssetLoaderSelect } from "../AssetLoaderSelect"
import { ComponentViewer } from "./ComponentViewer"

type Props = {
  entity: Entity
}

export function MeshRendererViewer({ entity }: Props) {
  const meshRenderer = entity.getComponentOrUndefined(MeshRendererComponent)
  if (meshRenderer == undefined) {
    return null
  }

  const assetManager = useEditor()?.game.engine.assetManager

  return (
    <ComponentViewer title="Mesh Renderer" icon={<LuBox />} contentKey={entity.entityId}>
      {meshRenderer.primitives.map((primitive, index) => (
        <div key={index} className="flex flex-col space-y-2">
          <AssetLoaderSelect<MeshAssetLoader>
            label="Mesh"
            primitiveId={index}
            currentAssetLoader={primitive.meshLoader}
            selectableAssetLoaders={assetManager?.getMeshLoaders()!}
            setAssetLoader={(loader) => (primitive.meshLoader = loader)}
          />
          <AssetLoaderSelect<MaterialAssetLoader<any>>
            label="Material"
            primitiveId={index}
            currentAssetLoader={primitive.materialLoader}
            selectableAssetLoaders={assetManager?.getMaterialLoaders()!}
            setAssetLoader={(loader) => (primitive.materialLoader = loader)}
          />
        </div>
      ))}
    </ComponentViewer>
  )
}
