import test from 'node:test'
import assert from 'node:assert'
import { createServer } from 'node:http'

// Start a simple SSE mock server if the SSE_URL env var isn't provided.
const startMockServer = () => new Promise(resolve => {
  const server = createServer((req, res) => {
    if (req.method === 'POST') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      })

      // Send a minimal stream of events
      res.write(`data: ${JSON.stringify({ type: 'session.created' })}\n\n`)
      setTimeout(() => {
        res.write(`data: ${JSON.stringify({ type: 'session.updated' })}\n\n`)
        setTimeout(() => {
          res.write(`data: ${JSON.stringify({ type: 'response.created' })}\n\n`)
          res.end()
        }, 10)
      }, 10)
    } else {
      res.writeHead(404)
      res.end()
    }
  })

  server.listen(0, () => {
    const { port } = server.address()
    resolve({ server, url: `http://localhost:${port}` })
  })
})

test('session.create -> session.update -> scenario start (SSE)', async () => {
  let server
  let url = process.env.SSE_URL

  if (!url) {
    const started = await startMockServer()
    server = started.server
    url = started.url
  }

  const events = []

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'connect' })
  })

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  if (!reader) throw new Error('No readable stream returned')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6))
        events.push(data.type)
      }
    }

    if (events.includes('response.created')) break
  }

  server?.close()

  assert.strictEqual(events[0], 'session.created', 'first event should be session.created')
  assert.strictEqual(events[1], 'session.updated', 'second event should be session.updated')
  assert.ok(events.includes('response.created'), 'scenario should start')
})
