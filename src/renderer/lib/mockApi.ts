// Mock API for browser-based preview (when not running inside Electron)
// This simulates the IPC calls with in-memory data

let nextId = 1;
const getId = () => nextId++;

// Seed data
const lociData = [
  { id: getId(), locus_code: 'Ssa2019', annealing_temp: '67 °C', electrophoresis_time: '1 ч 50 мин', notes: null },
  { id: getId(), locus_code: 'Oki23', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'Oke3', annealing_temp: '60–62 °C', electrophoresis_time: '2 ч 30 мин', notes: null },
  { id: getId(), locus_code: 'Ogo2G', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'Oke11', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'Oki1b', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'Ots102', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'One101', annealing_temp: '57 °C', electrophoresis_time: '2 ч', notes: null },
  { id: getId(), locus_code: 'One109', annealing_temp: '60.5 °C', electrophoresis_time: '2 ч 10 мин', notes: null },
  { id: getId(), locus_code: 'One103', annealing_temp: '56–57 °C', electrophoresis_time: '2 ч 5 мин', notes: null },
];

const projectsData: any[] = [];
const groupsData: any[] = [];
const batchLocusData: any[] = [];
const rerunNotesData: any[] = [];

function computeReady(bl: any) {
  return bl.dna_status === 'completed' && bl.pcr_status === 'completed' && bl.electrophoresis_status === 'completed' ? 1 : 0;
}

// Create a demo project with some sample data
function seedDemo() {
  const pId = getId();
  projectsData.push({
    id: pId, name: 'ЛРЗ — Проект 1', description: 'Лососёвый рыбоводный завод, выборки 2025',
    project_type: 'промысловая', priority: 'высокий', default_batch_size: 48, created_at: '2025-12-01',
  });

  const codes = ['01-01', '01-02', '01-03', '01-04', '01-05'];
  for (const code of codes) {
    const gId = getId();
    groupsData.push({
      id: gId, project_id: pId, batch_code: code, planned_specimen_count: 48,
      actual_specimen_count: null, notes: null, created_at: '2025-12-05',
    });
    for (const locus of lociData) {
      const dnaS = Math.random() > 0.1 ? 'completed' : 'not_started';
      const pcrS = dnaS === 'completed' ? (Math.random() > 0.2 ? 'completed' : (Math.random() > 0.5 ? 'pcr_repeat_needed' : 'not_started')) : 'not_started';
      const elS = pcrS === 'completed' ? (Math.random() > 0.15 ? 'completed' : 'electrophoresis_repeat_needed') : 'not_started';
      const bl: any = {
        id: getId(), project_id: pId, sample_group_id: gId, locus_id: locus.id,
        annealing_temp_override: null, electrophoresis_time_override: null,
        dna_status: dnaS, pcr_status: pcrS, electrophoresis_status: elS,
        ready_for_calculations: 0, notes: null, updated_at: '2025-12-10',
      };
      bl.ready_for_calculations = computeReady(bl);
      batchLocusData.push(bl);
    }
  }
}
seedDemo();

export const mockApi = {
  getProjects: async () => {
    return projectsData.map(p => {
      const bls = batchLocusData.filter(bl => bl.project_id === p.id);
      return {
        ...p,
        batch_count: groupsData.filter(g => g.project_id === p.id).length,
        total_bl: bls.length,
        ready_bl: bls.filter(bl => bl.ready_for_calculations === 1).length,
        problem_bl: bls.filter(bl => bl.pcr_status === 'pcr_repeat_needed' || bl.electrophoresis_status === 'electrophoresis_repeat_needed' || bl.dna_status === 'problem' || bl.pcr_status === 'problem' || bl.electrophoresis_status === 'problem').length,
      };
    });
  },
  getProject: async (id: number) => projectsData.find(p => p.id === id),
  createProject: async (data: any) => {
    const p = { id: getId(), ...data, project_type: data.projectType, default_batch_size: data.defaultBatchSize || 48, created_at: new Date().toISOString() };
    projectsData.push(p);
    return p;
  },
  updateProject: async (id: number, data: any) => {
    const p = projectsData.find(x => x.id === id);
    if (p) Object.assign(p, data);
  },
  deleteProject: async (id: number) => {
    const idx = projectsData.findIndex(x => x.id === id);
    if (idx >= 0) projectsData.splice(idx, 1);
    // Cascade
    const gIds = groupsData.filter(g => g.project_id === id).map(g => g.id);
    for (const gId of gIds) {
      const gi = groupsData.findIndex(g => g.id === gId);
      if (gi >= 0) groupsData.splice(gi, 1);
    }
    for (let i = batchLocusData.length - 1; i >= 0; i--) {
      if (batchLocusData[i].project_id === id) batchLocusData.splice(i, 1);
    }
  },

  getGroupsByProject: async (projectId: number) => {
    return groupsData.filter(g => g.project_id === projectId).map(g => {
      const bls = batchLocusData.filter(bl => bl.sample_group_id === g.id);
      return {
        ...g,
        total_loci: bls.length,
        ready_loci: bls.filter(bl => bl.ready_for_calculations === 1).length,
        not_started_loci: bls.filter(bl => bl.dna_status === 'not_started' && bl.pcr_status === 'not_started' && bl.electrophoresis_status === 'not_started').length,
        pcr_repeat_loci: bls.filter(bl => bl.pcr_status === 'pcr_repeat_needed').length,
        electro_repeat_loci: bls.filter(bl => bl.electrophoresis_status === 'electrophoresis_repeat_needed').length,
        problem_loci: bls.filter(bl => bl.dna_status === 'problem' || bl.pcr_status === 'problem' || bl.electrophoresis_status === 'problem').length,
      };
    });
  },
  getGroup: async (id: number) => groupsData.find(g => g.id === id),
  createGroup: async (data: any) => {
    const g = { id: getId(), project_id: data.projectId, batch_code: data.batchCode, planned_specimen_count: data.plannedSpecimenCount || 48, actual_specimen_count: null, notes: data.notes || null, created_at: new Date().toISOString() };
    groupsData.push(g);
    for (const locus of lociData) {
      batchLocusData.push({
        id: getId(), project_id: data.projectId, sample_group_id: g.id, locus_id: locus.id,
        annealing_temp_override: null, electrophoresis_time_override: null,
        dna_status: 'not_started', pcr_status: 'not_started', electrophoresis_status: 'not_started',
        ready_for_calculations: 0, notes: null, updated_at: new Date().toISOString(),
      });
    }
    return g;
  },
  updateGroup: async (id: number, data: any) => {
    const g = groupsData.find(x => x.id === id);
    if (g) Object.assign(g, data);
  },
  deleteGroup: async (id: number) => {
    const idx = groupsData.findIndex(x => x.id === id);
    if (idx >= 0) groupsData.splice(idx, 1);
    for (let i = batchLocusData.length - 1; i >= 0; i--) {
      if (batchLocusData[i].sample_group_id === id) batchLocusData.splice(i, 1);
    }
  },

  getBatchLoci: async (groupId: number) => {
    return batchLocusData.filter(bl => bl.sample_group_id === groupId).map(bl => {
      const locus = lociData.find(l => l.id === bl.locus_id);
      return { ...bl, locus_code: locus?.locus_code, ref_temp: locus?.annealing_temp, ref_time: locus?.electrophoresis_time };
    });
  },
  updateBatchLocus: async (id: number, data: any) => {
    const bl = batchLocusData.find(x => x.id === id);
    if (!bl) return;
    if (data.dnaStatus !== undefined) bl.dna_status = data.dnaStatus;
    if (data.pcrStatus !== undefined) bl.pcr_status = data.pcrStatus;
    if (data.electrophoresisStatus !== undefined) bl.electrophoresis_status = data.electrophoresisStatus;
    if (data.notes !== undefined) bl.notes = data.notes;
    bl.ready_for_calculations = computeReady(bl);
    bl.updated_at = new Date().toISOString();
  },

  getLoci: async () => [...lociData],
  createLocus: async (data: any) => {
    const l = { id: getId(), locus_code: data.locusCode, annealing_temp: data.annealingTemp || null, electrophoresis_time: data.electrophoresisTime || null, notes: data.notes || null };
    lociData.push(l);
    return l;
  },
  updateLocus: async (id: number, data: any) => {
    const l = lociData.find(x => x.id === id);
    if (l) {
      if (data.locusCode !== undefined) l.locus_code = data.locusCode;
      if (data.annealingTemp !== undefined) l.annealing_temp = data.annealingTemp;
      if (data.electrophoresisTime !== undefined) l.electrophoresis_time = data.electrophoresisTime;
      if (data.notes !== undefined) l.notes = data.notes;
    }
  },
  deleteLocus: async (id: number) => {
    const idx = lociData.findIndex(x => x.id === id);
    if (idx >= 0) lociData.splice(idx, 1);
  },

  getRerunNotes: async () => {
    return rerunNotesData.map(rn => ({
      ...rn,
      project_name: projectsData.find(p => p.id === rn.project_id)?.name || '?',
      batch_code: groupsData.find(g => g.id === rn.sample_group_id)?.batch_code || '?',
      locus_code: lociData.find(l => l.id === rn.locus_id)?.locus_code || '?',
    }));
  },
  createRerunNote: async (data: any) => {
    const rn = { id: getId(), project_id: data.projectId, sample_group_id: data.sampleGroupId, locus_id: data.locusId, specimen_numbers: data.specimenNumbers || null, rerun_date: data.rerunDate || null, comment: data.comment || null, created_at: new Date().toISOString() };
    rerunNotesData.push(rn);
    return rn;
  },
  deleteRerunNote: async (id: number) => {
    const idx = rerunNotesData.findIndex(x => x.id === id);
    if (idx >= 0) rerunNotesData.splice(idx, 1);
  },

  getDashboardStats: async () => {
    const totalBl = batchLocusData.length;
    return {
      totalProjects: projectsData.length,
      totalBatches: groupsData.length,
      totalBl,
      dnaCompleted: batchLocusData.filter(bl => bl.dna_status === 'completed').length,
      pcrCompleted: batchLocusData.filter(bl => bl.pcr_status === 'completed').length,
      pcrRepeat: batchLocusData.filter(bl => bl.pcr_status === 'pcr_repeat_needed').length,
      electroCompleted: batchLocusData.filter(bl => bl.electrophoresis_status === 'completed').length,
      electroRepeat: batchLocusData.filter(bl => bl.electrophoresis_status === 'electrophoresis_repeat_needed').length,
      ready: batchLocusData.filter(bl => bl.ready_for_calculations === 1).length,
      problems: batchLocusData.filter(bl => bl.dna_status === 'problem' || bl.pcr_status === 'problem' || bl.electrophoresis_status === 'problem').length,
      problemList: batchLocusData.filter(bl => bl.pcr_status === 'pcr_repeat_needed' || bl.electrophoresis_status === 'electrophoresis_repeat_needed' || bl.dna_status === 'problem' || bl.pcr_status === 'problem' || bl.electrophoresis_status === 'problem').map(bl => ({
        id: bl.id,
        project_name: projectsData.find(p => p.id === bl.project_id)?.name || '?',
        batch_code: groupsData.find(g => g.id === bl.sample_group_id)?.batch_code || '?',
        locus_code: lociData.find(l => l.id === bl.locus_id)?.locus_code || '?',
        dna_status: bl.dna_status, pcr_status: bl.pcr_status, electrophoresis_status: bl.electrophoresis_status,
      })),
      readyList: batchLocusData.filter(bl => bl.ready_for_calculations === 1).map(bl => ({
        id: bl.id,
        project_name: projectsData.find(p => p.id === bl.project_id)?.name || '?',
        batch_code: groupsData.find(g => g.id === bl.sample_group_id)?.batch_code || '?',
        locus_code: lociData.find(l => l.id === bl.locus_id)?.locus_code || '?',
      })),
    };
  },

  getExportData: async () => batchLocusData.map(bl => {
    const locus = lociData.find(l => l.id === bl.locus_id);
    return {
      project_name: projectsData.find(p => p.id === bl.project_id)?.name || '?',
      batch_code: groupsData.find(g => g.id === bl.sample_group_id)?.batch_code || '?',
      locus_code: locus?.locus_code || '?',
      annealing_temp: bl.annealing_temp_override || locus?.annealing_temp || '',
      electrophoresis_time: bl.electrophoresis_time_override || locus?.electrophoresis_time || '',
      dna_status: bl.dna_status, pcr_status: bl.pcr_status, electrophoresis_status: bl.electrophoresis_status,
      ready_for_calculations: bl.ready_for_calculations, notes: bl.notes, updated_at: bl.updated_at,
    };
  }),
  chooseExportFile: async () => 'salmon-tracker-export.xlsx',
  backupSave: async () => 'salmon-tracker-backup.db',
  backupRestore: async () => true,
};
