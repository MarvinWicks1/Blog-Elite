import { EventEmitter } from 'events'

export type ProgressStageStatus = 'start' | 'complete' | 'failed'

export type ProgressEvent =
  | { type: 'stage'; stage: string; status: ProgressStageStatus; data?: any; timestamp: number }
  | { type: 'progress'; stage: string; progress: number; data?: any; timestamp: number }
  | { type: 'heartbeat'; timestamp: number }
  | { type: 'done'; timestamp: number }
  | { type: 'error'; message: string; timestamp: number }

const channels = new Map<string, EventEmitter>()
const jobResults = new Map<string, any>()

export function getProgressChannel(jobId: string): EventEmitter {
  let emitter = channels.get(jobId)
  if (!emitter) {
    emitter = new EventEmitter()
    // Increase listener limit to avoid warnings during bursts
    emitter.setMaxListeners(50)
    channels.set(jobId, emitter)
  }
  return emitter
}

export function emitProgress(jobId: string, event: ProgressEvent) {
  const channel = getProgressChannel(jobId)
  setImmediate(() => channel.emit('message', event))
}

export function closeProgress(jobId: string) {
  const channel = channels.get(jobId)
  if (channel) {
    channel.removeAllListeners()
    channels.delete(jobId)
  }
}

export function setJobResult(jobId: string, result: any) {
  jobResults.set(jobId, result)
}

export function getJobResult(jobId: string) {
  return jobResults.get(jobId)
}

