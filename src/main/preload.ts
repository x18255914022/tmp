import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Projects
  getProjects: () => ipcRenderer.invoke('projects:getAll'),
  getProject: (id: number) => ipcRenderer.invoke('projects:get', id),
  createProject: (data: any) => ipcRenderer.invoke('projects:create', data),
  updateProject: (id: number, data: any) => ipcRenderer.invoke('projects:update', id, data),
  deleteProject: (id: number) => ipcRenderer.invoke('projects:delete', id),

  // Sample Groups
  getGroupsByProject: (projectId: number) => ipcRenderer.invoke('groups:getByProject', projectId),
  getGroup: (id: number) => ipcRenderer.invoke('groups:get', id),
  createGroup: (data: any) => ipcRenderer.invoke('groups:create', data),
  updateGroup: (id: number, data: any) => ipcRenderer.invoke('groups:update', id, data),
  deleteGroup: (id: number) => ipcRenderer.invoke('groups:delete', id),

  // Batch × Locus
  getBatchLoci: (groupId: number) => ipcRenderer.invoke('batchLocus:getByGroup', groupId),
  updateBatchLocus: (id: number, data: any) => ipcRenderer.invoke('batchLocus:update', id, data),

  // Locus Reference
  getLoci: () => ipcRenderer.invoke('loci:getAll'),
  createLocus: (data: any) => ipcRenderer.invoke('loci:create', data),
  updateLocus: (id: number, data: any) => ipcRenderer.invoke('loci:update', id, data),
  deleteLocus: (id: number) => ipcRenderer.invoke('loci:delete', id),

  // PCR Rerun Notes
  getRerunNotes: () => ipcRenderer.invoke('rerun:getAll'),
  createRerunNote: (data: any) => ipcRenderer.invoke('rerun:create', data),
  deleteRerunNote: (id: number) => ipcRenderer.invoke('rerun:delete', id),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:stats'),

  // Export
  getExportData: () => ipcRenderer.invoke('export:data'),
  chooseExportFile: () => ipcRenderer.invoke('export:chooseFile'),

  // Backup
  backupSave: () => ipcRenderer.invoke('backup:save'),
  backupRestore: () => ipcRenderer.invoke('backup:restore'),
});
