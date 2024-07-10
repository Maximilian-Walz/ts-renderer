import React, { useEffect, useRef, useState } from 'react'
import { GraphicEditor } from '..'
import { EntityTreeViewer } from './EntityTreeViewer'

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
  }
}

function useEditorProjection(editor: GraphicEditor) {
  const [projection, setProjection] = useState(projectEditor(editor))
  return {
    ...projection,
    setProjection: (newEditor: GraphicEditor) => setProjection(projectEditor(newEditor)),
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
        editorProjection.setProjection(editor)
      }
    })
  }, [canvasRef, editor])

  return (
    <div className="relative h-full w-full">
      <canvas className="h-full w-full" ref={canvasRef}></canvas>
      <div className="absolute top-14">
        <EntityTreeViewer entityTree={editorProjection.entityTree} />
      </div>
    </div>
  )
}
