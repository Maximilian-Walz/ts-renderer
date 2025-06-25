import { Entity, EventMap } from "@my/engine"

declare module "@my/engine" {
  interface EventMap {
    entitySelect: { entity: Entity }
  }
}
