import { Entity, ShadowMapComponent } from "@my/engine"
import { useState } from "react"
import { LuCircleDashed } from "react-icons/lu"
import { NumberInput } from "../../components/NumberInput"
import { ComponentViewer } from "./ComponentViewer"

type Props = {
  entity: Entity
}

export function ShadowMapViewer({ entity }: Props) {
  const shadowMap = entity.getComponentOrUndefined(ShadowMapComponent)
  if (shadowMap == undefined) {
    return null
  }

  const [size, setSize] = useState<number>(shadowMap.size)

  return (
    <ComponentViewer title="Shadow Map" icon={<LuCircleDashed />} contentKey={entity.entityId}>
      <div className="self-end">
        <NumberInput label="Size" initialValue={size} precision={0} minValue={0} onChange={(value) => setSize(value)} />
        <button className="btn btn-sm bg-gray-700" onClick={() => shadowMap.upateSize(size)}>
          Apply size
        </button>
      </div>
    </ComponentViewer>
  )
}
