import { Entity, TransformComponent } from "@my/engine"
import { LuAxis3D, LuMove3D, LuRotate3D, LuScale3D } from "react-icons/lu"
import { VectorInput } from "../../components/VectorInput"
import { ComponentViewer } from "./ComponentViewer"

type Props = {
  entity: Entity
}

export function TransformViewer({ entity }: Props) {
  const transform = entity.getComponentOrUndefined(TransformComponent)
  if (transform == undefined) {
    return null
  }

  const position = [
    { label: "X", value: transform.position[0] },
    { label: "Y", value: transform.position[1] },
    { label: "Z", value: transform.position[2] },
  ]

  const rotation = [
    { label: "X", value: transform.rotation[0] },
    { label: "Y", value: transform.rotation[1] },
    { label: "Z", value: transform.rotation[2] },
    { label: "W", value: transform.rotation[3] },
  ]

  const scale = [
    { label: "X", value: transform.scale[0] },
    { label: "Y", value: transform.scale[1] },
    { label: "Z", value: transform.scale[2] },
  ]

  return (
    <ComponentViewer title="Transform" icon={<LuAxis3D />} contentKey={entity.entityId}>
      <div className="join join-vertical space-y-2">
        <VectorInput label="Position" icon={<LuMove3D />} initialValue={position} targetValue={transform.position} />
        <VectorInput
          label="Rotation"
          icon={<LuRotate3D />}
          initialValue={rotation}
          minValue={-1}
          maxValue={1}
          targetValue={transform.rotation}
        />
        <VectorInput label="Scale" icon={<LuScale3D />} initialValue={scale} targetValue={transform.scale} />
      </div>
    </ComponentViewer>
  )
}
