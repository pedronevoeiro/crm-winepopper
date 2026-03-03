import { NextResponse } from 'next/server'
import { pipelineStages } from '@/lib/data'

export async function GET() {
  const sorted = [...pipelineStages].sort((a, b) => a.position - b.position)
  return NextResponse.json(sorted)
}
