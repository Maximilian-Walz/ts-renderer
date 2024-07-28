import { quat } from 'wgpu-matrix'
import { AutoRotateComponent, TransformComponent } from '../components/components'

export class Rotator {
  rotate(models: [TransformComponent, AutoRotateComponent][]) {
    models.forEach(([transform, autoRotate]) => {
      const angle = Math.sin((autoRotate.speed * Date.now()) / 1000000000000000)
      quat.mul(transform.rotation, quat.fromAxisAngle(autoRotate.axis, angle), transform.rotation)
    })
  }
}
