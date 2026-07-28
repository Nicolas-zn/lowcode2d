import test from 'node:test'
import assert from 'node:assert/strict'
import {
  applyChartPalette,
  createChartOptionsFromData
} from '../src/utils/echartOptions.js'

test('createChartOptionsFromData builds options from series data', () => {
  const options = createChartOptionsFromData({
    series: [
      { name: '销售额', data: [120, 200] },
      { name: '访问量', data: [80, 140] }
    ]
  })

  assert.deepEqual(options, [
    { name: '销售额', field: '销售额', color: '#667eea' },
    { name: '访问量', field: '访问量', color: '#764ba2' }
  ])
})

test('createChartOptionsFromData builds options from pie-like array data', () => {
  const options = createChartOptionsFromData([
    { name: 'A类', value: 335 },
    { name: 'B类', value: 310 }
  ])

  assert.deepEqual(options, [
    { name: 'A类', field: 'A类', color: '#667eea' },
    { name: 'B类', field: 'B类', color: '#764ba2' }
  ])
})

test('createChartOptionsFromData keeps existing option names and updates missing items', () => {
  const options = createChartOptionsFromData(
    {
      series: [
        { name: '销售额', data: [120] },
        { name: '访问量', data: [80] }
      ]
    },
    [{ name: '收入', field: '销售额', color: '#111111' }]
  )

  assert.deepEqual(options, [
    { name: '收入', field: '销售额', color: '#111111' },
    { name: '访问量', field: '访问量', color: '#764ba2' }
  ])
})

test('applyChartPalette overwrites chart option colors using palette order', () => {
  const options = applyChartPalette(
    [
      { name: '销售额', field: '销售额', color: '#111111' },
      { name: '访问量', field: '访问量', color: '#222222' }
    ],
    'techBlue'
  )

  assert.equal(options[0].color, '#5470c6')
  assert.equal(options[1].color, '#91cc75')
})
