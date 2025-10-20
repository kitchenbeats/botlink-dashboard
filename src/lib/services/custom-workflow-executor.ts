/**
 * Custom Workflow Executor
 * Executes user-defined workflows with their custom agents using Inngest
 */

import { createNetwork, type Agent, type StateData, type NetworkRun } from '@inngest/agent-kit';
import { loadCustomAgent } from './custom-agent-loader';
import type { Sandbox } from 'e2b';
import type { Node, Edge } from 'reactflow';

interface WorkflowDefinition {
  nodes: Node[];
  edges: Edge[];
}

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  system_prompt: string;
  config: {
    provider: 'anthropic' | 'openai';
    temperature: number;
    max_tokens: number;
    tools: string[];
  };
}

export interface CustomWorkflowResult {
  success: boolean;
  output: string;
  error?: string;
}

/**
 * Create a router function based on workflow edges
 */
function createWorkflowRouter(workflow: WorkflowDefinition, agentMap: Map<string, Agent<StateData>>) {
  return ({ network, callCount }: { network: NetworkRun<StateData>; callCount: number }) => {
    console.log(`[Custom Workflow] Iteration #${callCount}`);

    // Check if we've completed the workflow
    if (network?.state.kv.has('workflow_complete')) {
      return; // Stop execution
    }

    // Get the current node (start with first node if not set)
    const currentNodeId = network?.state.kv.get('current_node') as string | undefined;

    if (!currentNodeId) {
      // Start with the first node (assumes nodes are in execution order)
      const firstNode = workflow.nodes[0];
      if (!firstNode) return;

      network?.state.kv.set('current_node', firstNode.id);
      const agent = agentMap.get(firstNode.data.agentId);
      return agent;
    }

    // Find the next node based on edges
    const nextEdge = workflow.edges.find(edge => edge.source === currentNodeId);

    if (!nextEdge) {
      // No more edges, workflow complete
      network?.state.kv.set('workflow_complete', true);
      return;
    }

    // Move to next node
    const nextNode = workflow.nodes.find(n => n.id === nextEdge.target);
    if (!nextNode) {
      network?.state.kv.set('workflow_complete', true);
      return;
    }

    network?.state.kv.set('current_node', nextNode.id);
    const agent = agentMap.get(nextNode.data.agentId);
    return agent;
  };
}

/**
 * Execute a custom workflow
 */
export async function executeCustomWorkflow(
  prompt: string,
  workflow: WorkflowDefinition,
  agentConfigs: AgentConfig[],
  sandbox: Sandbox,
  onProgress?: (message: string) => void
): Promise<CustomWorkflowResult> {
  try {
    console.log(`[Custom Workflow] Starting workflow with ${workflow.nodes.length} nodes`);
    onProgress?.('Loading custom agents...');

    // Load all agents referenced in the workflow
    const agentMap = new Map<string, Agent<StateData>>();

    for (const node of workflow.nodes) {
      const agentId = node.data.agentId as string;
      const agentConfig = agentConfigs.find(a => a.id === agentId);

      if (!agentConfig) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      const agent = await loadCustomAgent(agentConfig, sandbox, onProgress);
      agentMap.set(agentId, agent);
    }

    onProgress?.('Executing workflow...');

    // Create network with custom router
    const agents = Array.from(agentMap.values());
    const network = createNetwork({
      name: 'custom-workflow-network',
      agents,
      maxIter: workflow.nodes.length * 3, // Allow some retries
      defaultRouter: createWorkflowRouter(workflow, agentMap),
    });

    // Run the workflow
    const result = await network.run(prompt);

    // Extract final output from network result
    // NetworkRun type doesn't have output directly, check messages or use result structure
    let output = 'Workflow completed successfully';

    if (result && typeof result === 'object') {
      // Try to extract meaningful output from result
      const resultStr = JSON.stringify(result, null, 2);
      if (resultStr && resultStr.length > 50) {
        output = resultStr;
      }
    }

    return {
      success: true,
      output,
    };
  } catch (error) {
    console.error('[Custom Workflow] Execution failed:', error);
    return {
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
