"""
SynapseDS - Data Models and Pydantic Schemas
Mandates model.model_dump(exclude_none=True) before Firestore persistence.
"""

from typing import List, Optional, Literal, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# User Profile & Stats Schemas
# -----------------------------------------------------------------------------

class UserStats(BaseModel):
    totalJournalsLogged: int = 0
    totalRecallSessionsCompleted: int = 0
    averageRecallScore: float = 0.0
    activeTopicsCount: int = 0


class UserPreferences(BaseModel):
    dailyRecallTarget: int = 3
    preferredInterviewTone: Literal["rigorous_peer", "supportive_coach"] = "rigorous_peer"


class UserProfile(BaseModel):
    uid: str
    email: str
    displayName: Optional[str] = None
    photoURL: Optional[str] = None
    authProvider: str = "google.com"
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    updatedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    stats: UserStats = Field(default_factory=UserStats)
    preferences: UserPreferences = Field(default_factory=UserPreferences)

    def to_firestore_dict(self) -> Dict[str, Any]:
        """Ensures strict Firestore payload hygiene by excluding None values."""
        return self.model_dump(exclude_none=True)


class SyncUserRequest(BaseModel):
    displayName: Optional[str] = None
    photoURL: Optional[str] = None


class UserAuthResponse(BaseModel):
    status: str = "ok"
    user: UserProfile
    isNewUser: bool = False


# -----------------------------------------------------------------------------
# Journal & Concept Extraction Schemas
# -----------------------------------------------------------------------------

AiAssistanceLevel = Literal["none", "prompt_driven", "spec_driven", "agentic"]


class ExtractedConcept(BaseModel):
    topicId: str
    canonicalName: str
    category: str
    importanceScore: float = Field(default=0.8, ge=0.0, le=1.0)
    contextSummary: Optional[str] = None


class ExtractedConceptsResponse(BaseModel):
    title: str
    summary: str
    concepts: List[ExtractedConcept]
    detectedComplexity: Literal["foundational", "intermediate", "advanced"] = "intermediate"


class JournalEntryCreate(BaseModel):
    title: str
    rawContent: str
    aiAssistanceLevel: AiAssistanceLevel = "prompt_driven"
    aiToolUsed: Optional[str] = None
    extractedConcepts: List[ExtractedConcept] = Field(default_factory=list)


class JournalEntry(JournalEntryCreate):
    entryId: str
    userId: str
    createdAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

    def to_firestore_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True)


# -----------------------------------------------------------------------------
# Topic Retention State Schemas
# -----------------------------------------------------------------------------

class RecallHistoryItem(BaseModel):
    sessionId: str
    timestamp: str
    score: float  # 1.0 - 5.0
    feedbackSummary: Optional[str] = None


class TopicRetentionState(BaseModel):
    topicId: str
    userId: str
    canonicalName: str
    category: str
    firstLoggedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    lastLoggedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    lastRecallAt: Optional[str] = None
    journalOccurrences: int = 1
    recentAiAssistanceSignals: List[AiAssistanceLevel] = Field(default_factory=list)
    effectiveAiAssistanceWeight: float = 0.5  # 0.0 (fully manual) to 1.0 (agentic)
    recallHistory: List[RecallHistoryItem] = Field(default_factory=list)
    lastRecallScore: float = 2.5  # default baseline
    currentPriorityScore: float = 50.0
    decayFactor: float = 1.0

    def to_firestore_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True)


# -----------------------------------------------------------------------------
# Recall Session & Turn Schemas
# -----------------------------------------------------------------------------

class ChatTurn(BaseModel):
    role: Literal["assistant", "user"]
    message: str
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class RecallEvaluation(BaseModel):
    conceptualDepth: int = Field(ge=1, le=5)
    practicalApplication: int = Field(ge=1, le=5)
    overallScore: float = Field(ge=1.0, le=5.0)
    strengths: str
    areasForImprovement: str
    keyTakeaway: str


class RecallSession(BaseModel):
    sessionId: str
    userId: str
    topicId: str
    topicName: str
    status: Literal["in_progress", "completed", "abandoned"] = "in_progress"
    turns: List[ChatTurn] = Field(default_factory=list)
    evaluation: Optional[RecallEvaluation] = None
    startedAt: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    completedAt: Optional[str] = None

    def to_firestore_dict(self) -> Dict[str, Any]:
        return self.model_dump(exclude_none=True)
