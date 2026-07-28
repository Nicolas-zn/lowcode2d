/**
 * 拾取对象标准结构
 */

import type * as Cesium from 'cesium'

export interface PickedObject {
  id: string | null
  name: string | null
  type: 'entity' | 'primitive' | '3dtiles' | 'terrain' | 'unknown'
  position: Cesium.Cartesian3 | null
  raw: any
}
