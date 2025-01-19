import React from 'react'

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export function Viewport({ canvasRef }: Props) {
  return <canvas className="h-full w-full" ref={canvasRef}></canvas>
}
