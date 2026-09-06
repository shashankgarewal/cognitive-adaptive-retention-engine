"""
CARE - Heuristic Recall Priority Engine
Implements the CARE priority decay formula:
    Priority(t) = (w1 * T(t) + w2 * A(t) + w3 * H(t)) * M(t)
where:
    T(t) = 1 - exp(-lambda * d_elapsed)
    Default weights: w1 = 0.40, w2 = 0.35, w3 = 0.25
"""

import math
from datetime import datetime
from typing import List, Optional, Tuple
from backend.models.schemas import TopicRetentionState, AiAssistanceLevel

# Default CARE Engine Mathematical Constants
DEFAULT_W1 = 0.40  # Time Decay Weight
DEFAULT_W2 = 0.35  # AI Assistance Reliance Weight
DEFAULT_W3 = 0.25  # Historical Recall Performance Gap Weight
DEFAULT_LAMBDA = 0.10  # Decay coefficient (days^-1)

# AI Assistance Level numeric mappings
AI_ASSISTANCE_WEIGHTS: dict[AiAssistanceLevel, float] = {
    "none": 0.10,          # Fully manual implementation
    "prompt_driven": 0.50, # Iterative prompting assistance
    "spec_driven": 0.80,   # High specification abstraction
    "agentic": 1.00,       # Autonomous agent generation (highest decay risk)
}


class RecallHeuristicEngine:
    def __init__(
        self,
        w1: float = DEFAULT_W1,
        w2: float = DEFAULT_W2,
        w3: float = DEFAULT_W3,
        decay_lambda: float = DEFAULT_LAMBDA,
    ):
        self.w1 = w1
        self.w2 = w2
        self.w3 = w3
        self.decay_lambda = decay_lambda

    def compute_time_factor(self, last_event_iso: str, now: Optional[datetime] = None) -> Tuple[float, float]:
        """
        Computes T(t) = 1 - exp(-lambda * d_elapsed)
        Returns (T_t, elapsed_days).
        """
        if now is None:
            now = datetime.utcnow()

        try:
            event_dt = datetime.fromisoformat(last_event_iso.replace("Z", "+00:00")).replace(tzinfo=None)
            elapsed_seconds = max(0.0, (now - event_dt).total_seconds())
            d_elapsed = elapsed_seconds / 86400.0  # convert to days
        except Exception:
            d_elapsed = 1.0  # default 1 day fallback

        T_t = 1.0 - math.exp(-self.decay_lambda * d_elapsed)
        return min(1.0, max(0.0, T_t)), d_elapsed

    def compute_ai_assistance_factor(
        self,
        signals: List[AiAssistanceLevel],
        effective_weight: float = 0.5,
    ) -> float:
        """
        Computes A(t), capturing cognitive offloading risk from AI assistance.
        """
        if not signals:
            return min(1.0, max(0.0, effective_weight))

        # Recent signals weighted average
        weights = [AI_ASSISTANCE_WEIGHTS.get(sig, 0.5) for sig in signals]
        # Most recent signal carries 50% weight, prior history carries remaining
        if len(weights) == 1:
            return weights[0]
        recent_avg = sum(weights[-3:]) / len(weights[-3:])
        return min(1.0, max(0.0, 0.6 * weights[-1] + 0.4 * recent_avg))

    def compute_history_factor(self, last_score: float, has_history: bool) -> float:
        """
        Computes H(t): Knowledge gap based on previous recall performance.
        Recall scores range from 1.0 (poor) to 5.0 (mastery).
        H(t) = (5.0 - score) / 4.0; lower score -> higher deficit factor.
        """
        if not has_history:
            # Baseline deficit for untargeted topics
            return 0.50

        clamped_score = min(5.0, max(1.0, last_score))
        return (5.0 - clamped_score) / 4.0

    def compute_multiplier(self, occurrences: int, base_importance: float = 0.8) -> float:
        """
        Computes M(t): Scale and importance multiplier.
        Compounds slightly with repetition in active work journals.
        """
        repetition_boost = 1.0 + 0.05 * min(max(0, occurrences - 1), 6)
        return max(0.5, base_importance * repetition_boost)

    def calculate_priority(
        self,
        state: TopicRetentionState,
        base_importance: float = 0.8,
        now: Optional[datetime] = None,
    ) -> Tuple[float, str]:
        """
        Executes CARE priority formula:
            Priority(t) = (w1 * T(t) + w2 * A(t) + w3 * H(t)) * M(t)
        Returns (scaled_score_0_to_100, explanation_text).
        """
        # Event timestamp: last recall took place, otherwise fallback to last journal logged
        last_event = state.lastRecallAt or state.lastLoggedAt
        T_t, elapsed_days = self.compute_time_factor(last_event, now)

        A_t = self.compute_ai_assistance_factor(
            state.recentAiAssistanceSignals,
            state.effectiveAiAssistanceWeight,
        )

        has_history = len(state.recallHistory) > 0
        H_t = self.compute_history_factor(state.lastRecallScore, has_history)

        M_t = self.compute_multiplier(state.journalOccurrences, base_importance)

        raw_priority = (self.w1 * T_t + self.w2 * A_t + self.w3 * H_t) * M_t
        scaled_priority = round(min(100.0, max(0.0, raw_priority * 100.0)), 1)

        explanation = (
            f"T(t)={T_t:.2f} ({elapsed_days:.1f}d elapsed) | "
            f"A(t)={A_t:.2f} (AI signal) | "
            f"H(t)={H_t:.2f} (recall gap) | "
            f"M(t)={M_t:.2f}"
        )

        return scaled_priority, explanation

    def evaluate_breakdown(
        self,
        state: TopicRetentionState,
        base_importance: float = 0.8,
        now: Optional[datetime] = None,
    ) -> dict:
        """
        Evaluates full mathematical decay components for Slice 3 queue and pre-session cards.
        Computes T_decay, d_elapsed_days, A_signal, H_weakness, M_freq, priorityScore,
        and human-readable rationale badge based on dominant decay drivers.
        """
        last_event = state.lastRecallAt or state.lastLoggedAt
        T_t, elapsed_days = self.compute_time_factor(last_event, now)

        A_t = self.compute_ai_assistance_factor(
            state.recentAiAssistanceSignals,
            state.effectiveAiAssistanceWeight,
        )

        has_history = len(state.recallHistory) > 0
        H_t = self.compute_history_factor(state.lastRecallScore, has_history)

        M_t = self.compute_multiplier(state.journalOccurrences, base_importance)

        raw_priority = (self.w1 * T_t + self.w2 * A_t + self.w3 * H_t) * M_t
        scaled_priority = round(min(100.0, max(0.0, raw_priority * 100.0)), 1)

        # Categorize dominant decay driver into a concise human-readable badge
        if A_t >= 0.75:
            rationale_badge = "High AI Reliance"
        elif elapsed_days >= 5.0 or T_t >= 0.40:
            rationale_badge = "Time Decay Alert"
        elif H_t >= 0.70:
            rationale_badge = "Weak Retention Signal"
        elif M_t >= 1.15:
            rationale_badge = "High Frequency Focus"
        elif scaled_priority >= 50.0:
            rationale_badge = "High Priority Decay"
        else:
            rationale_badge = "Stable Baseline"

        explanation = (
            f"T(t)={T_t:.2f} ({elapsed_days:.1f}d) | "
            f"A(t)={A_t:.2f} (AI signal) | "
            f"H(t)={H_t:.2f} (recall gap) | "
            f"M(t)={M_t:.2f}"
        )

        return {
            "priorityScore": scaled_priority,
            "T_decay": round(T_t, 3),
            "d_elapsed_days": round(elapsed_days, 1),
            "A_signal": round(A_t, 3),
            "H_weakness": round(H_t, 3),
            "M_freq": round(M_t, 3),
            "rationaleBadge": rationale_badge,
            "explanationReason": explanation,
        }


recall_heuristic_engine = RecallHeuristicEngine()
