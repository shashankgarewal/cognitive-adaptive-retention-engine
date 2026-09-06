"""
CARE - Recall Engine Router (Slice 3)
Provides:
  - GET /api/recall/queue: Evaluates all user topic retention states via recall_heuristic.py,
    returning sorted high-decay topics with breakdown math components and rationale badges.
  - GET /api/recall/topics: Searchable, paginated index of all logged user topics with category filters.
  - POST /api/recall/sessions/init: Creates an active recall session in Firestore (/users/{userId}/recall_sessions)
    for a target topic, storing initial metadata and target concept bounds.
Strictly isolates all operations to request.auth.uid (zero cross-user leakage).
"""

import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from google.cloud import firestore

from backend.dependencies.auth import verify_firebase_token, BANNED_MOCK_UIDS
from backend.dependencies.firebase_client import get_firestore_client
from backend.models.schemas import (
    RecallQueueItem,
    RecallQueueResponse,
    RecallTopicsQueryResponse,
    RecallSession,
    RecallSessionInitRequest,
    RecallSessionInitResponse,
    TopicRetentionState,
)
from backend.services.recall_heuristic import recall_heuristic_engine
from backend.services.adk_interviewer import adk_interviewer
from backend.routers.journal import _in_memory_topics

logger = logging.getLogger("care.recall_router")

router = APIRouter(
    dependencies=[Depends(verify_firebase_token)],
    tags=["Recall Engine"],
)

# In-memory storage fallback for local dev when Firestore is disconnected
_in_memory_recall_sessions: Dict[str, Dict[str, Dict[str, Any]]] = {}


def _get_topics_for_user(user_id: str) -> List[TopicRetentionState]:
    """
    Safely retrieves all topic retention states for the given user,
    querying Firestore first with in-memory fallback.
    """
    topics: List[TopicRetentionState] = []
    db = get_firestore_client()

    if db:
        try:
            docs = (
                db.collection("users")
                .document(user_id)
                .collection("topic_retention_states")
                .stream()
            )
            for doc in docs:
                data = doc.to_dict()
                if data:
                    topics.append(TopicRetentionState(**data))
            return topics
        except Exception as e:
            logger.warning(f"Firestore topic read error for user {user_id}: {e}. Checking in-memory.")

    # In-memory fallback
    user_in_mem = _in_memory_topics.get(user_id, {})
    for tid, data in user_in_mem.items():
        try:
            topics.append(TopicRetentionState(**data))
        except Exception as err:
            logger.error(f"Error parsing in-memory topic {tid}: {err}")

    return topics


@router.get("/api/recall/queue", response_model=RecallQueueResponse)
async def get_recall_queue(
    limit: int = Query(20, ge=1, le=100, description="Maximum number of topics in recall queue"),
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Evaluates all user topic retention states via the CARE priority decay formula:
        Priority(t) = (w1 * T(t) + w2 * A(t) + w3 * H(t)) * M(t)
    Returns sorted high-decay topics with breakdown math components
    (T_decay, A_signal, H_weakness, M_freq) and human-readable rationale badges.
    Strictly isolated to authenticated user ID.
    """
    user_id = user_claims.get("uid")
    if not user_id or not isinstance(user_id, str) or user_id.lower().strip() in BANNED_MOCK_UIDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid authenticated user required. Mock or guest sessions are prohibited.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    all_topics = _get_topics_for_user(user_id)
    evaluated_queue: List[RecallQueueItem] = []

    for topic in all_topics:
        breakdown = recall_heuristic_engine.evaluate_breakdown(topic)
        queue_item = RecallQueueItem(
            topicId=topic.topicId,
            canonicalName=topic.canonicalName,
            category=topic.category,
            priorityScore=breakdown["priorityScore"],
            T_decay=breakdown["T_decay"],
            d_elapsed_days=breakdown["d_elapsed_days"],
            A_signal=breakdown["A_signal"],
            H_weakness=breakdown["H_weakness"],
            M_freq=breakdown["M_freq"],
            rationaleBadge=breakdown["rationaleBadge"],
            lastLoggedAt=topic.lastLoggedAt,
            lastRecallAt=topic.lastRecallAt,
            journalOccurrences=topic.journalOccurrences,
            effectiveAiAssistanceWeight=topic.effectiveAiAssistanceWeight,
            lastRecallScore=topic.lastRecallScore,
            explanationReason=breakdown["explanationReason"],
        )
        evaluated_queue.append(queue_item)

    # Sort descending by priorityScore (highest decay / risk first)
    evaluated_queue.sort(key=lambda x: x.priorityScore, reverse=True)
    truncated_queue = evaluated_queue[:limit]

    return RecallQueueResponse(
        status="ok",
        queue=truncated_queue,
        total=len(evaluated_queue),
        generatedAt=datetime.utcnow().isoformat(),
    )


@router.get("/api/recall/topics", response_model=RecallTopicsQueryResponse)
async def query_recall_topics(
    search: Optional[str] = Query(None, description="Search term matching canonicalName or category"),
    category: Optional[str] = Query(None, description="Category filter (e.g., Deep Learning)"),
    sort_by: str = Query("priority", regex="^(priority|recency|ai_signal|alphabetical)$"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Searchable, paginated index of all logged user topics with category filters
    for manual topic selection into active recall sessions.
    """
    user_id = user_claims.get("uid")
    if not user_id or not isinstance(user_id, str) or user_id.lower().strip() in BANNED_MOCK_UIDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid authenticated user required. Mock or guest sessions are prohibited.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    all_topics = _get_topics_for_user(user_id)

    # Re-evaluate live priority for each topic
    for topic in all_topics:
        score, explanation = recall_heuristic_engine.calculate_priority(topic)
        topic.currentPriorityScore = score
        topic.explanationReason = explanation

    # Extract all distinct categories
    distinct_categories = sorted(list({t.category for t in all_topics if t.category}))

    # Filter by search
    filtered = all_topics
    if search:
        s_lower = search.strip().lower()
        filtered = [
            t for t in filtered
            if s_lower in t.canonicalName.lower() or s_lower in t.category.lower()
        ]

    # Filter by category
    if category and category.lower() != "all":
        c_lower = category.strip().lower()
        filtered = [t for t in filtered if t.category.lower() == c_lower]

    # Sort
    if sort_by == "priority":
        filtered.sort(key=lambda t: t.currentPriorityScore, reverse=True)
    elif sort_by == "recency":
        filtered.sort(key=lambda t: t.lastLoggedAt, reverse=True)
    elif sort_by == "ai_signal":
        filtered.sort(key=lambda t: t.effectiveAiAssistanceWeight, reverse=True)
    elif sort_by == "alphabetical":
        filtered.sort(key=lambda t: t.canonicalName.lower())

    total_count = len(filtered)
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    paginated = filtered[start_idx:end_idx]

    return RecallTopicsQueryResponse(
        status="ok",
        topics=paginated,
        total=total_count,
        page=page,
        limit=limit,
        categories=distinct_categories,
    )


@router.post("/api/recall/sessions/init", response_model=RecallSessionInitResponse)
async def initialize_recall_session(
    payload: RecallSessionInitRequest,
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Creates an active recall session document in Firestore (/users/{userId}/recall_sessions/{sessionId})
    for a target topic, storing initial metadata, mathematical decay bounds, and session config.
    Strictly isolated to authenticated user ID.
    """
    user_id = user_claims.get("uid")
    if not user_id or not isinstance(user_id, str) or user_id.lower().strip() in BANNED_MOCK_UIDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid authenticated user required. Mock or guest sessions are prohibited.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    topic_id = payload.topicId.strip()
    if not topic_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target topicId cannot be empty.",
        )

    # 1. Locate the target topic document
    db = get_firestore_client()
    target_topic: Optional[TopicRetentionState] = None

    if db:
        try:
            doc_ref = (
                db.collection("users")
                .document(user_id)
                .collection("topic_retention_states")
                .document(topic_id)
            )
            doc_snap = doc_ref.get()
            if doc_snap.exists:
                target_topic = TopicRetentionState(**doc_snap.to_dict())
        except Exception as e:
            logger.warning(f"Firestore topic read error during session init: {e}")

    # Fallback to in-memory lookup if not found in Firestore
    if not target_topic:
        in_mem_data = _in_memory_topics.get(user_id, {}).get(topic_id)
        if in_mem_data:
            target_topic = TopicRetentionState(**in_mem_data)

    if not target_topic:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target topic '{topic_id}' was not found in your logged knowledge base.",
        )

    # 2. Compute the current mathematical decay breakdown
    breakdown = recall_heuristic_engine.evaluate_breakdown(target_topic)
    target_topic.currentPriorityScore = breakdown["priorityScore"]
    target_topic.explanationReason = breakdown["explanationReason"]

    # 3. Create the RecallSession document
    session_id = f"session_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.utcnow().isoformat()

    new_session = RecallSession(
        sessionId=session_id,
        userId=user_id,
        topicId=target_topic.topicId,
        topicName=target_topic.canonicalName,
        status="in_progress",
        targetDepth=payload.targetDepth or "intermediate",
        customFocusArea=payload.customFocusArea.strip() if payload.customFocusArea else None,
        initialBreakdown=breakdown,
        turns=[],
        startedAt=now_iso,
        completedAt=None,
    )

    # 4. Generate EXACTLY ONE initial prompt message from the agent
    try:
        initial_turn = await adk_interviewer.generate_next_turn(
            topic=target_topic,
            session=new_session,
            user_message=None,
        )
    except Exception as e:
        logger.error(f"Error generating initial recall turn: {e}")
        fallback_msg = adk_interviewer._fallback_active_recall_turn(target_topic, new_session, None)
        initial_turn = ChatTurn(
            role="assistant",
            message=fallback_msg,
            timestamp=now_iso,
        )

    new_session.turns = [initial_turn]

    # 5. Write session to Firestore (/users/{userId}/recall_sessions/{sessionId})
    if db:
        try:
            session_ref = (
                db.collection("users")
                .document(user_id)
                .collection("recall_sessions")
                .document(session_id)
            )
            session_ref.set(new_session.to_firestore_dict())
        except Exception as e:
            logger.error(f"Firestore session write error: {e}")

    # Also store in in-memory session cache
    if user_id not in _in_memory_recall_sessions:
        _in_memory_recall_sessions[user_id] = {}
    _in_memory_recall_sessions[user_id][session_id] = new_session.model_dump()

    return RecallSessionInitResponse(
        status="ok",
        session=new_session,
        topic=target_topic,
        breakdown=breakdown,
    )
