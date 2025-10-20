'use client';

import { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeTypes,
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Agent {
  id: string;
  name: string;
  type: string;
  model: string;
}

interface WorkflowBuilderProps {
  agents: Agent[]; // User's custom agents
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
}

// Custom node component for agents
function AgentNode({ data }: { data: { label: string; agentId?: string; model?: string } }) {
  return (
    <div className="px-4 py-3 shadow-md rounded-md bg-white border-2 border-primary min-w-[180px]">
      <div className="font-semibold text-sm">{data.label}</div>
      {data.model && (
        <div className="text-xs text-muted-foreground mt-1">{data.model}</div>
      )}
    </div>
  );
}

const nodeTypes: NodeTypes = {
  agent: AgentNode,
};

export function WorkflowBuilder({
  agents,
  initialNodes = [],
  initialEdges = [],
  onSave,
}: WorkflowBuilderProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedAgent, setSelectedAgent] = useState<string>('');

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addAgentToCanvas = () => {
    if (!selectedAgent) return;

    const agent = agents.find(a => a.id === selectedAgent);
    if (!agent) return;

    // Calculate position for new node (cascade down-right)
    const existingPositions = nodes.map(n => n.position);
    const x = existingPositions.length > 0
      ? Math.max(...existingPositions.map(p => p.x)) + 50
      : 100;
    const y = existingPositions.length > 0
      ? Math.max(...existingPositions.map(p => p.y)) + 50
      : 100;

    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'agent',
      position: { x, y },
      data: {
        label: agent.name,
        agentId: agent.id,
        model: agent.model,
      },
    };

    setNodes((nds) => [...nds, newNode]);
    setSelectedAgent(''); // Reset selection
  };

  const handleSave = () => {
    if (onSave) {
      onSave(nodes, edges);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the workflow?')) {
      setNodes([]);
      setEdges([]);
    }
  };

  return (
    <div className="h-[700px] border rounded-lg flex flex-col">
      {/* Toolbar */}
      <div className="flex gap-3 p-4 border-b bg-muted/30 items-center">
        <div className="flex-1 flex gap-2 items-center">
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 text-sm border rounded-md bg-background"
          >
            <option value="">Select an agent...</option>
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name} ({agent.model})
              </option>
            ))}
          </select>
          <button
            onClick={addAgentToCanvas}
            disabled={!selectedAgent}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            + Add to Canvas
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleClear}
            disabled={nodes.length === 0}
            className="px-3 py-2 text-sm border rounded-md hover:bg-muted disabled:opacity-50"
          >
            Clear
          </button>
          {onSave && (
            <button
              onClick={handleSave}
              disabled={nodes.length === 0}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              Save Workflow
            </button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        {agents.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <p className="text-sm mb-2">No custom agents yet</p>
              <p className="text-xs">Create an agent first to build workflows</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            className="bg-muted/10"
          >
            <Background />
            <Controls />
            <MiniMap className="bg-background" />
          </ReactFlow>
        )}
      </div>

      {/* Instructions */}
      <div className="px-4 py-3 border-t bg-muted/20 text-xs text-muted-foreground">
        <p>
          <strong>How to build:</strong> Select an agent from the dropdown and click "Add to Canvas".
          Connect agents by dragging from one node's edge to another.
          The workflow will execute agents in the order you define.
        </p>
      </div>
    </div>
  );
}
