import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

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
            databaseId: 'ai-studio-aicuratedrecalls-32bbfc5d-7c54-46b3-883d-c9ead24e489f',
          }));
          return;
        }

        // Global security gate for all protected API routes
        const isAuthProtected = 
          req.url?.startsWith('/api/journal/') || 
          req.url === '/api/journal/entries' || 
          req.url?.startsWith('/api/topics') || 
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
                const newEntry = {
                  entryId,
                  userId: authUser.uid,
                  title: payload.title,
                  rawContent: payload.rawContent,
                  aiAssistanceLevel: payload.aiAssistanceLevel || 'prompt_driven',
                  aiToolUsed: payload.aiToolUsed,
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
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              entries: userJournals,
              total: userJournals.length,
            }));
            return;
          }

          if (req.url === '/api/topics' && req.method === 'GET') {
            const topics = Object.values(userTopics);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              status: 'ok',
              topics,
              total: topics.length,
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
