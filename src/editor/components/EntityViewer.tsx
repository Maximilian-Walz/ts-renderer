import { useIntervalWhen } from '@uidotdev/usehooks'
import React, { useContext, useState } from 'react'
import { ComponentType } from '../../engine/components'
import { EditorContext } from './Editor'
import { AutoRotateViewer } from './entityComponentViewer/AutoRotateViewer'
import { CameraViewer } from './entityComponentViewer/CameraViewer'
import { MeshRendererViewer } from './entityComponentViewer/MeshRendererViewer'
import { TransformViewer } from './entityComponentViewer/TransformViewer'

type Props = {
  activeEntityId: number
  doRealtimeUpdates: boolean
}

function componentSwitch(componentType: ComponentType, activeEntityId: number, componentData: any) {
  switch (componentType) {
    case ComponentType.TRANSFORM:
      return <TransformViewer entityId={activeEntityId} transformData={componentData} />
    case ComponentType.CAMERA:
      return <CameraViewer entityId={activeEntityId} cameraData={componentData} />
    case ComponentType.MESH_RENDERER:
      return <MeshRendererViewer entityId={activeEntityId} meshRendererData={componentData} />
    case ComponentType.AUTO_ROTATE:
      return <AutoRotateViewer entityId={activeEntityId} autoRotateData={componentData} />
  }
}

export function EntityViewer({ activeEntityId, doRealtimeUpdates }: Props) {
  const editor = useContext(EditorContext)
  const [components, setComponents] = useState<any[]>(editor!.getComponentsByEntityId(activeEntityId))

  useIntervalWhen(
    () => {
      if (editor) {
        setComponents(editor.getComponentsByEntityId(activeEntityId))
      }
    },
    { ms: 50, when: doRealtimeUpdates, startImmediately: false }
  )

  return components ? (
    <div className="space-y-2">
      {components.length > 0
        ? components?.map((component, index) => <div key={index}>{componentSwitch(component.type, activeEntityId, component)}</div>)
        : 'This entity has no components'}
    </div>
  ) : null
}
