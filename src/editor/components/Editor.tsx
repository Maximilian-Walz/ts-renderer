import React, { useEffect, useRef, useState } from 'react'
import { GraphicEditor } from '..'
import { EntityTreeViewer } from './EntityTreeViewer'
import { EntityViewer } from './EntityViewer'
import { Panel } from './Panel'
import { SceneViewer } from './SceneViewer'

function useEditor() {
  const editorRef = useRef<GraphicEditor>()
  if (!editorRef.current) {
    editorRef.current = new GraphicEditor()
  }
  return editorRef.current
}

function projectEditor(editor: GraphicEditor) {
  return {
    entityTree: editor.getEntityTree(),
    scenes: editor.getScenes(),
    activeSceneIndex: 0,
  }
}

function useEditorProjection(editor: GraphicEditor) {
  const [projection, setProjection] = useState(projectEditor(editor))
  return {
    ...projection,
    setProjection: (newEditor: GraphicEditor) => setProjection(projectEditor(newEditor)),
    setActiveScene: (sceneIndex: number) => {
      editor.setActiveScene(sceneIndex).then(() => setProjection(projectEditor(editor)))
    },
  }
}

export function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useEditor()
  const editorProjection = useEditorProjection(editor)
  const [activeEntityId, setActiveEntityId] = useState<number | null>(null)

  const activeEntityName =
    activeEntityId != null && editorProjection.entityTree.nodes.length > activeEntityId
      ? (editorProjection.entityTree.nodes[activeEntityId].name ??= `Entity ${activeEntityId}`)
      : 'Entity Viewer'
  useEffect(() => {
    editor.init().then(() => {
      if (canvasRef.current) {
        editor.setRenderTarget(canvasRef.current)
        editor.setActiveScene(0).then(() => {
          editorProjection.setProjection(editor)
        })
      }
    })
  }, [canvasRef, editor])

  return (
    <div className="relative h-full w-full">
      <canvas className="h-full w-full" ref={canvasRef}></canvas>
      <Panel title="Scene" className="bg-base-100 absolute left-2 top-2 w-auto min-w-[48%] md:min-w-[30%] lg:min-w-[20%]">
        <SceneViewer {...editorProjection} />
        <div className="divider my-2"></div>
        <EntityTreeViewer entityTree={editorProjection.entityTree} setActiveEntityId={setActiveEntityId} />
      </Panel>
      <Panel title={activeEntityName} className="bg-base-100 absolute right-2 top-2 w-auto min-w-[48%] md:min-w-[30%] lg:min-w-[20%]">
        {activeEntityId != null ? <EntityViewer components={activeEntityId != null ? editor.getComponentsByEntityId(activeEntityId) : undefined} /> : null}
      </Panel>
    </div>
  )
}
