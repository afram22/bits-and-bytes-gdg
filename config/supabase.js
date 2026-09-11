const path = require('path');
const {
  SEED_WORKERS,
  SEED_CONTRACTORS,
  SEED_JOBS,
  SEED_ASSIGNMENTS,
  SEED_PAYMENTS
} = require('./seedData');

// Import authoritative Supabase client and DB service built by Database team (Member 3)
const { supabase, supabaseAdmin, testConnection } = require(path.resolve(__dirname, '../../database/supabaseClient'));
const KaamSetuDB = require(path.resolve(__dirname, '../../database/dbService'));

const activeClient = () => supabaseAdmin || supabase;

const isSupabaseConfigured = Boolean(
  process.env.SUPABASE_URL &&
  (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) &&
  !process.env.SUPABASE_URL.includes('your-project')
);

if (isSupabaseConfigured) {
  console.log('✓ Connected to Supabase at:', process.env.SUPABASE_URL);
} else {
  console.log('ℹ️ Supabase credentials not set in .env. Operating in high-speed local in-memory database mode with seed data.');
}

// In-Memory Database Store (Fallback for offline/local testing)
const memoryStore = {
  workers: JSON.parse(JSON.stringify(SEED_WORKERS)),
  contractors: JSON.parse(JSON.stringify(SEED_CONTRACTORS)),
  jobs: JSON.parse(JSON.stringify(SEED_JOBS)),
  assignments: JSON.parse(JSON.stringify(SEED_ASSIGNMENTS)),
  payments: JSON.parse(JSON.stringify(SEED_PAYMENTS))
};

// Normalization Helpers mapping relational Supabase tables to flat backend DTOs
function normalizeWorker(data) {
  if (!data) return null;
  if (data.workers) {
    const w = Array.isArray(data.workers) ? data.workers[0] : data.workers;
    if (w) {
      return {
        id: w.id || data.id, // Primary key in workers table
        user_id: data.id || w.user_id,
        worker_id: w.id || data.id,
        name: data.name || w.name,
        phone: data.mobile || data.phone || w.phone,
        trade: w.skill || w.trade || data.trade || 'Masonry',
        experience: w.experience || data.experience || '3-5 Years',
        location: data.location || w.location || 'Noida, UP',
        daily_wage: Number(data.daily_wage || w.daily_wage || 800),
        password_hash: data.password_hash || w.password_hash,
        created_at: data.created_at || w.created_at
      };
    }
  }
  return {
    ...data,
    phone: data.phone || data.mobile,
    trade: data.trade || data.skill || 'Masonry',
    daily_wage: Number(data.daily_wage || 800)
  };
}

function normalizeContractor(data) {
  if (!data) return null;
  if (data.contractors) {
    const c = Array.isArray(data.contractors) ? data.contractors[0] : data.contractors;
    if (c) {
      return {
        id: c.id || data.id, // Primary key in contractors table
        user_id: data.id || c.user_id,
        contractor_id: c.id || data.id,
        company_name: c.company_name || data.company_name || data.name,
        contact_person: data.name || c.contact_person || c.company_name,
        phone: data.mobile || data.phone || c.phone,
        email: data.email || c.email || null,
        business_type: c.work_category || c.business_type || 'General Civil Contractor',
        location: data.location || c.location || 'Delhi NCR',
        password_hash: data.password_hash || c.password_hash,
        created_at: data.created_at || c.created_at
      };
    }
  }
  return {
    ...data,
    phone: data.phone || data.mobile,
    contact_person: data.contact_person || data.name || data.company_name
  };
}

// Unified Data Access Helper
const db = {
  // Workers
  async findWorkerByPhone(phone) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const user = await KaamSetuDB.getUserByMobile(phone);
        if (user && (user.role === 'worker' || (user.workers && user.workers.length > 0))) {
          return normalizeWorker(user);
        }
        const { data, error } = await activeClient().from('workers').select('*, users(*)').eq('phone', phone).maybeSingle();
        if (!error && data) return normalizeWorker(data);
      } catch (err) {
        console.warn('Supabase findWorkerByPhone fallback:', err.message);
      }
    }
    return memoryStore.workers.find(w => w.phone === phone) || null;
  },

  async findWorkerById(id) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        // Query workers table where id = id OR user_id = id
        const { data, error } = await activeClient()
          .from('workers')
          .select('*, users(*)')
          .or(`id.eq.${id},user_id.eq.${id}`)
          .limit(1);

        if (!error && data && data.length > 0) return normalizeWorker(data[0]);

        const { data: userData, error: userErr } = await activeClient()
          .from('users')
          .select('*, workers(*)')
          .eq('id', id)
          .maybeSingle();
        if (!userErr && userData) return normalizeWorker(userData);
      } catch (err) {
        console.warn('Supabase findWorkerById fallback:', err.message);
      }
    }
    return memoryStore.workers.find(w => w.id === id || w.user_id === id) || null;
  },

  async createWorker(workerData) {
    const newWorker = {
      id: workerData.id || `w-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...workerData
    };

    if (isSupabaseConfigured && activeClient()) {
      try {
        const res = await KaamSetuDB.registerUser({
          name: workerData.name,
          mobile: workerData.phone,
          password_hash: workerData.password_hash || 'hashed_pw',
          role: 'worker',
          location: workerData.location || 'Noida, UP',
          profileData: {
            skill: workerData.trade || 'Masonry',
            experience: workerData.experience || '3-5 Years'
          }
        });
        if (res && res.worker) {
          const created = normalizeWorker({ ...res.user, workers: [res.worker] });
          memoryStore.workers.push(created);
          return created;
        }
      } catch (err) {
        try {
          const { data, error } = await activeClient().from('workers').insert([newWorker]).select().single();
          if (!error && data) {
            memoryStore.workers.push(data);
            return data;
          }
        } catch (e) {}
        console.warn('Supabase worker insert fallback:', err.message);
      }
    }

    memoryStore.workers.push(newWorker);
    return newWorker;
  },

  async updateWorker(id, updateData) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('workers').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) {
          const idx = memoryStore.workers.findIndex(w => w.id === id);
          if (idx !== -1) memoryStore.workers[idx] = data;
          return data;
        }
      } catch (err) {}
    }

    const worker = memoryStore.workers.find(w => w.id === id || w.user_id === id);
    if (!worker) return null;
    Object.assign(worker, updateData, { updated_at: new Date().toISOString() });
    return worker;
  },

  // Contractors
  async findContractorByIdentifier(identifier) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const user = await KaamSetuDB.getUserByMobile(identifier);
        if (user && (user.role === 'contractor' || (user.contractors && user.contractors.length > 0))) {
          return normalizeContractor(user);
        }
        const { data, error } = await activeClient()
          .from('contractors')
          .select('*, users(*)')
          .or(`phone.eq.${identifier},email.eq.${identifier}`)
          .limit(1);
        if (!error && data && data.length > 0) return normalizeContractor(data[0]);
      } catch (err) {
        console.warn('Supabase findContractorByIdentifier fallback:', err.message);
      }
    }
    return memoryStore.contractors.find(c => c.phone === identifier || c.email === identifier) || null;
  },

  async findContractorById(id) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient()
          .from('contractors')
          .select('*, users(*)')
          .or(`id.eq.${id},user_id.eq.${id}`)
          .limit(1);
        if (!error && data && data.length > 0) return normalizeContractor(data[0]);

        const { data: userData, error: userErr } = await activeClient()
          .from('users')
          .select('*, contractors(*)')
          .eq('id', id)
          .maybeSingle();
        if (!userErr && userData) return normalizeContractor(userData);
      } catch (err) {
        console.warn('Supabase findContractorById fallback:', err.message);
      }
    }
    return memoryStore.contractors.find(c => c.id === id || c.user_id === id) || null;
  },

  async createContractor(contractorData) {
    const newContractor = {
      id: contractorData.id || `c-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...contractorData
    };

    if (isSupabaseConfigured && activeClient()) {
      try {
        const res = await KaamSetuDB.registerUser({
          name: contractorData.contact_person || contractorData.company_name,
          mobile: contractorData.phone,
          password_hash: contractorData.password_hash || 'hashed_pw',
          role: 'contractor',
          location: contractorData.location || 'Delhi NCR',
          profileData: {
            company_name: contractorData.company_name,
            work_category: contractorData.business_type || 'General Civil Contractor'
          }
        });
        if (res && res.contractor) {
          const created = normalizeContractor({ ...res.user, contractors: [res.contractor] });
          memoryStore.contractors.push(created);
          return created;
        }
      } catch (err) {
        try {
          const { data, error } = await activeClient().from('contractors').insert([newContractor]).select().single();
          if (!error && data) {
            memoryStore.contractors.push(data);
            return data;
          }
        } catch (e) {}
        console.warn('Supabase contractor insert fallback:', err.message);
      }
    }

    memoryStore.contractors.push(newContractor);
    return newContractor;
  },

  async updateContractor(id, updateData) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('contractors').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) {
          const idx = memoryStore.contractors.findIndex(c => c.id === id);
          if (idx !== -1) memoryStore.contractors[idx] = data;
          return data;
        }
      } catch (err) {}
    }

    const contractor = memoryStore.contractors.find(c => c.id === id || c.user_id === id);
    if (!contractor) return null;
    Object.assign(contractor, updateData, { updated_at: new Date().toISOString() });
    return contractor;
  },

  // Jobs
  async getAllJobs(filters = {}) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let query = activeClient().from('jobs').select('*');
        if (filters.category && filters.category !== 'All') {
          query = query.ilike('category', `%${filters.category}%`);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.minWage) {
          query = query.gte('daily_wage', Number(filters.minWage));
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase getAllJobs fallback:', err.message);
      }
    }

    let jobs = [...memoryStore.jobs];
    if (filters.category && filters.category !== 'All') {
      jobs = jobs.filter(j => j.category.toLowerCase().includes(filters.category.toLowerCase()));
    }
    if (filters.status) {
      jobs = jobs.filter(j => j.status === filters.status);
    }
    if (filters.minWage) {
      jobs = jobs.filter(j => Number(j.daily_wage) >= Number(filters.minWage));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.contractor_name && j.contractor_name.toLowerCase().includes(q))
      );
    }
    return jobs;
  },

  async getJobById(id) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('jobs').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.jobs.find(j => j.id === id) || null;
  },

  async getJobsByContractor(contractorId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualContractorId = contractorId;
        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) actualContractorId = contractor.id;

        const jobs = await KaamSetuDB.getContractorJobs(actualContractorId);
        if (jobs && jobs.length > 0) return jobs;

        const { data, error } = await activeClient()
          .from('jobs')
          .select('*')
          .or(`contractor_id.eq.${actualContractorId},contractor_id.eq.${contractorId}`)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.jobs.filter(j => j.contractor_id === contractorId);
  },

  async createJob(jobData) {
    const newJob = {
      id: jobData.id || `job-${Date.now()}`,
      status: jobData.status || 'Open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...jobData
    };

    if (isSupabaseConfigured && activeClient()) {
      try {
        let contractorId = jobData.contractor_id;
        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) contractorId = contractor.id;

        const dbJob = await KaamSetuDB.createJob({
          contractor_id: contractorId,
          title: jobData.title,
          category: jobData.category,
          location: jobData.location,
          workers_required: jobData.workers_needed || jobData.workers_required || 1,
          wage: Number(jobData.daily_wage || jobData.dailyWage || 800),
          start_date: jobData.start_date || jobData.startDate,
          end_date: jobData.end_date || jobData.endDate,
          description: jobData.description
        });

        if (dbJob) {
          memoryStore.jobs.unshift(dbJob);
          return dbJob;
        }
      } catch (err) {
        try {
          const { data, error } = await activeClient().from('jobs').insert([newJob]).select().single();
          if (!error && data) {
            memoryStore.jobs.unshift(data);
            return data;
          }
        } catch (e) {}
        console.warn('Supabase job insert fallback:', err.message);
      }
    }

    memoryStore.jobs.unshift(newJob);
    return newJob;
  },

  async updateJob(id, updateData) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('jobs').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) {
          const idx = memoryStore.jobs.findIndex(j => j.id === id);
          if (idx !== -1) memoryStore.jobs[idx] = data;
          return data;
        }
      } catch (err) {}
    }

    const job = memoryStore.jobs.find(j => j.id === id);
    if (!job) return null;
    Object.assign(job, updateData, { updated_at: new Date().toISOString() });
    return job;
  },

  // Assignments
  async getAssignmentsByWorker(workerId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualWorkerId = workerId;
        const worker = await this.findWorkerById(workerId);
        if (worker && worker.id) actualWorkerId = worker.id;

        const assignments = await KaamSetuDB.getWorkerAssignments(actualWorkerId);
        if (assignments && assignments.length > 0) return assignments;

        const { data, error } = await activeClient()
          .from('job_assignments')
          .select('*')
          .or(`worker_id.eq.${actualWorkerId},worker_id.eq.${workerId}`)
          .order('assigned_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.assignments.filter(a => a.worker_id === workerId);
  },

  async getAssignmentsByContractor(contractorId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualContractorId = contractorId;
        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) actualContractorId = contractor.id;

        const { data, error } = await activeClient()
          .from('job_assignments')
          .select('*')
          .or(`contractor_id.eq.${actualContractorId},contractor_id.eq.${contractorId}`);
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.assignments.filter(a => a.contractor_id === contractorId);
  },

  async getAssignmentsByJob(jobId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('job_assignments').select('*').eq('job_id', jobId);
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.assignments.filter(a => a.job_id === jobId);
  },

  async findAssignment(jobId, workerId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualWorkerId = workerId;
        const worker = await this.findWorkerById(workerId);
        if (worker && worker.id) actualWorkerId = worker.id;

        const { data, error } = await activeClient()
          .from('job_assignments')
          .select('*')
          .eq('job_id', jobId)
          .or(`worker_id.eq.${actualWorkerId},worker_id.eq.${workerId}`)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.assignments.find(a => a.job_id === jobId && (a.worker_id === workerId || a.worker_id === actualWorkerId)) || null;
  },

  async findAssignmentById(id) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('job_assignments').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.assignments.find(a => a.id === id) || null;
  },

  async createAssignment(assignmentData) {
    const newAssignment = {
      id: assignmentData.id || `app-${Date.now()}`,
      assignment_status: assignmentData.assignment_status || 'Assigned',
      work_status: assignmentData.work_status || 'Assigned',
      applied_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...assignmentData
    };

    if (isSupabaseConfigured && activeClient()) {
      try {
        let workerId = assignmentData.worker_id;
        let contractorId = assignmentData.contractor_id;

        const worker = await this.findWorkerById(workerId);
        if (worker && worker.id) workerId = worker.id;

        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) contractorId = contractor.id;

        const res = await KaamSetuDB.assignWorkerToJob({
          job_id: assignmentData.job_id,
          worker_id: workerId,
          contractor_id: contractorId,
          agreed_wage: Number(assignmentData.agreed_wage || 800)
        });

        if (res) {
          memoryStore.assignments.unshift(res);
          return res;
        }
      } catch (err) {
        console.warn('Supabase assignment insert fallback:', err.message);
        try {
          const { data, error } = await activeClient().from('job_assignments').insert([newAssignment]).select().single();
          if (!error && data) {
            memoryStore.assignments.unshift(data);
            return data;
          }
        } catch (e) {}
      }
    }

    memoryStore.assignments.unshift(newAssignment);
    return newAssignment;
  },

  async updateAssignment(id, updateData) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        if (updateData.work_status) {
          const updated = await KaamSetuDB.updateWorkProgress(id, updateData.work_status);
          if (updated) {
            const idx = memoryStore.assignments.findIndex(a => a.id === id);
            if (idx !== -1) memoryStore.assignments[idx] = updated;
            return updated;
          }
        } else if (updateData.assignment_status) {
          const updated = await KaamSetuDB.respondToAssignment(id, updateData.assignment_status);
          if (updated) {
            const idx = memoryStore.assignments.findIndex(a => a.id === id);
            if (idx !== -1) memoryStore.assignments[idx] = updated;
            return updated;
          }
        }
      } catch (err) {
        try {
          const { data, error } = await activeClient().from('job_assignments').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
          if (!error && data) {
            const idx = memoryStore.assignments.findIndex(a => a.id === id);
            if (idx !== -1) memoryStore.assignments[idx] = data;
            return data;
          }
        } catch (e) {}
      }
    }

    const assignment = memoryStore.assignments.find(a => a.id === id);
    if (!assignment) return null;
    Object.assign(assignment, updateData, { updated_at: new Date().toISOString() });
    return assignment;
  },

  // Payments
  async getPaymentsByWorker(workerId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualWorkerId = workerId;
        const worker = await this.findWorkerById(workerId);
        if (worker && worker.id) actualWorkerId = worker.id;

        const payments = await KaamSetuDB.getWorkerPayments(actualWorkerId);
        if (payments && payments.length > 0) return payments;

        const { data, error } = await activeClient()
          .from('payments')
          .select('*')
          .or(`worker_id.eq.${actualWorkerId},worker_id.eq.${workerId}`)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.payments.filter(p => p.worker_id === workerId);
  },

  async getPaymentsByContractor(contractorId) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        let actualContractorId = contractorId;
        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) actualContractorId = contractor.id;

        const { data, error } = await activeClient()
          .from('payments')
          .select('*')
          .or(`contractor_id.eq.${actualContractorId},contractor_id.eq.${contractorId}`)
          .order('created_at', { ascending: false });
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.payments.filter(p => p.contractor_id === contractorId);
  },

  async findPaymentById(id) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        const { data, error } = await activeClient().from('payments').select('*').eq('id', id).single();
        if (!error && data) return data;
      } catch (err) {}
    }
    return memoryStore.payments.find(p => p.id === id) || null;
  },

  async createPayment(paymentData) {
    const newPayment = {
      id: paymentData.id || `pay-${Date.now()}`,
      payment_status: paymentData.payment_status || 'Pending',
      payment_date: paymentData.payment_date || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...paymentData
    };

    if (isSupabaseConfigured && activeClient()) {
      try {
        let workerId = paymentData.worker_id;
        let contractorId = paymentData.contractor_id;

        const worker = await this.findWorkerById(workerId);
        if (worker && worker.id) workerId = worker.id;

        const contractor = await this.findContractorById(contractorId);
        if (contractor && contractor.id) contractorId = contractor.id;

        const insertPayload = {
          ...newPayment,
          worker_id: workerId,
          contractor_id: contractorId
        };

        const { data, error } = await activeClient().from('payments').insert([insertPayload]).select().single();
        if (!error && data) {
          memoryStore.payments.unshift(data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase payment insert fallback:', err.message);
      }
    }

    memoryStore.payments.unshift(newPayment);
    return newPayment;
  },

  async updatePayment(id, updateData) {
    if (isSupabaseConfigured && activeClient()) {
      try {
        if (updateData.payment_status === 'Paid') {
          const updated = await KaamSetuDB.markPaymentPaid(id);
          if (updated) {
            const idx = memoryStore.payments.findIndex(p => p.id === id);
            if (idx !== -1) memoryStore.payments[idx] = updated;
            return updated;
          }
        }
        const { data, error } = await activeClient().from('payments').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', id).select().single();
        if (!error && data) {
          const idx = memoryStore.payments.findIndex(p => p.id === id);
          if (idx !== -1) memoryStore.payments[idx] = data;
          return data;
        }
      } catch (err) {}
    }

    const payment = memoryStore.payments.find(p => p.id === id);
    if (!payment) return null;
    Object.assign(payment, updateData, { updated_at: new Date().toISOString() });
    return payment;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection,
  db
};
