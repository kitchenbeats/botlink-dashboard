'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/ui/primitives/button';
import { restartDevServer } from '@/server/actions/workspace';
import { useRedisStream } from '@/lib/hooks/use-redis-stream';

interface LivePreviewProps {
  projectId: string;
  template: string;
}

type PreviewStatus = 'ready' | 'compiling' | 'starting' | 'error';

export function LivePreview({ projectId, template }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isRefreshingUrl, setIsRefreshingUrl] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('compiling');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Subscribe to Redis stream for real-time preview status updates
  const { latestMessage } = useRedisStream({ projectId });

  const fetchPreviewUrl = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/workspace/${projectId}/preview-url`);
      if (!response.ok) {
        throw new Error('Failed to fetch preview URL');
      }
      const data = await response.json();
      setPreviewUrl(data.url);
    } catch (err) {
      console.error('[LivePreview] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchPreviewUrl();

    // Check initial preview status from cache
    fetch(`/api/workspace/${projectId}/preview-status`)
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          console.log('[LivePreview] Initial status from cache:', data.status);
          setPreviewStatus(data.status as PreviewStatus);
        }
      })
      .catch(console.error);

    // Poll for sandbox changes every 30 seconds
    const interval = setInterval(() => {
      fetch(`/api/workspace/${projectId}/preview-url`)
        .then(res => res.json())
        .then(data => {
          if (data.url && data.url !== previewUrl) {
            console.log('[LivePreview] Sandbox changed, updating URL:', data.url);
            setPreviewUrl(data.url);
          }
        })
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, [projectId, previewUrl, fetchPreviewUrl]);

  // Listen for preview status updates from Redis pub/sub
  useEffect(() => {
    if (!latestMessage || latestMessage.type !== 'message') return;
    if (latestMessage.topic !== 'preview-status') return;

    const statusData = latestMessage.data as { status: PreviewStatus };
    const newStatus = statusData.status;

    console.log('[LivePreview] Status update from Redis:', newStatus);

    // If status changed from compiling to ready, reload iframe
    if (previewStatus !== 'ready' && newStatus === 'ready' && iframeRef.current) {
      console.log('[LivePreview] Dev server ready! Reloading preview...');
      try {
        iframeRef.current.contentWindow?.location.reload();
      } catch (e) {
        // Fallback: reload by changing src
        if (iframeRef.current && previewUrl) {
          iframeRef.current.src = previewUrl;
        }
      }
    }

    setPreviewStatus(newStatus);
  }, [latestMessage, previewStatus, previewUrl]);

  async function handleRefreshUrl() {
    setIsRefreshingUrl(true);
    await fetchPreviewUrl();
    setIsRefreshingUrl(false);

    // Reload iframe with new URL
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl;
    }
  }

  async function handleRefresh() {
    setIsRestarting(true);
    setCountdown(20);

    // Kill and restart server
    await restartDevServer(projectId);

    // 20 second countdown
    for (let i = 20; i > 0; i--) {
      setCountdown(i);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Reload iframe
    if (iframeRef.current) {
      try {
        iframeRef.current.contentWindow?.location.reload();
      } catch (e) {
        // Fallback: reload by changing src
        if (iframeRef.current && previewUrl) {
          iframeRef.current.src = previewUrl;
        }
      }
    }

    setCountdown(0);
    setIsRestarting(false);
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/5">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }

  if (error || !previewUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/5">
        <div className="text-center">
          <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {error || 'Preview not available'}
          </p>
          <p className="text-xs text-muted-foreground">
            Start a dev server in the terminal to see a live preview
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Preview Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-background">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Live Preview</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefreshUrl}
            disabled={isRefreshingUrl || isRestarting}
            title="Refresh preview URL (use after sandbox reconnect)"
          >
            {isRefreshingUrl ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="default"
            variant="outline"
            onClick={handleRefresh}
            disabled={isRestarting}
            className="gap-2"
          >
            {isRestarting && countdown > 0 ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Restarting... {countdown}s</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Restart Server</span>
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => window.open(previewUrl, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Preview Frame */}
      <div className="flex-1 relative bg-black">
        <iframe
          ref={iframeRef}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Live Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />
        {/* Compiling Overlay */}
        {(previewStatus === 'compiling' || previewStatus === 'starting') && !isRestarting && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center max-w-md px-6">
              <RefreshCw className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                {previewStatus === 'compiling' ? 'Compiling Next.js...' : 'Starting Dev Server...'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {previewStatus === 'compiling'
                  ? 'Next.js is compiling your application. This typically takes 30-45 seconds on first load.'
                  : 'Dev server is starting up...'}
              </p>
              <p className="text-xs text-muted-foreground/70">
                You can start editing files and chatting with Claude while this completes.
              </p>
            </div>
          </div>
        )}
        {/* Restart Overlay */}
        {isRestarting && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center">
              <RefreshCw className="h-16 w-16 mx-auto text-primary animate-spin mb-6" />
              <h3 className="text-xl font-semibold mb-2">
                {countdown > 0 ? 'Restarting Server' : 'Loading Preview'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {countdown > 0
                  ? 'Killing processes and starting dev server...'
                  : 'Waiting for Next.js to respond...'}
              </p>
              {countdown > 0 ? (
                <div className="text-4xl font-bold text-primary">{countdown}s</div>
              ) : (
                <div className="text-sm text-muted-foreground">This may take a few moments</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
