/**
 * CARE - Cognitive Fragility & Retention Loss Risk Engine
 *
 * Provides domain-aware cognitive diagnostics explaining:
 * 1. What specific subconcept, mathematical invariant, or architectural nuance AI considers fragile.
 * 2. What first-principles understanding, derivation intuition, or debugging capability the engineer risks losing
 *    due to cognitive offloading and high reliance on AI tools.
 */

export interface FragileSubconceptAnalysis {
  fragileSubconcept: string;
  cognitiveLossRisk: string;
  fullDescription: string;
}

interface DomainFragilityEntry {
  keywords: string[];
  fragileSubconcept: string;
  cognitiveLossRisk: string;
}

const DOMAIN_FRAGILITY_CATALOG: DomainFragilityEntry[] = [
  {
    keywords: ['self-attention', 'attention mechanism', 'mha', 'multi-head attention'],
    fragileSubconcept: 'Softmax scaling factor (1/√d_k) variance normalization & Q,K,V projection dimension bounds.',
    cognitiveLossRisk: 'Losing first-principles intuition for tensor broadcasting invariants, attention normalization, and numerical underflow prevention when delegating code to Copilot.',
  },
  {
    keywords: ['grouped-query', 'gqa', 'multi-query', 'mqa'],
    fragileSubconcept: 'Key-Value head sharing ratio (H_Q / H_KV) and tensor stride broadcasting alignment.',
    cognitiveLossRisk: 'Treating head dimension projections as black-box tensor reshapes, risking silent memory blowouts and degraded throughput during batching.',
  },
  {
    keywords: ['flashattention', 'flash-attention', 'sram', 'kernel fusion', 'io-awareness'],
    fragileSubconcept: 'SRAM tiling block size computation, IO-awareness roofline bounds, and online softmax normalization.',
    cognitiveLossRisk: 'Forgetting GPU memory hierarchy bottlenecks, memory-bound vs compute-bound roofline limits, and HBM memory transfer latency under automated kernel generation.',
  },
  {
    keywords: ['lora', 'peft', 'low-rank', 'rank adaptation', 'fine-tuning'],
    fragileSubconcept: 'Low-rank intrinsic dimension rank (r) vs scaling factor (α) ratio and weight matrix update projection algebra.',
    cognitiveLossRisk: 'Treating PEFT adapters as black-box fine-tuning scripts while losing mental models of rank bottlenecks and catastrophic forgetting dynamics.',
  },
  {
    keywords: ['kv cache', 'kv-cache', 'pagedattention', 'vllm'],
    fragileSubconcept: 'KV-cache token memory footprint scaling (2 × B × L × H × D) and virtual page table block allocation.',
    cognitiveLossRisk: 'Inability to debug out-of-memory serving latency spikes and continuous batching scheduling in multi-tenant LLM production infrastructure.',
  },
  {
    keywords: ['quantization', 'fp8', 'int8', 'awq', 'gptq'],
    fragileSubconcept: 'E4M3 vs E5M2 exponent range trade-offs and dynamic block scaling calibration.',
    cognitiveLossRisk: 'Losing awareness of activation outlier clipping and numeric overflow boundaries during mixed-precision inference.',
  },
  {
    keywords: ['gin', 'jsonb', 'postgres jsonb', 'postgres gin', 'indexing'],
    fragileSubconcept: 'Storage overhead and operator support trade-offs between jsonb_ops and jsonb_path_ops inverted indexes.',
    cognitiveLossRisk: 'Overlooking index amplification bloat and failing queries that silently fall back to full table sequential scans.',
  },
  {
    keywords: ['hnsw', 'pgvector', 'vector search', 'vector indexing', 'ann'],
    fragileSubconcept: 'Trade-off between efConstruction, M neighbor connectivity, and recall accuracy versus insert latency.',
    cognitiveLossRisk: 'Blindly trusting vector database defaults while silent recall degradation drops production semantic retrieval accuracy.',
  },
  {
    keywords: ['cache invalidation', 'distributed cache', 'redis', 'cache-aside', 'tombstone'],
    fragileSubconcept: 'Write-Through vs Cache-Aside lease token concurrency, TTL dogpiling locks, and tombstone propagation.',
    cognitiveLossRisk: 'Losing edge-case intuition for cache stampede thundering herds and split-brain cache inconsistency during network partitions.',
  },
  {
    keywords: ['covariate shift', 'data drift', 'mmd', 'drift detection'],
    fragileSubconcept: 'Maximum Mean Discrepancy (MMD) kernel bandwidth parameterization and two-sample statistical testing bounds.',
    cognitiveLossRisk: 'Losing the statistical rigor needed to detect silent model performance decay on shifted production feature distributions.',
  },
  {
    keywords: ['bayes', 'bayesian', 'conjugate', 'mcmc', 'priors'],
    fragileSubconcept: 'Conjugate prior algebraic derivations versus Markov Chain Monte Carlo (MCMC) convergence diagnostics (R-hat).',
    cognitiveLossRisk: 'Treating posterior distributions as library outputs without recognizing uninformative prior sensitivity and sampling bias.',
  },
  {
    keywords: ['kde', 'kernel density', 'density estimation'],
    fragileSubconcept: 'Bandwidth parameter h smoothing trade-offs and curse of dimensionality in multivariate density estimation.',
    cognitiveLossRisk: 'Losing the bias-variance trade-off intuition in non-parametric density estimation versus overfitting local noise.',
  },
  {
    keywords: ['k-fold', 'cross-validation', 'cross validation', 'cv', 'leakage'],
    fragileSubconcept: 'Temporal sequence boundary isolation, group leakage, and target distribution preservation.',
    cognitiveLossRisk: 'Subtle data leakage between train/test splits that causes artificially inflated offline validation metrics while failing under live production traffic.',
  },
  {
    keywords: ['ddp', 'distributed data parallel', 'allreduce', 'ring-allreduce'],
    fragileSubconcept: 'AllReduce ring latency, gradient bucketing overlap with backward pass, and multi-GPU collective communications.',
    cognitiveLossRisk: 'Losing understanding of inter-GPU bandwidth limits, communication overhead scaling, and multi-node synchronization deadlocks.',
  },
  {
    keywords: ['feature store', 'point-in-time', 'as-of join', 'feast'],
    fragileSubconcept: 'Point-in-time join timestamp watermarks and lookahead bias prevention.',
    cognitiveLossRisk: 'Retrospective data leakage and pipeline temporal integrity compromise when AI autonomously generates SQL join queries.',
  },
  {
    keywords: ['ray', 'actor', 'placement group', 'distributed computing'],
    fragileSubconcept: 'Object store plasma memory spillover and actor placement group scheduling latency.',
    cognitiveLossRisk: 'Debugging capabilities for distributed deadlock and memory serialization during multi-node worker crashes.',
  },
  {
    keywords: ['rope', 'rotary', 'positional embedding'],
    fragileSubconcept: 'Complex 2D rotation matrix decomposition and frequency base scaling (θ) for context extension.',
    cognitiveLossRisk: 'Mathematical intuition for relative position encoding and attention score inner-product invariances.',
  },
  {
    keywords: ['triton', 'cuda', 'warp', 'kernel mechanics'],
    fragileSubconcept: 'Block scheduling, warp divergence, and shared memory bank conflict resolution.',
    cognitiveLossRisk: 'Low-level hardware mental models when relying on compiler-generated kernels without profiling memory throughput.',
  },
  {
    keywords: ['xgboost', 'lightgbm', 'gradient boosting', 'gbdt'],
    fragileSubconcept: 'Second-order gradient (Hessian) histogram approximations and tree-pruning gain equations.',
    cognitiveLossRisk: 'Misdiagnosing learning rate decay, feature subsampling collinearity, and leaf-wise split overfitting.',
  },
];

/**
 * Generates human-readable, descriptive fragility insights explaining what is fragile
 * and what the user risks losing due to cognitive offloading.
 */
export function getDescriptiveFragileSubconcept(
  canonicalName: string,
  category?: string,
  aiRelianceWeight = 0.5,
  lastScore = 2.5,
  existingReason?: string | null
): FragileSubconceptAnalysis {
  const cleanName = (canonicalName || '').trim();
  const lowerName = cleanName.toLowerCase();
  const lowerCategory = (category || '').toLowerCase();
  const aiPct = Math.round(aiRelianceWeight * 100);

  // If existingReason is present, verify it is NOT raw mathematical parameters
  if (existingReason && !existingReason.startsWith('T(t)=') && !existingReason.includes('| A(t)=')) {
    // If it is already descriptive and comprehensive, check if it covers risk
    if (existingReason.includes('Risk') || existingReason.includes('risk') || existingReason.includes('Fragile')) {
      return {
        fragileSubconcept: existingReason.split('Risk')[0].replace(/^Fragile:\s*/i, '').trim(),
        cognitiveLossRisk: existingReason.includes('Risk') ? existingReason.substring(existingReason.indexOf('Risk')).trim() : 'Risk of losing first-principles architectural mental models.',
        fullDescription: existingReason,
      };
    }
  }

  // Look for a curated domain match
  for (const entry of DOMAIN_FRAGILITY_CATALOG) {
    if (entry.keywords.some((kw) => lowerName.includes(kw) || lowerCategory.includes(kw))) {
      return {
        fragileSubconcept: entry.fragileSubconcept,
        cognitiveLossRisk: entry.cognitiveLossRisk,
        fullDescription: `Fragile: ${entry.fragileSubconcept} Risk: ${entry.cognitiveLossRisk}`,
      };
    }
  }

  // Dynamic domain synthesis based on category & AI reliance
  let fragile = `Core algorithmic edge cases and invariant constraints in ${cleanName}.`;
  let risk = `Risk of losing architectural command, failure-mode intuition, and independent debugging capability due to ${aiPct}% AI assistance reliance.`;

  if (lowerCategory.includes('deep learning') || lowerCategory.includes('model')) {
    fragile = `Tensor shape broadcasting invariants, activation gradient flow, and numerical stability bounds in ${cleanName}.`;
    risk = `High risk of losing debugging capability for vanishing gradients, numerical underflow, and tensor rank mismatches when code is auto-generated.`;
  } else if (lowerCategory.includes('infrastructure') || lowerCategory.includes('system') || lowerCategory.includes('data')) {
    fragile = `Concurrency lock contention, serialization boundaries, and partition failure modes in ${cleanName}.`;
    risk = `Risk of losing intuition for race conditions, backpressure degradation, and silent data corruption under heavy concurrent load.`;
  } else if (lowerCategory.includes('statistic') || lowerCategory.includes('classical ml') || lowerCategory.includes('math')) {
    fragile = `Statistical hypothesis assumptions, variance trade-offs, and temporal distribution leakage in ${cleanName}.`;
    risk = `Risk of accepting AI-generated evaluation metrics without validating underlying statistical distributions or leakage boundaries.`;
  }

  return {
    fragileSubconcept: fragile,
    cognitiveLossRisk: risk,
    fullDescription: `Fragile: ${fragile} Risk: ${risk}`,
  };
}
