import React from 'react'

type Props = {
  autoRotateData: any
}

export function AutoRotateViewer({ autoRotateData }: Props) {
  return (
    <div className="overflox-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Auto Rotate Component</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pr-5">Axis</td>
            <td>{autoRotateData.axis[0]}</td>
            <td>{autoRotateData.axis[1]}</td>
            <td>{autoRotateData.axis[2]}</td>
          </tr>
          <tr>
            <td className="pr-5">Speed</td>
            <td>{autoRotateData.speed}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
