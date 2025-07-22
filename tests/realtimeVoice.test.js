import test from "node:test"
import assert from 'node:assert'
import {WebSocket} from 'ws'

const wsUrl = process.env.WS_URL || 'ws://localhost:8787'

test('session.create -> session.update -> scenario start', async (t) => {
  const events = []

  await new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)

    ws.on('error', err => {
      reject(err)
    })

    ws.on('open', () => {
      // connection established
    })

    ws.on('message', msg => {
      const data = JSON.parse(msg)
      events.push(data.type)

      if (data.type === 'session.update') {
        // send minimal scenario start messages
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {type: 'message', role: 'system', content: [{type: 'text', text: 'Start'}]}
        }))
        ws.send(JSON.stringify({
          type: 'conversation.item.create',
          item: {type: 'message', role: 'user', content: [{type: 'text', text: 'Start'}]}
        }))
        ws.send(JSON.stringify({type: 'response.create'}))
      }

      if (data.type === 'response.created') {
        ws.close()
      }
    })

    ws.on('close', () => resolve())
  })

  assert.ok(events[0] === 'session.create', 'first event should be session.create')
  assert.ok(events[1] === 'session.update', 'second event should be session.update')
  assert.ok(events.includes('response.created'), 'scenario should start')
})
