import React from 'react'
import { LuLightbulb, LuPalette } from 'react-icons/lu'
import { LightComponent } from '../../../engine/components'
import { Entity } from '../../../engine/scenes/Entity'
import { NumberInput } from '../../components/NumberInput'
import { VectorInput } from '../../components/VectorInput'
import { ComponentViewer } from './ComponentViewer'

type Props = {
  entity: Entity
}

export function LightViewer({ entity }: Props) {
  const light = entity.getComponentOrUndefined(LightComponent)
  if (light == undefined) {
    return null
  }

  const color = [
    { label: 'R', value: light.color[0] },
    { label: 'G', value: light.color[1] },
    { label: 'B', value: light.color[2] },
  ]

  return (
    <ComponentViewer title="Light" icon={<LuLightbulb />} contentKey={entity.entityId}>
      <div className="self-end">
        <NumberInput label="Power" initialValue={light.power} minValue={0} onChange={(value) => (light.power = value)} />
      </div>
      <VectorInput label="Color" icon={<LuPalette />} initialValue={color} minValue={0} maxValue={1} targetValue={light.color} />
      <input type="checkbox" className="checkbox" defaultChecked={light.castShadow as boolean} onChange={(event) => (light.castShadow = event.target.checked)} />
    </ComponentViewer>
  )
}
