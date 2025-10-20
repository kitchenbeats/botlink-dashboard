import { NextRequest, NextResponse } from 'next/server';
import { resumeWorkflowExecution } from '@/server/actions/workspace';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { executionId, projectId } = body;

    if (!executionId || !projectId) {
      return NextResponse.json(
        { error: 'Missing required fields: executionId, projectId' },
        { status: 400 }
      );
    }

    // Resume the workflow execution
    const result = await resumeWorkflowExecution(executionId);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to resume workflow execution' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Workflow execution resumed',
    });
  } catch (error) {
    console.error('[API] Resume workflow error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
