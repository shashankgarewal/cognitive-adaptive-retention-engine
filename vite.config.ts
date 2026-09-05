import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

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

        if (req.url === '/api/auth/me') {
          const authHeader = req.headers['authorization'];
          res.setHeader('Content-Type', 'application/json');
          
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.statusCode = 401;
            res.end(JSON.stringify({ detail: 'Missing or invalid Authorization header' }));
            return;
          }

          // Return successful response for verified user session
          res.end(JSON.stringify({
            status: 'ok',
            isNewUser: false,
            user: {
              uid: 'verified-session-user',
              email: 'data.scientist@care.ai',
              displayName: 'Data Science Specialist',
              authProvider: 'google.com',
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
