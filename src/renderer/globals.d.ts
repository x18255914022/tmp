export {};

declare global {
  interface Window {
    api: {
      // Projects
      getProjects: () => Promise<any[]>;
      getProject: (id: number) => Promise<any>;
      createProject: (data: any) => Promise<any>;
      updateProject: (id: number, data: any) => Promise<void>;
      deleteProject: (id: number) => Promise<void>;
      // Sample Groups
      getGroupsByProject: (projectId: number) => Promise<any[]>;
      getGroup: (id: number) => Promise<any>;
      createGroup: (data: any) => Promise<any>;
      updateGroup: (id: number, data: any) => Promise<void>;
      deleteGroup: (id: number) => Promise<void>;
      // Batch × Locus
      getBatchLoci: (groupId: number) => Promise<any[]>;
      updateBatchLocus: (id: number, data: any) => Promise<void>;
      // Locus Reference
      getLoci: () => Promise<any[]>;
      createLocus: (data: any) => Promise<any>;
      updateLocus: (id: number, data: any) => Promise<void>;
      deleteLocus: (id: number) => Promise<void>;
      // PCR Rerun Notes
      getRerunNotes: () => Promise<any[]>;
      createRerunNote: (data: any) => Promise<any>;
      deleteRerunNote: (id: number) => Promise<void>;
      // Dashboard
      getDashboardStats: () => Promise<any>;
      // Export
      getExportData: () => Promise<any[]>;
      chooseExportFile: () => Promise<string | null>;
      // Backup
      backupSave: () => Promise<string | null>;
      backupRestore: () => Promise<boolean>;
    };
  }
}
