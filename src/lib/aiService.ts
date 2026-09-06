/**
 * CARE - Gemini AI Concept Extraction & Co-Thinking Partner Service
 * Handles live AI concept extraction and dynamic Socratic peer feedback
 * tailored specifically to the user's active editor document.
 */

import { ExtractedConcept } from '../types';
import { auth } from './firebase';
import { getDescriptiveFragileSubconcept } from './retentionFragility';

export interface ConceptExtractionResult {
  concepts: ExtractedConcept[];
  synthesizedTitle?: string;
  summary?: string;
}

export interface CoThinkingChatResult {
  assistantMessage: string;
  mathBlock?: string;
  recommendation?: string;
  dynamicQuickPrompts: string[];
  modelLatency: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const currentUser = auth.currentUser;
  if (currentUser) {
    try {
      const token = await currentUser.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch {
      // Proceed without auth header if token fetch fails
    }
  }

  return headers;
}

/**
 * Intelligent Local Fallback Concept Extractor
 * Parses actual title and markdown/latex body text to extract real technical terms,
 * equations, headings, and acronyms.
 */
export function extractConceptsLocally(title: string, body: string): ConceptExtractionResult {
  const combined = `${title}\n${body}`.trim();
  if (!combined) {
    return {
      concepts: [],
      synthesizedTitle: '',
      summary: '',
    };
  }
  const conceptsMap = new Map<string, ExtractedConcept>();

  // 1. Math Formula Extraction
  const mathMatches = combined.match(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g);
  if (mathMatches && mathMatches.length > 0) {
    const rawMath = mathMatches[0].replace(/\$/g, '').trim();
    if (rawMath.length > 3) {
      const name = rawMath.includes('\\text')
        ? rawMath.replace(/.*\\text\{([^}]+)\}.*/, '$1').trim()
        : 'Mathematical Invariant';
      
      const topicId = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32);
      conceptsMap.set(topicId, {
        topicId: topicId || 'math_invariant',
        canonicalName: name.length > 2 ? name : 'Mathematical Formulation',
        category: 'Statistics & Probability',
        importanceScore: 0.90,
        contextSummary: `Derived from formula: ${rawMath.slice(0, 60)}...`,
      });
    }
  }

  // 2. Known Technical Domain Keywords
  const domainPatterns: Array<{
    keywords: string[];
    name: string;
    category: string;
    score: number;
  }> = [
    { keywords: ['gqa', 'grouped-query', 'grouped query'], name: 'Grouped-Query Attention (GQA)', category: 'Deep Learning', score: 0.95 },
    { keywords: ['mha', 'multi-head attention', 'multihead'], name: 'Multi-Head Attention (MHA)', category: 'Deep Learning', score: 0.90 },
    { keywords: ['kv-cache', 'kv cache', 'key-value cache'], name: 'KV-Cache Memory Optimization', category: 'Deep Learning', score: 0.92 },
    { keywords: ['triton', 'kernel', 'sram', 'cuda'], name: 'Triton & CUDA Kernel Mechanics', category: 'Deep Learning', score: 0.88 },
    { keywords: ['lora', 'low-rank', 'rank adaptation', 'peft'], name: 'Low-Rank Adaptation (LoRA)', category: 'Deep Learning', score: 0.93 },
    { keywords: ['rope', 'rotary', 'positional embedding'], name: 'Rotary Positional Embeddings (RoPE)', category: 'Deep Learning', score: 0.91 },
    { keywords: ['xgboost', 'gradient boosting', 'gbm', 'lightgbm'], name: 'Gradient Boosted Decision Trees', category: 'Classical ML', score: 0.89 },
    { keywords: ['cross-validation', 'kfold', 'k-fold', 'stratified'], name: 'Stratified Cross-Validation', category: 'Classical ML', score: 0.82 },
    { keywords: ['bayes', 'prior', 'posterior', 'mcmc', 'beta-binomial'], name: 'Bayesian Inference & Priors', category: 'Statistics & Probability', score: 0.87 },
    { keywords: ['kde', 'kernel density', 'non-parametric'], name: 'Kernel Density Estimation (KDE)', category: 'Statistics & Probability', score: 0.84 },
    { keywords: ['gin', 'postgres', 'jsonb', 'index', 'query planner'], name: 'Database Query Planner & Indexing', category: 'Data Infrastructure', score: 0.86 },
    { keywords: ['redis', 'streams', 'cache', 'invalidation', 'tombstone'], name: 'Distributed Caching & Invalidation', category: 'Data Infrastructure', score: 0.85 },
    { keywords: ['ray', 'actor', 'placement group', 'autoscale'], name: 'Ray Distributed Computing', category: 'MLOps & Infrastructure', score: 0.83 },
    { keywords: ['drift', 'covariate shift', 'mmd', 'data drift'], name: 'Covariate Shift & Data Drift', category: 'MLOps & Infrastructure', score: 0.88 },
    { keywords: ['feature store', 'feast', 'point-in-time', 'as-of join'], name: 'Point-In-Time Feature Joins', category: 'Data Infrastructure', score: 0.84 },
    { keywords: ['quantization', 'fp8', 'int8', 'awq', 'gptq'], name: 'Quantization Aware Training & FP8', category: 'Deep Learning', score: 0.90 },
  ];

  const lowerText = combined.toLowerCase();
  for (const item of domainPatterns) {
    if (item.keywords.some((kw) => lowerText.includes(kw))) {
      const topicId = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32);
      if (!conceptsMap.has(topicId)) {
        conceptsMap.set(topicId, {
          topicId,
          canonicalName: item.name,
          category: item.category,
          importanceScore: item.score,
          contextSummary: `Extracted from text context in "${title || 'Journal Entry'}"`,
        });
      }
    }
  }

  // 3. Extract Capitalized Technical Phrases & Acronyms
  const acronymMatches = combined.match(/\b[A-Z]{2,8}\b/g);
  if (acronymMatches) {
    const uniqueAcronyms = Array.from(new Set(acronymMatches)).filter(
      (a) => !['AI', 'UTC', 'PR', 'ID', 'US', 'GB', 'TB', 'VS', 'AST', 'CARE', 'URL'].includes(a)
    );

    for (const acr of uniqueAcronyms.slice(0, 3)) {
      const topicId = acr.toLowerCase() + '_concept';
      if (!conceptsMap.has(topicId)) {
        conceptsMap.set(topicId, {
          topicId,
          canonicalName: `${acr} Architecture & Mechanics`,
          category: 'Deep Learning',
          importanceScore: 0.80,
          contextSummary: `Extracted acronym ${acr} from journal editor text.`,
        });
      }
    }
  }

  // 4. Fallback if no specific match
  if (conceptsMap.size === 0) {
    const cleanTitle = title.trim();
    if (cleanTitle) {
      const topicId = cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 32) || 'ds_note';
      conceptsMap.set(topicId, {
        topicId,
        canonicalName: cleanTitle,
        category: 'Classical ML',
        importanceScore: 0.75,
        contextSummary: 'Primary concept derived from document title.',
      });
    } else if (body.trim()) {
      const firstLine = body.trim().split('\n')[0].slice(0, 35).trim();
      if (firstLine) {
        conceptsMap.set('notes_concept', {
          topicId: 'notes_concept',
          canonicalName: firstLine,
          category: 'Classical ML',
          importanceScore: 0.70,
          contextSummary: 'Derived from note content.',
        });
      }
    }
  }

  const concepts = Array.from(conceptsMap.values()).slice(0, 5);

  // Synthesize Title
  let synthesizedTitle = title;
  if (!title.trim() || title.toLowerCase().includes('untitled')) {
    if (concepts.length > 0) {
      synthesizedTitle = `Analysis & Implementation of ${concepts[0].canonicalName}`;
    } else if (body.trim()) {
      synthesizedTitle = 'Architectural Synthesis & Data Science Notes';
    } else {
      synthesizedTitle = '';
    }
  }

  return {
    concepts,
    synthesizedTitle,
    summary: body.trim().slice(0, 180) + (body.length > 180 ? '...' : ''),
  };
}

/**
 * Dynamic Co-Thinking Partner Response Generator (Fallback)
 * Generates tailored Socratic peer feedback strictly based on editor text.
 */
export function generateCoThinkingFallback(
  title: string,
  body: string,
  message?: string
): CoThinkingChatResult {
  const extraction = extractConceptsLocally(title, body);
  const primaryConcept = extraction.concepts[0]?.canonicalName || title.trim() || 'your technical notes';
  const category = extraction.concepts[0]?.category || 'Data Science & Machine Learning';
  const fragility = getDescriptiveFragileSubconcept(primaryConcept, category);

  const userQuery = (message || '').trim().toLowerCase();

  let assistantMessage = '';
  let mathBlock: string | undefined = undefined;
  let recommendation: string | undefined = undefined;

  if (!title.trim() && !body.trim()) {
    assistantMessage = `Your canvas is currently blank. Start writing your engineering decisions, model architectures, or research notes, and I'll analyze technical invariants and probe for fragile subconcepts.`;
    recommendation = `You can also load a template from the top-right dropdown menu to explore sample technical notes.`;
  } else if (!message || message === 'init') {
    assistantMessage = `I've analyzed your notes on **${primaryConcept}** (${category}).\n\n⚠️ **Fragile Nuance Detected**: ${fragility.fragileSubconcept}\n\n🚨 **Cognitive Loss Risk**: ${fragility.cognitiveLossRisk}`;
    recommendation = `Verify that your implementation explicitly handles invariant constraints and edge conditions to guard against memory decay.`;
  } else if (userQuery.includes('gap') || userQuery.includes('blindspot') || userQuery.includes('coach') || userQuery.includes('fragile')) {
    assistantMessage = `In analyzing your notes on **${primaryConcept}**, a critical technical blindspot often emerges regarding **${fragility.fragileSubconcept}**.\n\nWithout explicit active recall, engineering teams suffer from: *${fragility.cognitiveLossRisk}*.\n\nLet's test this: what happens to your computational state or loss function when boundary inputs hit this invariant?`;
    mathBlock = `\\text{Loss Risk: } \\mathbb{E}_{x \\sim \\mathcal{D}}[\\text{Fragile}(x)] \\implies ${fragility.fragileSubconcept.slice(0, 45)}...`;
    recommendation = `Run targeted unit tests or derive the boundary proof manually to solidify retention of this invariant.`;
  } else if (userQuery.includes('summarize') || userQuery.includes('trade-off')) {
    assistantMessage = `Summary of core architectural trade-offs in **${primaryConcept}**:\n• **Key Fragile Nuance**: ${fragility.fragileSubconcept}\n• **Memory & Execution Trade-off**: Balancing representational capacity and computational efficiency against cognitive complexity.\n• **Decay Prevention**: Frequent active derivation prevents silent reliance on Copilot/LLM autocompletions.`;
    mathBlock = `\\text{Retention State: } S(t) = S_0 \\cdot e^{-\\lambda t} \\quad \\text{where } \\lambda = f(\\text{Fragility}, \\text{AI Assistance})`;
    recommendation = `Document explicit assumptions in your code comments so future maintainers understand the exact mathematical invariants.`;
  } else {
    assistantMessage = `Regarding "${message}": in the context of **${primaryConcept}**, safeguarding against **${fragility.fragileSubconcept}** is essential. Understanding the underlying algebraic and hardware constraints prevents runtime degradation and reinforces deep conceptual understanding.`;
    recommendation = `Try launching a Socratic Checkpoint drill to test your unassisted recall.`;
  }

  // Generate 3 dynamic quick-prompt chips derived from the extracted concepts
  const dynamicQuickPrompts = (!title.trim() && !body.trim())
    ? [
        '💡 Load Self-Attention Note',
        '💡 Load Postgres GIN Note',
        '💡 Load FlashAttention Note',
      ]
    : [
        `🎯 Coach Me on ${fragility.fragileSubconcept.slice(0, 24)}...`,
        `📋 Summarize Trade-offs for ${primaryConcept.slice(0, 22)}`,
        `🧠 Probe Loss Risk in ${primaryConcept.slice(0, 22)}`,
      ];

  return {
    assistantMessage,
    mathBlock,
    recommendation,
    dynamicQuickPrompts,
    modelLatency: '45ms',
  };
}

export const aiService = {
  /**
   * Calls server-side Gemini endpoint to extract concepts from editor text.
   */
  async extractConcepts(title: string, body: string): Promise<ConceptExtractionResult> {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/extract-concepts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, body }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.concepts && Array.isArray(data.concepts) && data.concepts.length > 0) {
          return {
            concepts: data.concepts,
            synthesizedTitle: data.synthesizedTitle || title,
            summary: data.summary,
          };
        }
      }
    } catch (e) {
      console.warn('[AI SERVICE] Remote concept extraction fallback:', e);
    }

    return extractConceptsLocally(title, body);
  },

  /**
   * Calls server-side Gemini endpoint for Co-Thinking Partner chat.
   */
  async cothinkingChat(params: {
    title: string;
    body: string;
    message?: string;
    history?: Array<{ role: 'user' | 'assistant'; message: string }>;
  }): Promise<CoThinkingChatResult> {
    const startTime = performance.now();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/ai/cothinking-chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (res.ok) {
        const data = await res.json();
        const elapsed = Math.round(performance.now() - startTime);
        if (data.assistantMessage) {
          return {
            assistantMessage: data.assistantMessage,
            mathBlock: data.mathBlock || undefined,
            recommendation: data.recommendation || undefined,
            dynamicQuickPrompts: data.dynamicQuickPrompts || [
              `🎯 Coach Me on Gaps in ${params.title.slice(0, 20) || 'Notes'}`,
              '📋 Summarize Key Concepts',
              '🧠 Probe Edge Cases',
            ],
            modelLatency: data.modelLatency || `${elapsed}ms`,
          };
        }
      }
    } catch (e) {
      console.warn('[AI SERVICE] Remote Co-Thinking partner chat fallback:', e);
    }

    const elapsedFallback = Math.round(performance.now() - startTime);
    const fallback = generateCoThinkingFallback(params.title, params.body, params.message);
    fallback.modelLatency = `${Math.max(16, elapsedFallback)}ms`;
    return fallback;
  },
};
