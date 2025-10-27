'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/ui/primitives/button';
import { MessageSquare, Plus, Loader2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/ui/primitives/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog';
import { Input } from '@/ui/primitives/input';
import { toast } from 'sonner';
import type { Tables } from '@/types/database.types';

type Conversation = Tables<'conversations'> & { message_count: number };

interface ConversationSelectorProps {
  projectId: string;
  currentConversationId: string | null;
  onConversationChange: (conversationId: string) => void;
}

export function ConversationSelector({
  projectId,
  currentConversationId,
  onConversationChange,
}: ConversationSelectorProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentConversation = conversations.find((c) => c.id === currentConversationId);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, [projectId]);

  async function loadConversations() {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations?projectId=${projectId}`);
      if (!response.ok) throw new Error('Failed to load conversations');

      const data = await response.json();
      setConversations(data.conversations || []);

      // If no current conversation selected, select the most recent one
      if (!currentConversationId && data.conversations?.length > 0) {
        onConversationChange(data.conversations[0].id);
      }
    } catch (error) {
      console.error('[ConversationSelector] Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateConversation() {
    if (!newConversationName.trim()) {
      toast.error('Please enter a conversation name');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          name: newConversationName.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');

      const data = await response.json();

      if (data.conversation) {
        // Reload conversations and switch to new one
        await loadConversations();
        onConversationChange(data.conversation.id);
        toast.success('Conversation created');
        setIsNewDialogOpen(false);
        setNewConversationName('');
      }
    } catch (error) {
      console.error('[ConversationSelector] Failed to create conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        Loading...
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="max-w-[150px] truncate">
              {currentConversation?.name || 'Select conversation'}
            </span>
            {currentConversation && (
              <span className="ml-2 text-xs text-muted-foreground">
                ({currentConversation.message_count})
              </span>
            )}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Conversations</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setIsNewDialogOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              New
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <DropdownMenuItem
                key={conversation.id}
                onClick={() => onConversationChange(conversation.id)}
                className="flex flex-col items-start gap-1 p-3 cursor-pointer"
              >
                <div className="flex items-center gap-2 w-full">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium truncate flex-1">{conversation.name}</span>
                  {conversation.id === currentConversationId && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 w-full pl-5">
                  <span className="text-xs text-muted-foreground">
                    {conversation.message_count} {conversation.message_count === 1 ? 'message' : 'messages'}
                  </span>
                  {conversation.description && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground truncate">
                        {conversation.description}
                      </span>
                    </>
                  )}
                </div>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* New Conversation Dialog */}
      <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Create a new conversation thread to organize your chat by topic or feature.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Conversation Name
              </label>
              <Input
                id="name"
                placeholder="e.g., Dashboard Feature, Bug Fixes, etc."
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCreateConversation();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewDialogOpen(false);
                setNewConversationName('');
              }}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateConversation} disabled={isCreating || !newConversationName.trim()}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
