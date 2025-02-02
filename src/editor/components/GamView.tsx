import React, { useContext, useEffect, useRef } from 'react'
import { EditorContext } from './EditorInterface'

export function GameView() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const editor = useContext(EditorContext)

  useEffect(() => {
    if (canvasRef.current) {
      editor!.setGameRenderTarget(canvasRef.current)
    }
  }, [canvasRef, editor])

  return <canvas className="h-1/2 w-full" ref={canvasRef}></canvas>
}
