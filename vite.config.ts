import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import firebaseConfig from './firebase-applet-config.json';

function extractUserFromBearer(authHeader: string | undefined): { uid: string; email?: string; name?: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  if (!token) return null;

  const banned = ['mock-user', 'guest', 'guest-user', 'verified-session-user', 'anonymous', 'test-user', 'test_user'];

  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
      const payload = JSON.parse(payloadJson);
      const uid = payload.user_id || payload.uid || payload.sub;
      if (!uid || typeof uid !== 'string' || banned.includes(uid.toLowerCase())) {
        return null;
      }
      return {
        uid,
        email: payload.email || undefined,
        name: payload.name || payload.displayName || undefined,
      };
    }
  } catch {
    // Non-JWT token
  }

  // If token is a non-empty string and not in banned list, allow if it's a simulated dev token
  if (!banned.includes(token.toLowerCase()) && token.length >= 8) {
    return {
      uid: token.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40),
    };
  }

  return null;
}

function apiDevPlugin(): Plugin {
  return {
    name: 'care-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/api/health') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            status: 'healthy',
            service: 'CARE Engine',
            environment: 'development',
            databaseId: firebaseConfig.firestoreDatabaseId || '(default)',
            vertexAi: true,
            gcpProject: firebaseConfig.projectId || 'care-recall',
            location: 'us-central1',
          }));
          return;
        }

        // Global security gate for all protected API routes
        const isAuthProtected = 
          req.url?.startsWith('/api/journal/') || 
          req.url === '/api/journal/entries' || 
          req.url?.startsWith('/api/topics') || 
          req.url?.startsWith('/api/recall/') || 
          req.url === '/api/auth/me' || 
          req.url === '/api/auth/sync';

        if (isAuthProtected) {
          const authUser = extractUserFromBearer(req.headers['authorization']);
          if (!authUser) {
            res.statusCode = 401;
            res.setHeader('WWW-Authenticate', 'Bearer');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              detail: 'Unauthorized: Valid Firebase Authorization Bearer token required. Mock or guest sessions forbidden.' 
            }));
            return;
          }

          if (req.url === '/api/auth/me') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              isNewUser: false,
              user: {
                uid: authUser.uid,
                email: authUser.email || `${authUser.uid}@firebase.care`,
                displayName: authUser.name || 'Data Science Professional',
                authProvider: 'firebase',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stats: {
                  totalJournalsLogged: 0,
                  totalRecallSessionsCompleted: 0,
                  averageRecallScore: 0.0,
                  activeTopicsCount: 0,
                },
                preferences: {
                  dailyRecallTarget: 3,
                  preferredInterviewTone: 'rigorous_peer',
                },
              },
            }));
            return;
          }

          if (req.url === '/api/auth/sync' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ status: 'ok', message: 'Profile synced' }));
            });
            return;
          }

          // Per-user isolated in-memory stores for dev
          if (!(global as any).__care_journals_by_user) (global as any).__care_journals_by_user = {};
          if (!(global as any).__care_topics_by_user) (global as any).__care_topics_by_user = {};

          // Initialize with clean empty collections for new accounts to prevent dummy data leakage
          if (!(global as any).__care_journals_by_user[authUser.uid]) {
            (global as any).__care_journals_by_user[authUser.uid] = [];
          }
          if (!(global as any).__care_topics_by_user[authUser.uid]) {
            (global as any).__care_topics_by_user[authUser.uid] = {};
          }

          if (false && !(global as any).__care_journals_by_user[authUser.uid]) {
            const seedJournals = [
              {
                entryId: 'entry-telemetry-01',
                userId: authUser.uid,
                title: 'Self-Attention Mechanism Optimization',
                rawContent: 'Refactored multi-head scaled dot-product attention kernels. Replaced custom naive QK^T matrix multiplication with tiled block SRAM operations to mitigate memory bandwidth saturation. AI co-pilot generated the vector masking routines while I tuned dimension alignment with torch.matmul(q, k.transpose(-2, -1)) and strict block_size = 128 boundaries.',
                aiAssistanceLevel: 'spec_driven',
                aiReliancePercentage: 85,
                aiToolUsed: 'Cursor Copilot',
                modeType: 'Web App',
                stabilityRatio: 0.34,
                kernelProfileSnapshot: 'KERNEL PROFILE SNAPSHOT',
                hardwareProfile: 'SRAM TILE: 128x128 FP16',
                tags: ['#Self-Attention Mechanism', '#FlashAttention-2', '#Memory Bandwidth Kernels'],
                timeUtc: '14:22 UTC',
                actionLabel: 'Recall Diagnostic →',
                dateGroup: 'Today — 6 Sept',
                extractedConcepts: [
                  { topicId: 'self_attention_mechanism', canonicalName: 'Self-Attention Mechanism', category: 'Deep Learning', importanceScore: 0.95 },
                  { topicId: 'flashattention_kernels', canonicalName: 'FlashAttention-2', category: 'Deep Learning', importanceScore: 0.88 }
                ],
                createdAt: '2026-09-06T14:22:00.000Z'
              },
              {
                entryId: 'entry-telemetry-02',
                userId: authUser.uid,
                title: 'Distributed Cache Invalidation via Redis Streams',
                rawContent: 'Implemented consumer group rebalancing and two-phase tombstone marking for distributed session state. Evaluated probabilistic early expiration against dogpiling cache stamps across 8 global nodes. Configured manual backpressure acknowledgment queues with Lua scripts to prevent stale subscriber drops.',
                aiAssistanceLevel: 'prompt_driven',
                aiReliancePercentage: 45,
                aiToolUsed: 'Claude Sonnet',
                modeType: 'GitHub PR #412',
                stabilityRatio: 0.78,
                tags: ['#Cache Coherence', '#Redis Streams', '#Distributed Systems'],
                timeUtc: '09:40 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Yesterday — 5 Sept',
                extractedConcepts: [
                  { topicId: 'distributed_cache_invalidation', canonicalName: 'Distributed Cache Invalidation', category: 'Distributed Systems', importanceScore: 0.82 }
                ],
                createdAt: '2026-09-05T09:40:00.000Z'
              },
              {
                entryId: 'entry-telemetry-03',
                userId: authUser.uid,
                title: 'Postgres JSONB GIN Indexing & Query Planner Cost Tuning',
                rawContent: 'Diagnosed sequential table scan on 4.2M rows telemetry logs. Constructed expression GIN index over nested schema payload and adjusted random_page_cost down to 1.1 for NVMe storage, shifting the planner execution graph from a 420ms heap inspection to a 3.4ms bitmap index scan.',
                aiAssistanceLevel: 'spec_driven',
                aiReliancePercentage: 78,
                aiToolUsed: 'Claude CLI',
                modeType: 'Web App / Claude CLI',
                stabilityRatio: 0.49,
                tags: ['#PostgreSQL GIN', '#Query Planner Costs', '#Storage Engines'],
                timeUtc: '11:15 UTC',
                actionLabel: 'Review Prompt Queue →',
                dateGroup: 'Earlier this week — 2 Sept',
                extractedConcepts: [
                  { topicId: 'postgres_gin_indexing', canonicalName: 'Postgres GIN Indexing', category: 'Data Infrastructure', importanceScore: 0.86 }
                ],
                createdAt: '2026-09-02T11:15:00.000Z'
              },
              {
                entryId: 'entry-telemetry-04',
                userId: authUser.uid,
                title: 'HNSW Vector Index Partitioning in pgvector',
                rawContent: 'Tuned hierarchical navigable small world graphs over 1.2M 1536-dimensional embeddings. Configured m=16 and ef_construction=64 to maintain 97% recall at 12ms latency p99.',
                aiAssistanceLevel: 'agentic',
                aiReliancePercentage: 82,
                aiToolUsed: 'Cursor Agent',
                modeType: 'Cursor Extension',
                stabilityRatio: 0.41,
                tags: ['#Vector Search', '#HNSW Graphs', '#pgvector'],
                timeUtc: '16:05 UTC',
                actionLabel: 'Recall Diagnostic →',
                dateGroup: 'Earlier this week — 2 Sept',
                extractedConcepts: [{ topicId: 'hnsw_vector_indexing', canonicalName: 'HNSW Vector Indexing', category: 'Information Retrieval', importanceScore: 0.91 }],
                createdAt: '2026-09-02T16:05:00.000Z'
              },
              {
                entryId: 'entry-telemetry-05',
                userId: authUser.uid,
                title: 'LoRA Rank Decomposition for Llama-3 8B Fine-Tuning',
                rawContent: 'Calculated gradient memory footprint for LoRA adapters targetting q_proj and v_proj layers. Selected rank r=16 with alpha=32 to preserve parameter efficiency.',
                aiAssistanceLevel: 'prompt_driven',
                aiReliancePercentage: 62,
                aiToolUsed: 'Gemini CLI',
                modeType: 'Web App',
                stabilityRatio: 0.65,
                tags: ['#LoRA', '#PEFT', '#Fine-Tuning'],
                timeUtc: '10:30 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Last week — 30 Aug',
                extractedConcepts: [{ topicId: 'lora_fine_tuning', canonicalName: 'LoRA Fine-Tuning', category: 'Deep Learning', importanceScore: 0.89 }],
                createdAt: '2026-08-30T10:30:00.000Z'
              },
              {
                entryId: 'entry-telemetry-06',
                userId: authUser.uid,
                title: 'Quantization-Aware Training with FP8 Scaling Factors',
                rawContent: 'Configured delayed per-tensor scaling factors for forward and backward passes. Verified dynamic range alignment between activations and weights.',
                aiAssistanceLevel: 'spec_driven',
                aiReliancePercentage: 74,
                aiToolUsed: 'Claude 3.5 Sonnet',
                modeType: 'VS Code Plugin',
                stabilityRatio: 0.52,
                tags: ['#Quantization', '#FP8', '#Model Optimization'],
                timeUtc: '15:10 UTC',
                actionLabel: 'Review Prompt Queue →',
                dateGroup: 'Last week — 29 Aug',
                extractedConcepts: [{ topicId: 'model_quantization', canonicalName: 'FP8 Quantization', category: 'Model Optimization', importanceScore: 0.85 }],
                createdAt: '2026-08-29T15:10:00.000Z'
              },
              {
                entryId: 'entry-telemetry-07',
                userId: authUser.uid,
                title: 'Bayesian A/B Testing Stopping Boundaries',
                rawContent: 'Formulated Beta-Binomial conjugate prior distributions for conversion rate telemetry. Calculated expected loss threshold epsilon=0.001 to declare significance early.',
                aiAssistanceLevel: 'none',
                aiReliancePercentage: 12,
                modeType: 'Web App',
                stabilityRatio: 0.91,
                tags: ['#Bayesian Statistics', '#AB Testing', '#Experimentation'],
                timeUtc: '08:45 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Last week — 28 Aug',
                extractedConcepts: [{ topicId: 'bayesian_inference', canonicalName: 'Bayesian Inference', category: 'Statistics & Probability', importanceScore: 0.88 }],
                createdAt: '2026-08-28T08:45:00.000Z'
              },
              {
                entryId: 'entry-telemetry-08',
                userId: authUser.uid,
                title: 'Ray Cluster Auto-scaling & Actor Placement Groups',
                rawContent: 'Resolved worker node eviction during batch embedding extraction. Configured STRICT_SPREAD placement strategy across spot instances.',
                aiAssistanceLevel: 'prompt_driven',
                aiReliancePercentage: 55,
                aiToolUsed: 'Cursor Copilot',
                modeType: 'GitHub PR #389',
                stabilityRatio: 0.72,
                tags: ['#Distributed Computing', '#Ray Cluster', '#MLOps'],
                timeUtc: '13:20 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Earlier in August — 25 Aug',
                extractedConcepts: [{ topicId: 'ray_distributed_compute', canonicalName: 'Ray Distributed Clusters', category: 'MLOps & Infrastructure', importanceScore: 0.80 }],
                createdAt: '2026-08-25T13:20:00.000Z'
              },
              {
                entryId: 'entry-telemetry-09',
                userId: authUser.uid,
                title: 'Covariate Shift Detection via Maximum Mean Discrepancy',
                rawContent: 'Deployed two-sample MMD test on streaming inference embeddings. Calculated kernel bandwidth via median heuristic to signal automated retraining pipelines.',
                aiAssistanceLevel: 'spec_driven',
                aiReliancePercentage: 79,
                aiToolUsed: 'Claude CLI',
                modeType: 'Web App / Claude CLI',
                stabilityRatio: 0.44,
                tags: ['#Data Drift', '#MMD Test', '#Model Monitoring'],
                timeUtc: '17:00 UTC',
                actionLabel: 'Recall Diagnostic →',
                dateGroup: 'Earlier in August — 24 Aug',
                extractedConcepts: [{ topicId: 'covariate_shift_detection', canonicalName: 'Covariate Shift & Data Drift', category: 'MLOps & Infrastructure', importanceScore: 0.90 }],
                createdAt: '2026-08-24T17:00:00.000Z'
              },
              {
                entryId: 'entry-telemetry-10',
                userId: authUser.uid,
                title: 'Stratified K-Fold Cross Validation with Group Leakage Protection',
                rawContent: 'Audited multi-task clinical diagnostic model. Identified patient-level cross-contamination across validation folds and replaced random stratification with GroupKFold partitioned by patient ID hash.',
                aiAssistanceLevel: 'none',
                aiReliancePercentage: 15,
                modeType: 'Web App',
                stabilityRatio: 0.88,
                tags: ['#Cross Validation', '#Data Leakage', '#Model Evaluation'],
                timeUtc: '10:15 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Earlier in August — 21 Aug',
                extractedConcepts: [{ topicId: 'stratified_kfold', canonicalName: 'Stratified K-Fold CV', category: 'Classical ML', importanceScore: 0.84 }],
                createdAt: '2026-08-21T10:15:00.000Z'
              },
              {
                entryId: 'entry-telemetry-11',
                userId: authUser.uid,
                title: 'Cross-Attention Key/Value Caching for Streaming LLM Generation',
                rawContent: 'Implemented rolling circular buffer for KV states in autoregressive decoding. Bound memory allocation to O(context_window) rather than O(sequence_length), eliminating memory spikes.',
                aiAssistanceLevel: 'agentic',
                aiReliancePercentage: 86,
                aiToolUsed: 'Cursor Agent',
                modeType: 'Cursor Extension',
                stabilityRatio: 0.31,
                tags: ['#KV Cache', '#Transformer Decoding', '#Deep Learning'],
                timeUtc: '14:50 UTC',
                actionLabel: 'Recall Diagnostic →',
                dateGroup: 'Earlier in August — 18 Aug',
                extractedConcepts: [{ topicId: 'kv_cache_decoding', canonicalName: 'KV Cache Optimization', category: 'Deep Learning', importanceScore: 0.93 }],
                createdAt: '2026-08-18T14:50:00.000Z'
              },
              {
                entryId: 'entry-telemetry-12',
                userId: authUser.uid,
                title: 'Feature Store Point-in-Time Correct Joins via Feast',
                rawContent: 'Constructed as-of timestamps joins for real-time fraud scoring pipeline. Eliminated lookahead bias between batch entity states and event occurrences with TTL boundary constraints.',
                aiAssistanceLevel: 'prompt_driven',
                aiReliancePercentage: 48,
                aiToolUsed: 'Claude CLI',
                modeType: 'Web App / Claude CLI',
                stabilityRatio: 0.74,
                tags: ['#Feature Store', '#Point-in-Time Join', '#Data Engineering'],
                timeUtc: '11:05 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Earlier in August — 15 Aug',
                extractedConcepts: [{ topicId: 'feature_store_joins', canonicalName: 'Feature Store Time Joins', category: 'Data Infrastructure', importanceScore: 0.79 }],
                createdAt: '2026-08-15T11:05:00.000Z'
              },
              {
                entryId: 'entry-telemetry-13',
                userId: authUser.uid,
                title: 'Gradient Accumulation vs Distributed Data Parallel Gradient Sync',
                rawContent: 'Analyzed all-reduce communication latency overhead on 8x H100 GPUs. Configured gradient accumulation step size = 4 with bucket cap = 25MB to hide all-reduce synchronization behind backward pass computation.',
                aiAssistanceLevel: 'spec_driven',
                aiReliancePercentage: 71,
                aiToolUsed: 'Cursor Copilot',
                modeType: 'GitHub PR #345',
                stabilityRatio: 0.58,
                tags: ['#DDP', '#Distributed Training', '#Gradient Accumulation'],
                timeUtc: '16:30 UTC',
                actionLabel: 'Review Prompt Queue →',
                dateGroup: 'Earlier in August — 12 Aug',
                extractedConcepts: [{ topicId: 'distributed_data_parallel', canonicalName: 'Distributed Data Parallel', category: 'Deep Learning', importanceScore: 0.87 }],
                createdAt: '2026-08-12T16:30:00.000Z'
              },
              {
                entryId: 'entry-telemetry-14',
                userId: authUser.uid,
                title: 'Kernel Density Estimation for Non-Parametric Anomaly Thresholds',
                rawContent: 'Replaced static 3-sigma thresholds with Gaussian KDE over log-transformed latency metrics. Optimized Silverman bandwidth factor to detect multimodal outlier clusters without assumptions of normality.',
                aiAssistanceLevel: 'none',
                aiReliancePercentage: 18,
                modeType: 'Web App',
                stabilityRatio: 0.85,
                tags: ['#KDE', '#Non-Parametric Statistics', '#Anomaly Detection'],
                timeUtc: '09:15 UTC',
                actionLabel: 'Stable',
                dateGroup: 'Earlier in August — 09 Aug',
                extractedConcepts: [{ topicId: 'kernel_density_estimation', canonicalName: 'Kernel Density Estimation', category: 'Statistics & Probability', importanceScore: 0.81 }],
                createdAt: '2026-08-09T09:15:00.000Z'
              }
            ];
            (global as any).__care_journals_by_user[authUser.uid] = seedJournals;
          }

          const userJournals = (global as any).__care_journals_by_user[authUser.uid] || [];
          const userTopics = (global as any).__care_topics_by_user[authUser.uid] || {};

          if (req.url === '/api/journal/entries' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const payload = JSON.parse(body);
                const textLower = (payload.title + ' ' + payload.rawContent).toLowerCase();
                
                const knownConcepts = [
                  { kw: 'attention', name: 'Self-Attention Mechanism', cat: 'Deep Learning', score: 0.95 },
                  { kw: 'transformer', name: 'Transformer Architecture', cat: 'Deep Learning', score: 0.9 },
                  { kw: 'lora', name: 'Low-Rank Adaptation (LoRA)', cat: 'Deep Learning', score: 0.92 },
                  { kw: 'cross-validation', name: 'Stratified K-Fold Cross-Validation', cat: 'Classical ML', score: 0.78 },
                  { kw: 'drift', name: 'Covariance Shift & Data Drift', cat: 'MLOps & Infrastructure', score: 0.8 },
                  { kw: 'gradient', name: 'Gradient Descent & Backprop', cat: 'Deep Learning', score: 0.85 },
                  { kw: 'bayes', name: 'Bayesian Inference', cat: 'Statistics & Probability', score: 0.85 },
                  { kw: 'docker', name: 'Containerization & Reproducibility', cat: 'MLOps & Infrastructure', score: 0.75 },
                ];

                const extracted: any[] = [];
                for (const kc of knownConcepts) {
                  if (textLower.includes(kc.kw)) {
                    extracted.push({
                      topicId: kc.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32),
                      canonicalName: kc.name,
                      category: kc.cat,
                      importanceScore: kc.score,
                      contextSummary: `Extracted from journal context: ${payload.title}`,
                    });
                  }
                }

                if (extracted.length === 0) {
                  extracted.push({
                    topicId: payload.title.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) || 'ds_workflow',
                    canonicalName: payload.title || 'Data Science Workflow',
                    category: 'Classical ML',
                    importanceScore: 0.75,
                    contextSummary: 'Primary concept identified from user entry.',
                  });
                }

                const entryId = 'entry_' + Math.random().toString(36).substring(2, 11);
                const createdAt = new Date().toISOString();
                const modeType = payload.modeType || payload.loggedVia || 'Web App';
                const reliancePercent = payload.aiReliancePercentage || (payload.aiAssistanceLevel === 'agentic' ? 85 : payload.aiAssistanceLevel === 'spec_driven' ? 78 : payload.aiAssistanceLevel === 'prompt_driven' ? 45 : 12);
                const stabilityRatio = payload.stabilityRatio || (reliancePercent >= 70 ? 0.34 : reliancePercent >= 40 ? 0.65 : 0.88);

                const newEntry = {
                  entryId,
                  userId: authUser.uid,
                  title: payload.title,
                  rawContent: payload.rawContent,
                  aiAssistanceLevel: payload.aiAssistanceLevel || 'prompt_driven',
                  aiReliancePercentage: reliancePercent,
                  aiToolUsed: payload.aiToolUsed,
                  modeType: modeType,
                  stabilityRatio: stabilityRatio,
                  tags: payload.tags || extracted.map(c => '#' + c.canonicalName),
                  timeUtc: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC',
                  actionLabel: stabilityRatio < 0.55 ? 'Recall Diagnostic →' : 'Stable',
                  dateGroup: 'Today — ' + new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
                  extractedConcepts: extracted,
                  createdAt,
                };

                const aiWeightMap: Record<string, number> = { none: 0.1, prompt_driven: 0.5, spec_driven: 0.8, agentic: 1.0 };
                const aiWeight = aiWeightMap[payload.aiAssistanceLevel] || 0.5;

                const updatedTopics = extracted.map(c => ({
                  topicId: c.topicId,
                  userId: authUser.uid,
                  canonicalName: c.canonicalName,
                  category: c.category,
                  firstLoggedAt: createdAt,
                  lastLoggedAt: createdAt,
                  lastRecallAt: null,
                  journalOccurrences: 1,
                  recentAiAssistanceSignals: [payload.aiAssistanceLevel || 'prompt_driven'],
                  effectiveAiAssistanceWeight: aiWeight,
                  recallHistory: [],
                  lastRecallScore: 2.5,
                  currentPriorityScore: Math.round((0.4 * 0.1 + 0.35 * aiWeight + 0.25 * 0.5) * c.importanceScore * 100),
                  decayFactor: 1.0,
                  explanationReason: `T(t)=0.05 | A(t)=${aiWeight.toFixed(2)} | H(t)=0.50 | M(t)=${c.importanceScore.toFixed(2)}`,
                }));

                // Append to user-isolated dev store
                if (!(global as any).__care_journals_by_user[authUser.uid]) {
                  (global as any).__care_journals_by_user[authUser.uid] = [];
                }
                if (!(global as any).__care_topics_by_user[authUser.uid]) {
                  (global as any).__care_topics_by_user[authUser.uid] = {};
                }

                (global as any).__care_journals_by_user[authUser.uid].unshift(newEntry);
                for (const t of updatedTopics) {
                  (global as any).__care_topics_by_user[authUser.uid][t.topicId] = t;
                }

                res.end(JSON.stringify({
                  status: 'ok',
                  entry: newEntry,
                  summary: payload.rawContent.slice(0, 180) + '...',
                  detectedComplexity: 'intermediate',
                  extractedConcepts: extracted,
                  updatedTopics,
                }));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ detail: 'Invalid journal JSON payload' }));
              }
            });
            return;
          }

          if (req.url === '/api/journal/entries' && req.method === 'GET') {
            const journals = (global as any).__care_journals_by_user[authUser.uid] || [];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              entries: journals,
              total: journals.length,
            }));
            return;
          }

          if (req.url === '/api/topics' && req.method === 'GET') {
            const userTopicsMap = (global as any).__care_topics_by_user[authUser.uid] || {};
            const topics = Object.values(userTopicsMap);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              topics,
              total: topics.length,
            }));
            return;
          }

          // Slice 3: Recall Engine dev middleware
          if (req.url?.startsWith('/api/recall/queue') && req.method === 'GET') {
            const topics = Object.values(userTopics) as any[];
            const queue = topics.map(t => {
              const lastEvent = t.lastRecallAt || t.lastLoggedAt;
              const elapsedDays = Math.max(0.1, (Date.now() - new Date(lastEvent).getTime()) / (1000 * 86400));
              const T_decay = +(1.0 - Math.exp(-0.1 * elapsedDays)).toFixed(3);
              const A_signal = +(t.effectiveAiAssistanceWeight || 0.5).toFixed(3);
              const H_weakness = +(t.recallHistory?.length > 0 ? (5.0 - t.lastRecallScore) / 4.0 : 0.50).toFixed(3);
              const M_freq = +(1.0 + 0.05 * Math.min(Math.max(0, (t.journalOccurrences || 1) - 1), 6)).toFixed(3);
              const priorityScore = Math.round(Math.min(100, Math.max(0, (0.4 * T_decay + 0.35 * A_signal + 0.25 * H_weakness) * M_freq * 100)) * 10) / 10;

              let rationaleBadge = 'Stable Baseline';
              if (A_signal >= 0.75) rationaleBadge = 'High AI Reliance';
              else if (elapsedDays >= 5.0 || T_decay >= 0.4) rationaleBadge = 'Time Decay Alert';
              else if (H_weakness >= 0.70) rationaleBadge = 'Weak Retention Signal';
              else if (M_freq >= 1.15) rationaleBadge = 'High Frequency Focus';
              else if (priorityScore >= 50.0) rationaleBadge = 'High Priority Decay';

              return {
                topicId: t.topicId,
                canonicalName: t.canonicalName,
                category: t.category,
                priorityScore,
                T_decay,
                d_elapsed_days: +elapsedDays.toFixed(1),
                A_signal,
                H_weakness,
                M_freq,
                rationaleBadge,
                lastLoggedAt: t.lastLoggedAt,
                lastRecallAt: t.lastRecallAt || null,
                journalOccurrences: t.journalOccurrences || 1,
                effectiveAiAssistanceWeight: A_signal,
                lastRecallScore: t.lastRecallScore || 2.5,
                explanationReason: `T(t)=${T_decay} (${elapsedDays.toFixed(1)}d) | A(t)=${A_signal} | H(t)=${H_weakness} | M(t)=${M_freq}`,
              };
            });

            queue.sort((a, b) => b.priorityScore - a.priorityScore);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              queue,
              total: queue.length,
              generatedAt: new Date().toISOString(),
            }));
            return;
          }

          if (req.url?.startsWith('/api/recall/topics') && req.method === 'GET') {
            const urlObj = new URL(req.url, 'http://localhost');
            const search = urlObj.searchParams.get('search')?.toLowerCase();
            const category = urlObj.searchParams.get('category')?.toLowerCase();
            const sortBy = urlObj.searchParams.get('sort_by') || 'priority';
            const page = parseInt(urlObj.searchParams.get('page') || '1', 10);
            const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10);

            let allTopics = Object.values(userTopics) as any[];
            const categories = Array.from(new Set(allTopics.map(t => t.category).filter(Boolean))).sort();

            if (search) {
              allTopics = allTopics.filter(t => 
                (t.canonicalName && t.canonicalName.toLowerCase().includes(search)) ||
                (t.category && t.category.toLowerCase().includes(search))
              );
            }

            if (category && category !== 'all') {
              allTopics = allTopics.filter(t => t.category && t.category.toLowerCase() === category);
            }

            if (sortBy === 'priority') {
              allTopics.sort((a, b) => (b.currentPriorityScore || 0) - (a.currentPriorityScore || 0));
            } else if (sortBy === 'recency') {
              allTopics.sort((a, b) => new Date(b.lastLoggedAt).getTime() - new Date(a.lastLoggedAt).getTime());
            } else if (sortBy === 'ai_signal') {
              allTopics.sort((a, b) => (b.effectiveAiAssistanceWeight || 0) - (a.effectiveAiAssistanceWeight || 0));
            } else if (sortBy === 'alphabetical') {
              allTopics.sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));
            }

            const total = allTopics.length;
            const start = (page - 1) * limit;
            const paginated = allTopics.slice(start, start + limit);

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              topics: paginated,
              total,
              page,
              limit,
              categories,
            }));
            return;
          }

          if (req.url === '/api/recall/sessions/init' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              try {
                const payload = JSON.parse(body);
                const topicId = payload.topicId;
                const topic = userTopics[topicId];
                if (!topic) {
                  res.statusCode = 404;
                  res.end(JSON.stringify({ detail: `Target topic '${topicId}' not found in user knowledge base.` }));
                  return;
                }

                const lastEvent = topic.lastRecallAt || topic.lastLoggedAt;
                const elapsedDays = Math.max(0.1, (Date.now() - new Date(lastEvent).getTime()) / (1000 * 86400));
                const T_decay = +(1.0 - Math.exp(-0.1 * elapsedDays)).toFixed(3);
                const A_signal = +(topic.effectiveAiAssistanceWeight || 0.5).toFixed(3);
                const H_weakness = +(topic.recallHistory?.length > 0 ? (5.0 - topic.lastRecallScore) / 4.0 : 0.50).toFixed(3);
                const M_freq = +(1.0 + 0.05 * Math.min(Math.max(0, (topic.journalOccurrences || 1) - 1), 6)).toFixed(3);
                const priorityScore = Math.round(Math.min(100, Math.max(0, (0.4 * T_decay + 0.35 * A_signal + 0.25 * H_weakness) * M_freq * 100)) * 10) / 10;

                const breakdown = {
                  priorityScore,
                  T_decay,
                  d_elapsed_days: +elapsedDays.toFixed(1),
                  A_signal,
                  H_weakness,
                  M_freq,
                  rationaleBadge: A_signal >= 0.75 ? 'High AI Reliance' : (elapsedDays >= 5 ? 'Time Decay Alert' : 'Standard Decay Curve'),
                  explanationReason: `T(t)=${T_decay} | A(t)=${A_signal} | H(t)=${H_weakness} | M(t)=${M_freq}`,
                };

                const sessionId = 'session_' + Math.random().toString(36).substring(2, 11);
                const session = {
                  sessionId,
                  userId: authUser.uid,
                  topicId: topic.topicId,
                  topicName: topic.canonicalName,
                  status: 'in_progress',
                  targetDepth: payload.targetDepth || 'intermediate',
                  customFocusArea: payload.customFocusArea || null,
                  initialBreakdown: breakdown,
                  turns: [],
                  startedAt: new Date().toISOString(),
                };

                if (!(global as any).__care_sessions_by_user) (global as any).__care_sessions_by_user = {};
                if (!(global as any).__care_sessions_by_user[authUser.uid]) (global as any).__care_sessions_by_user[authUser.uid] = {};
                (global as any).__care_sessions_by_user[authUser.uid][sessionId] = session;

                res.end(JSON.stringify({
                  status: 'ok',
                  session,
                  topic,
                  breakdown,
                }));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ detail: 'Invalid session init payload' }));
              }
            });
            return;
          }

          // Slice 4: Active Recall Peer Knowledge Partner message
          if (req.url?.startsWith('/api/recall/sessions/') && req.url.endsWith('/message') && req.method === 'POST') {
            const parts = req.url.split('/');
            const sessionId = parts[4];
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              const session = (global as any).__care_sessions_by_user?.[authUser.uid]?.[sessionId];
              if (!session) {
                res.statusCode = 404;
                res.end(JSON.stringify({ detail: `Session '${sessionId}' not found.` }));
                return;
              }

              let payload: any = {};
              try {
                if (body) payload = JSON.parse(body);
              } catch (e) {}

              const userMsg = payload.message?.trim();
              if (userMsg) {
                session.turns.push({
                  role: 'user',
                  message: userMsg,
                  timestamp: new Date().toISOString(),
                });
              }

              // Peer Knowledge Partner response generation
              const turnCount = session.turns.length;
              const topicName = session.topicName || 'this technique';
              const depth = session.targetDepth || 'intermediate';
              let assistantMsg = '';

              if (turnCount === 0 || (turnCount === 1 && userMsg)) {
                if (depth === 'foundational') {
                  assistantMsg = `Welcome to this active recall session on ${topicName}. As your Peer Knowledge Partner, to start off, how would you intuitively explain the core problem it addresses, and what breaks down if we attempt to solve it using simpler classical baselines?`;
                } else if (depth === 'advanced') {
                  assistantMsg = `Let's dig into ${topicName}. From a mathematical formulation standpoint, what objective function or loss surfaces dictate its convergence, and how does the architecture prevent gradient instability or degenerate representations?`;
                } else {
                  assistantMsg = `Welcome. As your Peer Knowledge Partner, let's examine ${topicName}. Walk me through its primary algorithmic mechanism: what inputs does it transform, and what fundamental trade-off does it make between representational capacity and computational efficiency?`;
                }
              } else if (turnCount <= 3) {
                assistantMsg = `That's a sound initial formulation. Let's probe the mechanics deeper: when you tune hyperparameters or loss coefficients for ${topicName}, which parameter directly controls this sensitivity, and what happens mathematically during gradient updates if that parameter is set an order of magnitude too high?`;
              } else if (turnCount <= 5) {
                assistantMsg = `Great observation regarding the dynamics. Now consider a real-world edge case: suppose your production input distribution shifts significantly or contains high-sparsity anomalies. Under what specific conditions does ${topicName} fail silently, and how would you verify this in telemetry?`;
              } else {
                assistantMsg = `To wrap up our technical deep dive into ${topicName}: if you had to mentor a colleague on avoiding the single most dangerous misconception when implementing or fine-tuning this, what would that core takeaway be?`;
              }

              const assistantTurn = {
                role: 'assistant',
                message: assistantMsg,
                timestamp: new Date().toISOString(),
              };
              session.turns.push(assistantTurn);

              res.end(JSON.stringify({
                status: 'ok',
                session,
                turn: assistantTurn,
                isFirstTurn: turnCount <= 1,
              }));
            });
            return;
          }

          // Slice 4: Active Recall evaluation
          if (req.url?.startsWith('/api/recall/sessions/') && req.url.endsWith('/evaluate') && req.method === 'POST') {
            const parts = req.url.split('/');
            const sessionId = parts[4];
            res.setHeader('Content-Type', 'application/json');
            const session = (global as any).__care_sessions_by_user?.[authUser.uid]?.[sessionId];
            if (!session) {
              res.statusCode = 404;
              res.end(JSON.stringify({ detail: `Session '${sessionId}' not found.` }));
              return;
            }

            const userTurns = session.turns.filter((t: any) => t.role === 'user');
            const totalChars = userTurns.reduce((acc: number, t: any) => acc + t.message.length, 0);
            const scorePercentage = Math.min(96, Math.max(55, Math.round(60 + Math.min(30, (totalChars / 40) * 4) + (userTurns.length * 3))));
            const overallScore = +(1.0 + (scorePercentage / 100) * 4.0).toFixed(1);

            const evaluation = {
              scorePercentage,
              conceptualDepth: scorePercentage >= 80 ? 4 : 3,
              practicalApplication: scorePercentage >= 75 ? 4 : 3,
              overallScore,
              identifiedGaps: [
                `Formal mathematical bounds and derivation nuances for ${session.topicName}`,
                `Edge case handling under non-stationary or high-skew feature distributions`,
              ],
              retentionTips: [
                `Work through a paper-and-pencil derivation of the primary objective functions in ${session.topicName}`,
                `Implement a minimal toy benchmark from scratch to test degradation thresholds`,
                `Schedule a follow-up active recall in 4-6 days to reinforce memory consolidation`,
              ],
              strengths: `Demonstrated clear practical intuition and solid grasp of core architectural trade-offs for ${session.topicName}.`,
              areasForImprovement: `Solidify mathematical mechanics and explicit failure mode telemetry mitigations.`,
              keyTakeaway: `${session.topicName} relies on core mathematical invariants that must be validated in production deployment.`,
            };

            const nowIso = new Date().toISOString();
            session.status = 'completed';
            session.evaluation = evaluation;
            session.completedAt = nowIso;

            const topic = userTopics[session.topicId];
            if (topic) {
              topic.lastRecallAt = nowIso;
              topic.lastRecallScore = overallScore;
              if (!topic.recallHistory) topic.recallHistory = [];
              topic.recallHistory.push({
                sessionId,
                timestamp: nowIso,
                score: overallScore,
                feedbackSummary: evaluation.keyTakeaway,
              });

              const elapsedDays = 0.1;
              const T_decay = +(1.0 - Math.exp(-0.1 * elapsedDays)).toFixed(3);
              const A_signal = +(topic.effectiveAiAssistanceWeight || 0.5).toFixed(3);
              const H_weakness = +((5.0 - overallScore) / 4.0).toFixed(3);
              const M_freq = +(1.0 + 0.05 * Math.min(Math.max(0, (topic.journalOccurrences || 1) - 1), 6)).toFixed(3);
              topic.currentPriorityScore = Math.round(Math.min(100, Math.max(0, (0.4 * T_decay + 0.35 * A_signal + 0.25 * H_weakness) * M_freq * 100)) * 10) / 10;
              topic.explanationReason = `T(t)=${T_decay} | A(t)=${A_signal} | H(t)=${H_weakness} | M(t)=${M_freq}`;
            }

            res.end(JSON.stringify({
              status: 'ok',
              session,
              evaluation,
              updatedTopic: topic || null,
            }));
            return;
          }
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
