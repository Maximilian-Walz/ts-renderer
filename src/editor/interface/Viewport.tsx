import React, { useEffect, useRef } from 'react'
import { useEditor } from '../state/EditorProvider'
import { EntitySelctionProvider } from '../state/EntitySelectionProvider'
import { SceneSelctionProvider } from '../state/SceneSelectionProvider'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'

export function Viewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useEditor()

  useEffect(() => {
    if (canvasRef.current) {
      editor!.setEditorRenderTarget(canvasRef.current)
    }
    return () => editor?.engine.abort()
  }, [canvasRef, editor])

  return (
    <div>
      <div className="flex min-h-0 grow flex-row">
        <SceneSelctionProvider>
          <EntitySelctionProvider>
            <LeftPanel />
            <canvas className="min-w-0 grow rounded-xl" ref={canvasRef}></canvas>
            <RightPanel />
          </EntitySelctionProvider>
        </SceneSelctionProvider>
      </div>
    </div>
  )
}
