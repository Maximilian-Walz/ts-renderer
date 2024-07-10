import React, { useEffect, useRef, useState } from 'react'
import { GraphicEditor } from '..'
import { EntityTreeViewer } from './EntityTreeViewer'
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

  useEffect(() => {
    editor.init().then(() => {
      if (canvasRef.current) {
        editor.setRenderTarget(canvasRef.current)
        editor.setActiveScene(0).then(() => editorProjection.setProjection(editor))
      }
    })
  }, [canvasRef, editor])

  return (
    <div className="relative h-full w-full">
      <canvas className="h-full w-full" ref={canvasRef}></canvas>
      <div className="collapse absolute top-14 ml-2 w-auto min-w-[50%] bg-base-100 md:min-w-[30%] lg:min-w-[20%]">
        <div className="text-md collapse-title font-medium">Scene</div>
        <input defaultChecked type="checkbox" />
        <div className="collapse-content">
          <SceneViewer {...editorProjection} />
          <div className="divider my-2"></div>
          <EntityTreeViewer entityTree={editorProjection.entityTree} />
        </div>
      </div>
    </div>
  )
}
