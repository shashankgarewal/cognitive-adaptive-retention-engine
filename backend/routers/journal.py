"""
CARE - Journal Ingestion & Concept Extraction Router
Handles Data Science work journal entries, extracts canonical concepts via Gemini 3.8 Flash,
updates cognitive retention priority states, and persists to Firestore under /users/{userId}.
"""

import uuid
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore

from backend.dependencies.auth import verify_firebase_token
from backend.dependencies.firebase_client import get_firestore_client
from backend.models.schemas import (
    JournalEntryCreate,
    JournalEntry,
    ExtractedConcept,
    TopicRetentionState,
    JournalIngestionResponse,
    JournalListResponse,
    TopicsListResponse,
    AiAssistanceLevel,
)
from backend.services.gemini_service import gemini_service
from backend.services.recall_heuristic import (
    recall_heuristic_engine,
    AI_ASSISTANCE_WEIGHTS,
)

logger = logging.getLogger("care.journal_router")

router = APIRouter(tags=["Journal & Topics"])

# In-memory storage fallback for local dev when Firestore credentials are not configured
_in_memory_journals: Dict[str, List[Dict[str, Any]]] = {}
_in_memory_topics: Dict[str, Dict[str, Dict[str, Any]]] = {}


def sanitize_topic_id(raw_id: str, canonical_name: str) -> str:
    """Produces a clean alphanumeric Firestore document ID."""
    clean = raw_id.strip() if raw_id else canonical_name.strip()
    sanitized = "".join(c if c.isalnum() or c in ("_", "-") else "_" for c in clean.lower())
    return sanitized.strip("_")[:64] or f"topic_{uuid.uuid4().hex[:8]}"


@router.post("/api/journal/entries", response_model=JournalIngestionResponse)
async def create_journal_entry(
    payload: JournalEntryCreate,
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Ingests a Data Science work journal entry.
    Asynchronously extracts canonical concepts with Gemini 3.8 Flash (response_schema).
    Updates recall priority scores with decay heuristics.
    Persists journal entries and topic retention states in user-isolated Firestore collections.
    """
    user_id = user_claims.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user UID missing from token claims.",
        )

    # Defensive input validation
    title = payload.title.strip()
    raw_content = payload.rawContent.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal entry title cannot be empty.",
        )
    if not raw_content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Journal entry content cannot be empty.",
        )

    entry_id = f"entry_{uuid.uuid4().hex[:12]}"
    created_at = datetime.utcnow().isoformat()

    # Step 1: Extract concepts asynchronously using Gemini 3.8 Flash structured response_schema
    try:
        extraction_result = await gemini_service.extract_concepts_from_journal(
            title=title,
            content=raw_content,
            ai_assistance_level=payload.aiAssistanceLevel,
            ai_tool_used=payload.aiToolUsed,
        )
    except Exception as e:
        logger.error(f"Error during concept extraction: {e}")
        # Fallback to local deterministic extraction
        extraction_result = gemini_service._fallback_extract_concepts(
            title, raw_content, payload.aiAssistanceLevel
        )

    # Step 2: Construct validated JournalEntry
    journal_entry = JournalEntry(
        entryId=entry_id,
        userId=user_id,
        title=title,
        rawContent=raw_content,
        aiAssistanceLevel=payload.aiAssistanceLevel,
        aiToolUsed=payload.aiToolUsed,
        extractedConcepts=extraction_result.concepts,
        createdAt=created_at,
    )

    db = get_firestore_client()
    updated_topic_states: List[TopicRetentionState] = []

    # Step 3: Firestore persistence with strict payload hygiene
    if db is not None:
        try:
            # 3a. Save journal entry to /users/{userId}/journal_entries/{entryId}
            entry_doc_ref = (
                db.collection("users")
                .document(user_id)
                .collection("journal_entries")
                .document(entry_id)
            )
            # Strict hygiene: to_firestore_dict excludes all None values
            entry_doc_ref.set(journal_entry.to_firestore_dict())

            # 3b. Update or create TopicRetentionState for each extracted concept
            topics_col_ref = (
                db.collection("users")
                .document(user_id)
                .collection("topic_retention_states")
            )

            for concept in extraction_result.concepts:
                topic_id = sanitize_topic_id(concept.topicId, concept.canonicalName)
                topic_doc_ref = topics_col_ref.document(topic_id)
                topic_doc = topic_doc_ref.get()

                if topic_doc.exists:
                    # Existing topic: update retention telemetry
                    data = topic_doc.to_dict() or {}
                    existing_occurrences = data.get("journalOccurrences", 1) + 1
                    existing_signals: List[AiAssistanceLevel] = data.get("recentAiAssistanceSignals", [])
                    updated_signals = (existing_signals + [payload.aiAssistanceLevel])[-10:]

                    # Recalculate AI assistance weight
                    signal_weights = [AI_ASSISTANCE_WEIGHTS.get(sig, 0.5) for sig in updated_signals]
                    avg_ai_weight = sum(signal_weights) / max(len(signal_weights), 1)

                    topic_state = TopicRetentionState(
                        topicId=topic_id,
                        userId=user_id,
                        canonicalName=data.get("canonicalName", concept.canonicalName),
                        category=data.get("category", concept.category),
                        firstLoggedAt=data.get("firstLoggedAt", created_at),
                        lastLoggedAt=created_at,
                        lastRecallAt=data.get("lastRecallAt"),
                        journalOccurrences=existing_occurrences,
                        recentAiAssistanceSignals=updated_signals,
                        effectiveAiAssistanceWeight=round(avg_ai_weight, 2),
                        recallHistory=data.get("recallHistory", []),
                        lastRecallScore=data.get("lastRecallScore", 2.5),
                        currentPriorityScore=data.get("currentPriorityScore", 50.0),
                        decayFactor=data.get("decayFactor", 1.0),
                    )
                else:
                    # New topic: initialize first baseline retention state
                    initial_weight = AI_ASSISTANCE_WEIGHTS.get(payload.aiAssistanceLevel, 0.5)
                    topic_state = TopicRetentionState(
                        topicId=topic_id,
                        userId=user_id,
                        canonicalName=concept.canonicalName,
                        category=concept.category,
                        firstLoggedAt=created_at,
                        lastLoggedAt=created_at,
                        lastRecallAt=None,
                        journalOccurrences=1,
                        recentAiAssistanceSignals=[payload.aiAssistanceLevel],
                        effectiveAiAssistanceWeight=initial_weight,
                        recallHistory=[],
                        lastRecallScore=2.5,
                        currentPriorityScore=50.0,
                        decayFactor=1.0,
                    )

                # Re-calculate priority score with CARE exponential decay formula
                new_priority, explanation = recall_heuristic_engine.calculate_priority(
                    topic_state,
                    base_importance=concept.importanceScore,
                )
                topic_state.currentPriorityScore = new_priority
                topic_state.explanationReason = explanation

                # Strict payload hygiene write
                topic_doc_ref.set(topic_state.to_firestore_dict())
                updated_topic_states.append(topic_state)

            # 3c. Increment user's totalJournalsLogged statistic
            user_doc_ref = db.collection("users").document(user_id)
            user_doc_ref.set(
                {
                    "updatedAt": created_at,
                    "stats": {"totalJournalsLogged": firestore.Increment(1)},
                },
                merge=True,
            )

        except Exception as e:
            logger.error(f"Firestore write error during journal ingestion: {e}")
            # Fall back to in-memory store so user action succeeds
            _store_in_memory(user_id, journal_entry, extraction_result.concepts, payload.aiAssistanceLevel)
            updated_topic_states = _get_in_memory_topics(user_id)
    else:
        # Development / offline in-memory storage fallback
        _store_in_memory(user_id, journal_entry, extraction_result.concepts, payload.aiAssistanceLevel)
        updated_topic_states = _get_in_memory_topics(user_id)

    return JournalIngestionResponse(
        status="ok",
        entry=journal_entry,
        summary=extraction_result.summary,
        detectedComplexity=extraction_result.detectedComplexity,
        extractedConcepts=extraction_result.concepts,
        updatedTopics=updated_topic_states,
    )


@router.get("/api/journal/entries", response_model=JournalListResponse)
async def get_journal_entries(
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Retrieves the user's journal entries from /users/{userId}/journal_entries.
    Strictly isolated to request.auth.uid.
    """
    user_id = user_claims.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User claims missing UID.",
        )

    db = get_firestore_client()
    entries: List[JournalEntry] = []

    if db is not None:
        try:
            entries_ref = (
                db.collection("users")
                .document(user_id)
                .collection("journal_entries")
            )
            docs = entries_ref.stream()
            for doc in docs:
                data = doc.to_dict()
                if data:
                    try:
                        entries.append(JournalEntry(**data))
                    except Exception as parse_err:
                        logger.warning(f"Error parsing journal entry {doc.id}: {parse_err}")

            # Sort by createdAt descending
            entries.sort(key=lambda e: e.createdAt, reverse=True)
        except Exception as e:
            logger.error(f"Error fetching journal entries from Firestore: {e}")
            # Fall back to in-memory
            for d in _in_memory_journals.get(user_id, []):
                entries.append(JournalEntry(**d))
            entries.sort(key=lambda e: e.createdAt, reverse=True)
    else:
        for d in _in_memory_journals.get(user_id, []):
            entries.append(JournalEntry(**d))
        entries.sort(key=lambda e: e.createdAt, reverse=True)

    return JournalListResponse(
        status="ok",
        entries=entries,
        total=len(entries),
    )


@router.get("/api/topics", response_model=TopicsListResponse)
async def get_topics(
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Retrieves all topic retention states for the authenticated user.
    Dynamically recalculates currentPriorityScore based on elapsed decay time.
    Returns topics sorted by currentPriorityScore descending (highest priority first).
    """
    user_id = user_claims.get("uid")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User claims missing UID.",
        )

    db = get_firestore_client()
    topics: List[TopicRetentionState] = []

    if db is not None:
        try:
            topics_ref = (
                db.collection("users")
                .document(user_id)
                .collection("topic_retention_states")
            )
            docs = topics_ref.stream()
            for doc in docs:
                data = doc.to_dict()
                if data:
                    try:
                        state = TopicRetentionState(**data)
                        # Recalculate real-time priority score with current elapsed time
                        score, explanation = recall_heuristic_engine.calculate_priority(state)
                        state.currentPriorityScore = score
                        state.explanationReason = explanation
                        topics.append(state)
                    except Exception as parse_err:
                        logger.warning(f"Error parsing topic state {doc.id}: {parse_err}")
        except Exception as e:
            logger.error(f"Error fetching topics from Firestore: {e}")
            topics = _get_in_memory_topics(user_id)
    else:
        topics = _get_in_memory_topics(user_id)

    # Sort topics descending by current priority score
    topics.sort(key=lambda t: t.currentPriorityScore, reverse=True)

    return TopicsListResponse(
        status="ok",
        topics=topics,
        total=len(topics),
    )


# -----------------------------------------------------------------------------
# In-Memory Storage Helpers (Dev / Fallback)
# -----------------------------------------------------------------------------

def _store_in_memory(
    user_id: str,
    entry: JournalEntry,
    concepts: List[ExtractedConcept],
    ai_level: AiAssistanceLevel,
):
    """Safely stores entry and topics in memory when Firestore is disconnected."""
    if user_id not in _in_memory_journals:
        _in_memory_journals[user_id] = []
    _in_memory_journals[user_id].insert(0, entry.model_dump())

    if user_id not in _in_memory_topics:
        _in_memory_topics[user_id] = {}

    for concept in concepts:
        tid = sanitize_topic_id(concept.topicId, concept.canonicalName)
        existing = _in_memory_topics[user_id].get(tid)
        now_str = datetime.utcnow().isoformat()

        if existing:
            occurrences = existing.get("journalOccurrences", 1) + 1
            signals = (existing.get("recentAiAssistanceSignals", []) + [ai_level])[-10:]
            weights = [AI_ASSISTANCE_WEIGHTS.get(s, 0.5) for s in signals]
            avg_w = sum(weights) / max(len(weights), 1)

            state = TopicRetentionState(
                topicId=tid,
                userId=user_id,
                canonicalName=existing.get("canonicalName", concept.canonicalName),
                category=existing.get("category", concept.category),
                firstLoggedAt=existing.get("firstLoggedAt", now_str),
                lastLoggedAt=now_str,
                lastRecallAt=existing.get("lastRecallAt"),
                journalOccurrences=occurrences,
                recentAiAssistanceSignals=signals,
                effectiveAiAssistanceWeight=round(avg_w, 2),
                recallHistory=existing.get("recallHistory", []),
                lastRecallScore=existing.get("lastRecallScore", 2.5),
            )
        else:
            state = TopicRetentionState(
                topicId=tid,
                userId=user_id,
                canonicalName=concept.canonicalName,
                category=concept.category,
                firstLoggedAt=now_str,
                lastLoggedAt=now_str,
                lastRecallAt=None,
                journalOccurrences=1,
                recentAiAssistanceSignals=[ai_level],
                effectiveAiAssistanceWeight=AI_ASSISTANCE_WEIGHTS.get(ai_level, 0.5),
                recallHistory=[],
                lastRecallScore=2.5,
            )

        score, explanation = recall_heuristic_engine.calculate_priority(state, base_importance=concept.importanceScore)
        state.currentPriorityScore = score
        state.explanationReason = explanation
        _in_memory_topics[user_id][tid] = state.model_dump()


def _get_in_memory_topics(user_id: str) -> List[TopicRetentionState]:
    """Retrieves in-memory topics with updated priority calculation."""
    res = []
    for tid, data in _in_memory_topics.get(user_id, {}).items():
        state = TopicRetentionState(**data)
        score, explanation = recall_heuristic_engine.calculate_priority(state)
        state.currentPriorityScore = score
        state.explanationReason = explanation
        res.append(state)
    return res
