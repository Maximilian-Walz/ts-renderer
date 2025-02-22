import React, { useEffect, useRef } from 'react'
import { useEditor } from '../state/EditorProvider'

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useEditor()

  useEffect(() => {
    if (canvasRef.current) {
      editor!.setGameRenderTarget(canvasRef.current)
    }
    return () => editor?.game.engine.abort()
  }, [canvasRef, editor])

  return (
    <div className="flex min-h-0 grow flex-row">
      <canvas className="min-h-0 grow" ref={canvasRef}></canvas>
    </div>
  )
}
