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

  const assetManager = useEditor()?.engine.assetManager

  return (
    <ComponentViewer title="Mesh Renderer" icon={<LuBox />} contentKey={entity.entityId}>
      {meshRenderer.primitives.map((primitive, index) => (
        <div key={index}>
          <div>Mesh</div>
          <AssetLoaderSelect<MeshAssetLoader>
            currentAssetLoader={primitive.meshLoader}
            selectableAssetLoaders={assetManager?.getMeshLoaders()!}
          />
          <div>Material</div>
          <AssetLoaderSelect<MaterialAssetLoader<any>>
            currentAssetLoader={primitive.materialLoader}
            selectableAssetLoaders={assetManager?.getMaterialLoaders()!}
          />
        </div>
      ))}
    </ComponentViewer>
  )
}
