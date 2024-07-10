import React from 'react'
import { ComponentType } from '../../engine/components'
import { CameraViewer } from './entityComponentViewer/CameraViewer'
import { TransformViewer } from './entityComponentViewer/TransformViewer'
import { MeshRendererViewer } from './entityComponentViewer/MeshRendererViewer'
import { AutoRotateViewer } from './entityComponentViewer/AutoRotateViewer'

type Props = {
  components: any[] | undefined
}

function componentSwitch(componentType: ComponentType, componentData: any) {
  switch (componentType) {
    case ComponentType.TRANSFORM:
      return <TransformViewer transformData={componentData} />
    case ComponentType.CAMERA:
      return <CameraViewer cameraData={componentData} />
    case ComponentType.MESH_RENDERER:
      return <MeshRendererViewer meshRendererData={componentData} />
    case ComponentType.AUTO_ROTATE:
      return <AutoRotateViewer autoRotateData={componentData} />
  }
}

export function EntityViewer({ components }: Props) {
  console.log(components)
  return components ? (
    <div>
      {components.length > 0
        ? components?.map((component, index) => (
            <div key={index}>
              <div className="divider my-2" />
              {componentSwitch(component.type, component)}
            </div>
          ))
        : 'This entity has no components'}
    </div>
  ) : null
}
