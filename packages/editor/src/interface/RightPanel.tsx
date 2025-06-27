import { LuComponent, LuInfo } from "react-icons/lu"
import { CollapseCard } from "../components/CollapseCard"
import { useSelectedEntity } from "../state/EntitySelectionProvider"
import { AddComponentDropdown } from "./AddComponentDropdown"
import { CameraViewer } from "./entity-component-viewer/CameraViewer"
import { LightViewer } from "./entity-component-viewer/LightViewer"
import { MeshRendererViewer } from "./entity-component-viewer/MeshRendererViewer"
import { ShadowMapViewer } from "./entity-component-viewer/ShadowMapViewer"
import { TransformViewer } from "./entity-component-viewer/TransformViewer"

export function RightPanel() {
  const entity = useSelectedEntity()
  return (
    <div className="flex grow flex-col overflow-auto">
      <CollapseCard
        icon={<LuComponent />}
        title={`Components ${entity != undefined ? `of ${entity.entityId}` : ""}`}
        defaultExpanded
      >
        {entity != undefined ? (
          <div className="space-y-2 grow">
            <TransformViewer entity={entity} />
            <CameraViewer entity={entity} />
            <LightViewer entity={entity} />
            <ShadowMapViewer entity={entity} />
            <MeshRendererViewer entity={entity} />
            <AddComponentDropdown />
          </div>
        ) : (
          <div className="grow">
            <div className="alert text-xs alert-soft p-2 alert-info">
              <LuInfo /> No entity selected
            </div>
          </div>
        )}
      </CollapseCard>
    </div>
  )
}
