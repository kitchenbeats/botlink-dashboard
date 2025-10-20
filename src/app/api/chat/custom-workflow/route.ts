import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/clients/supabase/server';
import { getWorkflow } from '@/lib/db/workflows';
import { getAgents } from '@/lib/db';
import { getActiveSandbox } from '@/lib/db/sandboxes';
import { Sandbox } from 'e2b';
import { executeCustomWorkflow } from '@/lib/services/custom-workflow-executor';
import type { Node, Edge } from 'reactflow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for workflow execution

/**
 * POST /api/chat/custom-workflow
 * Execute a user's custom workflow
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { projectId, message, workflowId, teamId } = body;

    if (!projectId || !message || !workflowId || !teamId) {
      return NextResponse.json(
        { error: 'Missing required fields: projectId, message, workflowId, teamId' },
        { status: 400 }
      );
    }

    console.log(`[Custom Workflow] Starting execution: ${workflowId}`);

    // Load workflow from database
    const workflow = await getWorkflow(workflowId, teamId);
    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Validate workflow has nodes and edges
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
      return NextResponse.json(
        { error: 'Workflow has no nodes configured' },
        { status: 400 }
      );
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      return NextResponse.json(
        { error: 'Workflow has no edges configured' },
        { status: 400 }
      );
    }

    // Load active sandbox session for project
    const sandboxSession = await getActiveSandbox(projectId);
    if (!sandboxSession || !sandboxSession.e2b_session_id) {
      return NextResponse.json(
        { error: 'No active sandbox found for project. Please start a sandbox first.' },
        { status: 404 }
      );
    }

    // Type cast workflow JSON to expected types
    const workflowNodes = workflow.nodes as unknown as Node[];
    const workflowEdges = workflow.edges as unknown as Edge[];

    // Get all agents referenced in workflow
    const agentIds = workflowNodes
      .map((node) => node.data?.agentId as string | undefined)
      .filter((id): id is string => Boolean(id));
    const allAgents = await getAgents(teamId);
    const agentConfigs = allAgents.filter((agent) => agentIds.includes(agent.id));

    if (agentConfigs.length !== agentIds.length) {
      return NextResponse.json(
        { error: 'Some agents in workflow not found' },
        { status: 404 }
      );
    }

    // Connect to E2B sandbox
    console.log('[Custom Workflow] Connecting to E2B sandbox:', sandboxSession.e2b_session_id);
    const sandbox = await Sandbox.connect(sandboxSession.e2b_session_id, {
      apiKey: process.env.E2B_API_KEY,
    });

    // Execute the workflow
    const result = await executeCustomWorkflow(
      message,
      {
        nodes: workflowNodes,
        edges: workflowEdges,
      },
      agentConfigs.map((agent) => {
        const config = (agent.config || {}) as Record<string, unknown>;
        return {
          id: agent.id,
          name: agent.name,
          model: agent.model,
          system_prompt: agent.system_prompt,
          config: {
            provider: (config.provider as 'anthropic' | 'openai') || 'anthropic',
            temperature: (config.temperature as number) || 0.7,
            max_tokens: (config.max_tokens as number) || 4096,
            tools: (config.tools as string[]) || [],
          },
        };
      }),
      sandbox,
      (progressMessage) => {
        console.log('[Custom Workflow Progress]', progressMessage);
      }
    );

    // Note: We don't kill the sandbox here - it remains active for the project
    // The sandbox lifecycle is managed separately

    if (result.success) {
      return NextResponse.json({
        content: result.output,
        success: true,
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Workflow execution failed' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[API] Custom workflow error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
