'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ExternalLink, RefreshCw, Eye, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/ui/primitives/button';
import { restartDevServer } from '@/server/actions/workspace';
import { useRedisStream } from '@/lib/hooks/use-redis-stream';

interface LivePreviewProps {
  projectId: string;
  template: string;
  previewUrl?: string;
}

type PreviewStatus = 'ready' | 'compiling' | 'starting' | 'error';
type DeviceType = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES = {
  desktop: { width: '100%', label: 'Desktop', icon: Monitor },
  tablet: { width: '768px', label: 'Tablet', icon: Tablet },
  mobile: { width: '375px', label: 'Mobile', icon: Smartphone },
} as const;

export function LivePreview({ projectId, template, previewUrl: initialPreviewUrl }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [isLoading, setIsLoading] = useState(!initialPreviewUrl);
  const [error, setError] = useState<string | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isRefreshingUrl, setIsRefreshingUrl] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>('compiling');
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop');
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
    // If preview URL was provided as prop, use it directly
    if (initialPreviewUrl) {
      setPreviewUrl(initialPreviewUrl);
      setIsLoading(false);
      console.log('[LivePreview] Using preview URL from server:', initialPreviewUrl);
    } else {
      // Fallback: fetch from API (for backwards compatibility)
      fetchPreviewUrl();
    }

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
  }, [projectId, initialPreviewUrl, fetchPreviewUrl]);

  // Listen for preview status updates and file changes from Redis pub/sub
  useEffect(() => {
    if (!latestMessage || latestMessage.type !== 'message') return;

    // Handle preview status changes
    if (latestMessage.topic === 'preview-status') {
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
    }

    // Handle file changes - reload iframe when agent modifies files
    if (latestMessage.topic === 'file-changes' && iframeRef.current && previewUrl) {
      console.log('[LivePreview] File changed, reloading preview...');

      // Small delay to allow Next.js dev server to recompile
      setTimeout(() => {
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
      }, 500); // 500ms delay for Next.js Fast Refresh
    }
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
    setCountdown(10);

    // Kill and restart server
    await restartDevServer(projectId);

    // 10 second countdown (reduced from 20s - dev servers start faster now)
    for (let i = 10; i > 0; i--) {
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Live Preview</span>
          </div>

          {/* Device Selector */}
          <div className="flex items-center gap-1 border rounded-md p-1">
            {(Object.entries(DEVICE_SIZES) as [DeviceType, typeof DEVICE_SIZES[DeviceType]][]).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={type}
                  size="sm"
                  variant={deviceType === type ? 'default' : 'ghost'}
                  onClick={() => setDeviceType(type)}
                  className="gap-1.5"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{config.label}</span>
                </Button>
              );
            })}
          </div>
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
      <div className="flex-1 relative bg-muted/20 flex items-start justify-center overflow-auto p-4">
        <div
          className="relative bg-white shadow-2xl transition-all duration-300"
          style={{
            width: DEVICE_SIZES[deviceType].width,
            height: deviceType === 'desktop' ? '100%' : 'calc(100% - 2rem)',
            maxWidth: '100%'
          }}
        >
          <iframe
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            title="Live Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
            allow="cross-origin-isolated"
          />
          {/* Subtle Loading Banner (dev server auto-starts, should be quick) */}
          {(previewStatus === 'compiling' || previewStatus === 'starting') && !isRestarting && (
            <div className="absolute top-0 left-0 right-0 bg-primary/90 backdrop-blur-sm px-4 py-2 flex items-center gap-2 z-10">
              <RefreshCw className="h-4 w-4 text-primary-foreground animate-spin" />
              <span className="text-sm text-primary-foreground">
                {previewStatus === 'compiling' ? 'Compiling...' : 'Starting...'}
              </span>
            </div>
          )}
          {/* Restart Banner */}
          {isRestarting && (
            <div className="absolute top-0 left-0 right-0 bg-orange-500/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-white animate-spin" />
                <span className="text-sm font-medium text-white">
                  {countdown > 0 ? 'Restarting dev server...' : 'Loading preview...'}
                </span>
              </div>
              {countdown > 0 && (
                <span className="text-sm font-bold text-white">{countdown}s</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
