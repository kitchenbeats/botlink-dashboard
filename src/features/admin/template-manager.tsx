'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/ui/primitives/button';
import { Input } from '@/ui/primitives/input';
import { Label } from '@/ui/primitives/label';
import { Textarea } from '@/ui/primitives/textarea';
import { Badge } from '@/ui/primitives/badge';
import { Card } from '@/ui/primitives/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/ui/primitives/dialog';
import { Checkbox } from '@/ui/primitives/checkbox';
import { toast } from 'sonner';
import {
  listAllTemplates,
  listAllTiers,
  updateTemplateMetadata,
} from '@/server/actions/admin-templates';
import Link from 'next/link';

interface Template {
  id: string;
  name: string | null;
  description: string | null;
  tags: string[] | null;
  category: string | null;
  icon_url: string | null;
  allowed_tier_ids: string[] | null;
  created_at: string;
  public: boolean;
}

interface Tier {
  id: string;
  name: string;
}

export function TemplateManager() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    category: '',
    iconUrl: '',
    allowedTierIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [templatesResult, tiersResult] = await Promise.all([
        listAllTemplates(),
        listAllTiers(),
      ]);

      if (templatesResult?.data?.templates) {
        setTemplates(templatesResult.data.templates as any as Template[]);
      }

      if (tiersResult?.data?.tiers) {
        setTiers(tiersResult.data.tiers as Tier[]);
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openEditDialog(template: Template) {
    setEditingTemplate(template);
    setFormData({
      name: template.name || '',
      description: template.description || '',
      tags: (template.tags || []).join(', '),
      category: template.category || '',
      iconUrl: template.icon_url || '',
      allowedTierIds: template.allowed_tier_ids || [],
    });
  }

  function closeEditDialog() {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      tags: '',
      category: '',
      iconUrl: '',
      allowedTierIds: [],
    });
  }

  async function handleSave() {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const result = await updateTemplateMetadata({
        templateId: editingTemplate.id,
        name: formData.name || null,
        description: formData.description || null,
        tags: formData.tags
          ? formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
          : null,
        category: formData.category || null,
        iconUrl: formData.iconUrl || null,
        allowedTierIds: formData.allowedTierIds.length > 0 ? formData.allowedTierIds : null,
      });

      if (result?.data?.template) {
        // Update local state
        setTemplates((prev) =>
          prev.map((t) =>
            t.id === editingTemplate.id ? (result.data!.template as any as Template) : t
          )
        );
        toast.success('Template updated successfully');
        closeEditDialog();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (error) {
      toast.error('Failed to update template');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  function toggleTier(tierId: string) {
    setFormData((prev) => ({
      ...prev,
      allowedTierIds: prev.allowedTierIds.includes(tierId)
        ? prev.allowedTierIds.filter((id) => id !== tierId)
        : [...prev.allowedTierIds, tierId],
    }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Manager</h1>
            <p className="text-gray-600 mt-2">Manage E2B template metadata and tier access</p>
          </div>
          <Link href="/dashboard/admin">
            <Button variant="outline">← Back to Admin</Button>
          </Link>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {template.name || template.id}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{template.id}</p>
                </div>
                {template.icon_url && (
                  <img
                    src={template.icon_url}
                    alt={template.name || template.id}
                    className="w-10 h-10 rounded"
                  />
                )}
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {template.description || 'No description'}
              </p>

              {template.category && (
                <Badge className="mb-3">
                  {template.category}
                </Badge>
              )}

              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tags.map((tag) => (
                    <Badge key={tag} className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-1">Tier Access:</p>
                {template.allowed_tier_ids && template.allowed_tier_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {template.allowed_tier_ids.map((tierId) => {
                      const tier = tiers.find((t) => t.id === tierId);
                      return (
                        <Badge key={tierId} variant="default" className="text-xs">
                          {tier?.name || tierId}
                        </Badge>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">All tiers</p>
                )}
              </div>

              <Button onClick={() => openEditDialog(template)} className="w-full">
                Edit Metadata
              </Button>
            </Card>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No templates found</p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingTemplate} onOpenChange={closeEditDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Template Metadata</DialogTitle>
              <DialogDescription>
                Update template information and tier access for {editingTemplate?.id}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Next.js SaaS Starter"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="A full-featured SaaS starter template..."
                  rows={3}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Web Development"
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="nextjs, react, typescript, saas"
                />
              </div>

              {/* Icon URL */}
              <div className="space-y-2">
                <Label htmlFor="iconUrl">Icon URL</Label>
                <Input
                  id="iconUrl"
                  type="url"
                  value={formData.iconUrl}
                  onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                  placeholder="https://example.com/icon.png"
                />
              </div>

              {/* Tier Access */}
              <div className="space-y-2">
                <Label>Allowed Tiers</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Leave unchecked to allow all tiers
                </p>
                <div className="space-y-2 border rounded-lg p-4">
                  {tiers.map((tier) => (
                    <div key={tier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`tier-${tier.id}`}
                        checked={formData.allowedTierIds.includes(tier.id)}
                        onCheckedChange={() => toggleTier(tier.id)}
                      />
                      <label
                        htmlFor={`tier-${tier.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {tier.name} ({tier.id})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={closeEditDialog} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
