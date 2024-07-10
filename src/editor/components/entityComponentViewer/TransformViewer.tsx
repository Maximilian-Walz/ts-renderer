import React from 'react'

type Props = {
  transformData: any
}

export function TransformViewer({ transformData }: Props) {
  return (
    <div className="overflox-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Transform Component</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pr-5">Name</td>
            <td>{transformData.name}</td>
          </tr>
          <tr>
            <td className="pr-5">ParentId</td>
            <td>{transformData.parent}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
