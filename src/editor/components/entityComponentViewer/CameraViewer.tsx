import React from 'react'

type Props = {
  cameraData: any
}

export function CameraViewer({ cameraData }: Props) {
  return (
    <div className="overflox-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Camera Component</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Name</td>
            <td>{cameraData.name}</td>
          </tr>
          <tr>
            <td>Aspect ratio</td>
            <td>{cameraData.aspect.toFixed(2)}</td>
          </tr>
          <tr>
            <td>FOV</td>
            <td>{cameraData.fov.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Clip near</td>
            <td>{cameraData.zNear.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Clip far</td>
            <td>{cameraData.zFar.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
