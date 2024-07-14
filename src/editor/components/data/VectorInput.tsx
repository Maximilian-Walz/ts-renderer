import React from 'react'
import { NumberInput } from './NumberInput'

type Props = {
  label: string
  initialValue: any[]
  targetValue: any
  icon?: JSX.Element
}

export function VectorInput({ label, initialValue, targetValue, icon }: Props) {
  return (
    <div className="form-control mt-5">
      <div className="join label-text items-center">
        {icon && <span className="pr-2">{icon}</span>}
        {label}
      </div>
      <div className="ml-1">
        {initialValue.map((axis, index) => (
          <div className="my-[1px]" key={index}>
            <NumberInput label={axis.label} initialValue={axis.value} precision={4} labelContained onChange={(value) => (targetValue()[index] = value)} />
          </div>
        ))}
      </div>
    </div>
  )
}
