import React from 'react'
import { useSelectedEntity } from '../state/EntitySelectionProvider'
import { CameraViewer } from './entityComponentViewer/CameraViewer'
import { LightViewer } from './entityComponentViewer/LightViewer'
import { MeshRendererViewer } from './entityComponentViewer/MeshRendererViewer'
import { TransformViewer } from './entityComponentViewer/TransformViewer'

export function RightPanel() {
  const entity = useSelectedEntity()
  return entity != undefined ? (
    <div>
      <div className="text-md collapse-title font-medium">{entity.entityId}</div>
      <div className="space-y-2">
        <TransformViewer entity={entity} />
        <CameraViewer entity={entity} />
        <LightViewer entity={entity} />
        <MeshRendererViewer entity={entity} />
      </div>
    </div>
  ) : (
    <div>No entity selected</div>
  )
}
