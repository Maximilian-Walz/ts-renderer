import { CameraComponent, CameraType, Entity, OrthographicData, PerspectiveData } from "@my/engine"
import { LuCamera } from "react-icons/lu"
import { NumberInput } from "../../components/NumberInput"
import { ComponentViewer } from "./ComponentViewer"

type Props = {
  entity: Entity
}

function PerspectiveViewer({ camera }: { camera: CameraComponent }) {
  return (
    <>
      <NumberInput
        label={"Field of View"}
        initialValue={(camera.projectionData as PerspectiveData).fov}
        precision={4}
        step={0.1}
        onChange={(value) => ((camera.projectionData as PerspectiveData).fov = value)}
      />
      {camera.useCanvasAspect && (
        <NumberInput
          label={"Aspect Ratio"}
          initialValue={(camera.projectionData as PerspectiveData).aspect}
          precision={4}
          step={0.1}
          onChange={(value) => ((camera.projectionData as PerspectiveData).aspect = value)}
        />
      )}
      <div className="form-control space-y-0.5">
        <div className="label-text -mb-4">Clip</div>
        <NumberInput
          label={"Near"}
          initialValue={camera.zNear}
          precision={4}
          onChange={(value) => (camera.zNear = value)}
        />
        <NumberInput
          label={"Far"}
          initialValue={camera.zFar}
          precision={4}
          onChange={(value) => (camera.zFar = value)}
        />
      </div>
    </>
  )
}

function OrthographicViewer({ camera }: { camera: CameraComponent }) {
  return (
    <>
      <NumberInput
        label={"xMag"}
        initialValue={(camera.projectionData as OrthographicData).xMag}
        precision={4}
        step={0.1}
        onChange={(value) => ((camera.projectionData as OrthographicData).xMag = value)}
      />
      <NumberInput
        label={"yMag"}
        initialValue={(camera.projectionData as OrthographicData).yMag}
        precision={4}
        step={0.1}
        onChange={(value) => ((camera.projectionData as OrthographicData).yMag = value)}
      />
      <div className="form-control space-y-0.5">
        <div className="label-text -mb-4">Clip</div>
        <NumberInput
          label={"Near"}
          initialValue={camera.zNear}
          precision={4}
          onChange={(value) => (camera.zNear = value)}
        />
        <NumberInput
          label={"Far"}
          initialValue={camera.zFar}
          precision={4}
          onChange={(value) => (camera.zFar = value)}
        />
      </div>
    </>
  )
}

export function CameraViewer({ entity }: Props) {
  const camera = entity.getComponentOrUndefined(CameraComponent)
  if (camera == undefined) {
    return null
  }

  const cameraSwitch = (cameraType: CameraType) => {
    switch (cameraType) {
      case CameraType.PERSPECTIVE:
        return <PerspectiveViewer camera={camera} />
      case CameraType.ORTHOGRAPHIC:
        return <OrthographicViewer camera={camera} />
    }
  }

  return (
    <ComponentViewer title="Camera" icon={<LuCamera />} contentKey={entity.entityId}>
      <div className="join join-vertical space-y-1">{cameraSwitch(camera.cameraType)}</div>
    </ComponentViewer>
  )
}
