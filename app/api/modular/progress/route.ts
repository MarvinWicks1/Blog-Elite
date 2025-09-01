import { NextRequest } from 'next/server'
import { getProgressChannel, type ProgressEvent } from '@/lib/progress-bus'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId') || ''
  if (!jobId) {
    return new Response('Missing jobId', { status: 400 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const channel = getProgressChannel(jobId)
      const send = (event: ProgressEvent) => {
        const chunk = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(chunk))
      }
      const onMessage = (e: ProgressEvent) => send(e)
      channel.on('message', onMessage)

      // Initial heartbeat
      send({ type: 'heartbeat', timestamp: Date.now() })

      const heartbeat = setInterval(() => {
        send({ type: 'heartbeat', timestamp: Date.now() })
      }, 10000)

      controller.enqueue(encoder.encode('retry: 5000\n\n'))

      const cleanup = () => {
        clearInterval(heartbeat)
        channel.off('message', onMessage)
      }

      // Close handling
      // @ts-ignore
      req.signal?.addEventListener('abort', () => cleanup())
    },
    cancel() {
      // client disconnected
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}

