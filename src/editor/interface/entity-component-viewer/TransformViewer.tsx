import React from 'react'
import { LuAxis3D, LuMove3D, LuRotate3D, LuScale3D } from 'react-icons/lu'
import { ComponentType, TransformComponent } from '../../../engine/components'
import { Entity } from '../../../engine/scenes/Entity'
import { LabelInput } from '../../components/LabelInput'
import { VectorInput } from '../../components/VectorInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entity: Entity
}

export function TransformViewer({ entity }: Props) {
  const transform = entity.getComponentOrUndefined(ComponentType.TRANSFORM) as TransformComponent
  if (transform == undefined) {
    return null
  }

  const position = [
    { label: 'X', value: transform.position[0] },
    { label: 'Y', value: transform.position[1] },
    { label: 'Z', value: transform.position[2] },
  ]

  const rotation = [
    { label: 'X', value: transform.rotation[0] },
    { label: 'Y', value: transform.rotation[1] },
    { label: 'Z', value: transform.rotation[2] },
    { label: 'W', value: transform.rotation[3] },
  ]

  const scale = [
    { label: 'X', value: transform.scale[0] },
    { label: 'Y', value: transform.scale[1] },
    { label: 'Z', value: transform.scale[2] },
  ]

  return (
    <ComponentViewer title="Transform" icon={<LuAxis3D />}>
      <div className="join join-vertical space-y-2">
        <div className="self-end">
          <LabelInput label="Name" initialValue={(transform.name ??= '')} onChange={(value) => (transform.name = value)} />
        </div>
        <VectorInput label="Position" icon={<LuMove3D />} initialValue={position} targetValue={transform.position} />
        <VectorInput label="Rotation" icon={<LuRotate3D />} initialValue={rotation} minValue={-1} maxValue={1} targetValue={transform.rotation} />
        <VectorInput label="Scale" icon={<LuScale3D />} initialValue={scale} targetValue={transform.scale} />
      </div>
    </ComponentViewer>
  )
}
