import React from 'react'

type Props = {
  meshRendererData: any
}

export function MeshRendererViewer({ meshRendererData }: Props) {
  return (
    <div className="overflox-x-auto">
      <table className="table">
        <thead>
          <tr>
            <th>Mesh Renderer Component</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="pr-5">Name</td>
            <td>{meshRendererData.name}</td>
          </tr>
          <tr>
            <td className="pr-5">Material</td>
            <td>{meshRendererData.material}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
