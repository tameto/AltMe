import type { OpenClawInstance } from '@/src/shared/types/openclaw';

export const mockRunningInstance: OpenClawInstance = {
  id: 'oc-001',
  userId: 'user-pro-001',
  dropletId: 12345678,
  ipAddress: '192.168.1.100',
  status: 'running',
  infraProvider: 'digitalocean',
  containerName: 'openclaw-user-pro-001',
  desiredState: 'active',
  runtimeState: 'healthy',
  soulVersion: 1,
  cfWorkerUrl: null,
  region: 'sgp1',
  dropletSize: 's-1vcpu-1gb',
  soulMd: '# SOUL.md\nYou are a friendly AI twin.',
  lastHealthCheck: '2026-01-15T10:00:00Z',
  lastWakeAt: '2026-01-15T09:00:00Z',
  errorMessage: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

export const mockProvisioningInstance: OpenClawInstance = {
  ...mockRunningInstance,
  id: 'oc-002',
  status: 'provisioning',
  dropletId: null,
  ipAddress: null,
  containerName: null,
  runtimeState: 'cold',
  lastHealthCheck: null,
  lastWakeAt: null,
};
