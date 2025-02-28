import React from 'react'
import { useSelectedEntity } from '../state/EntitySelectionProvider'
import { CameraViewer } from './entityComponentViewer/CameraViewer'
import { LightViewer } from './entityComponentViewer/LightViewer'
import { MeshRendererViewer } from './entityComponentViewer/MeshRendererViewer'
import { TransformViewer } from './entityComponentViewer/TransformViewer'

export function RightPanel() {
  const entity = useSelectedEntity()
  return (
    <div className="flex h-0 grow flex-col">
      {entity != undefined ? (
        <>
          <div className="text-md collapse-title font-medium">{entity.entityId}</div>
          <div className="min-h-0 grow space-y-2 overflow-y-scroll">
            <TransformViewer entity={entity} />
            <CameraViewer entity={entity} />
            <LightViewer entity={entity} />
            <MeshRendererViewer entity={entity} />
          </div>
        </>
      ) : (
        <div className="text-center">No entity selected</div>
      )}
    </div>
  )
}
