"""
CARE - Active Recall Interview & Evaluation Router (Slice 4)
Endpoints:
  - POST /api/recall/sessions/{sessionId}/message:
      Appends user message, queries gemini-3.8-flash Peer Knowledge Partner agent,
      appends agent follow-up question, persists session to Firestore.
  - POST /api/recall/sessions/{sessionId}/evaluate:
      Invokes gemini-3.8-flash with response_schema=RecallEvaluation to generate
      the structured scorecard (depth 0-100, gaps, retention tips).
      Updates topic's recall weakness H(t), lastRecallScore, and decay priority in Firestore
      enforcing model.model_dump(exclude_none=True).
Strictly isolated to authenticated user ID (zero cross-user leakage).
"""

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from google.cloud import firestore

from backend.dependencies.auth import verify_firebase_token, BANNED_MOCK_UIDS
from backend.dependencies.firebase_client import get_firestore_client
from backend.models.schemas import (
    RecallSession,
    ChatTurn,
    TopicRetentionState,
    RecallHistoryItem,
    RecallMessageRequest,
    RecallMessageResponse,
    RecallEvaluateResponse,
)
from backend.services.adk_interviewer import adk_interviewer
from backend.services.recall_heuristic import recall_heuristic_engine
from backend.routers.journal import _in_memory_topics
from backend.routers.recall import _in_memory_recall_sessions

logger = logging.getLogger("care.interview_router")

router = APIRouter(
    dependencies=[Depends(verify_firebase_token)],
    tags=["Active Recall & Peer Knowledge Partner"],
)


def _load_session(user_id: str, session_id: str) -> Optional[RecallSession]:
    """Retrieves session from Firestore with in-memory fallback."""
    db = get_firestore_client()
    if db:
        try:
            doc = (
                db.collection("users")
                .document(user_id)
                .collection("recall_sessions")
                .document(session_id)
                .get()
            )
            if doc.exists:
                return RecallSession(**doc.to_dict())
        except Exception as e:
            logger.warning(f"Firestore session lookup error: {e}")

    # In-memory fallback
    cached = _in_memory_recall_sessions.get(user_id, {}).get(session_id)
    if cached:
        try:
            return RecallSession(**cached)
        except Exception as err:
            logger.error(f"Error parsing in-memory session: {err}")
    return None


def _load_topic(user_id: str, topic_id: str) -> Optional[TopicRetentionState]:
    """Retrieves topic state from Firestore with in-memory fallback."""
    db = get_firestore_client()
    if db:
        try:
            doc = (
                db.collection("users")
                .document(user_id)
                .collection("topic_retention_states")
                .document(topic_id)
                .get()
            )
            if doc.exists:
                return TopicRetentionState(**doc.to_dict())
        except Exception as e:
            logger.warning(f"Firestore topic lookup error: {e}")

    # In-memory fallback
    cached = _in_memory_topics.get(user_id, {}).get(topic_id)
    if cached:
        try:
            return TopicRetentionState(**cached)
        except Exception as err:
            logger.error(f"Error parsing in-memory topic: {err}")
    return None


@router.post("/api/recall/sessions/{session_id}/message", response_model=RecallMessageResponse)
async def send_interview_message(
    session_id: str,
    payload: RecallMessageRequest,
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Submits user response in a multi-turn active recall session.
    Invokes gemini-3.8-flash to generate the next Peer Knowledge Partner follow-up question.
    Persists turns to Firestore (/users/{userId}/recall_sessions/{sessionId}).
    """
    user_id = user_claims.get("uid")
    if not user_id or not isinstance(user_id, str) or user_id.lower().strip() in BANNED_MOCK_UIDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid authenticated user required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Retrieve session
    session = _load_session(user_id, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recall session '{session_id}' not found.",
        )

    if session.userId != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot access sessions belonging to another user.",
        )

    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This recall session has already been evaluated and completed.",
        )

    # 2. Retrieve topic
    topic = _load_topic(user_id, session.topicId)
    if not topic:
        # Construct graceful fallback topic representation
        topic = TopicRetentionState(
            topicId=session.topicId,
            userId=user_id,
            canonicalName=session.topicName,
            category="Data Science",
        )

    now_iso = datetime.utcnow().isoformat()
    is_first_turn = len(session.turns) == 0

    # 3. If user provided a message, append it to turns
    clean_user_message = payload.message.strip() if payload.message else None
    if clean_user_message:
        user_turn = ChatTurn(
            role="user",
            message=clean_user_message,
            timestamp=now_iso,
        )
        session.turns.append(user_turn)

    # 4. Generate next assistant Peer Knowledge Partner turn
    assistant_turn = await adk_interviewer.generate_next_turn(
        topic=topic,
        session=session,
        user_message=clean_user_message,
    )
    session.turns.append(assistant_turn)

    # 5. Persist updated session to Firestore
    db = get_firestore_client()
    session_data = session.to_firestore_dict()
    if db:
        try:
            db.collection("users").document(user_id).collection("recall_sessions").document(session_id).set(session_data)
        except Exception as e:
            logger.error(f"Firestore session update failed: {e}")

    # In-memory sync
    if user_id not in _in_memory_recall_sessions:
        _in_memory_recall_sessions[user_id] = {}
    _in_memory_recall_sessions[user_id][session_id] = session.model_dump()

    return RecallMessageResponse(
        status="ok",
        session=session,
        turn=assistant_turn,
        isFirstTurn=is_first_turn,
    )


@router.post("/api/recall/sessions/{session_id}/evaluate", response_model=RecallEvaluateResponse)
async def evaluate_interview_session(
    session_id: str,
    user_claims: dict = Depends(verify_firebase_token),
):
    """
    Evaluates completed active recall session turns with gemini-3.8-flash using response_schema=RecallEvaluation.
    Calculates conceptual depth score (0-100), identified gaps, and retention recommendations.
    Updates the topic's recall weakness H(t), lastRecallScore, and decay priority in Firestore
    enforcing model.model_dump(exclude_none=True).
    """
    user_id = user_claims.get("uid")
    if not user_id or not isinstance(user_id, str) or user_id.lower().strip() in BANNED_MOCK_UIDS:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unauthorized: Valid authenticated user required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 1. Retrieve session
    session = _load_session(user_id, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recall session '{session_id}' not found.",
        )

    if session.userId != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Cannot evaluate session belonging to another user.",
        )

    # 2. Retrieve topic
    topic = _load_topic(user_id, session.topicId)
    if not topic:
        topic = TopicRetentionState(
            topicId=session.topicId,
            userId=user_id,
            canonicalName=session.topicName,
            category="Data Science",
        )

    # 3. Evaluate session using gemini-3.8-flash structured output
    evaluation = await adk_interviewer.evaluate_session(topic=topic, session=session)

    # 4. Mark session completed
    now_iso = datetime.utcnow().isoformat()
    session.status = "completed"
    session.evaluation = evaluation
    session.completedAt = now_iso

    # 5. Update Topic Retention State with new performance signal H(t)
    topic.lastRecallAt = now_iso
    topic.lastRecallScore = evaluation.overallScore

    # Append to recall history
    topic.recallHistory.append(
        RecallHistoryItem(
            sessionId=session.sessionId,
            timestamp=now_iso,
            score=evaluation.overallScore,
            feedbackSummary=evaluation.keyTakeaway,
        )
    )

    # Re-evaluate decay priority using CARE formula
    breakdown = recall_heuristic_engine.evaluate_breakdown(topic)
    topic.currentPriorityScore = breakdown["priorityScore"]
    topic.explanationReason = breakdown["explanationReason"]

    # 6. Persist session and topic updates to Firestore with strict hygiene
    db = get_firestore_client()
    session_data = session.to_firestore_dict()
    topic_data = topic.to_firestore_dict()

    if db:
        try:
            batch = db.batch()
            session_ref = db.collection("users").document(user_id).collection("recall_sessions").document(session_id)
            topic_ref = db.collection("users").document(user_id).collection("topic_retention_states").document(topic.topicId)
            batch.set(session_ref, session_data)
            batch.set(topic_ref, topic_data)

            # Also update user profile stats
            user_ref = db.collection("users").document(user_id)
            user_doc = user_ref.get()
            if user_doc.exists:
                u_data = user_doc.to_dict() or {}
                stats = u_data.get("stats", {})
                completed_count = stats.get("totalRecallSessionsCompleted", 0) + 1
                stats["totalRecallSessionsCompleted"] = completed_count
                # Rolling average score
                current_avg = stats.get("averageRecallScore", 0.0)
                new_avg = round(((current_avg * (completed_count - 1)) + evaluation.overallScore) / completed_count, 2)
                stats["averageRecallScore"] = new_avg
                batch.update(user_ref, {"stats": stats, "updatedAt": now_iso})

            batch.commit()
        except Exception as e:
            logger.error(f"Firestore batch update failed during session evaluation: {e}")

    # In-memory cache update
    if user_id not in _in_memory_recall_sessions:
        _in_memory_recall_sessions[user_id] = {}
    _in_memory_recall_sessions[user_id][session_id] = session.model_dump()

    if user_id not in _in_memory_topics:
        _in_memory_topics[user_id] = {}
    _in_memory_topics[user_id][topic.topicId] = topic.model_dump()

    return RecallEvaluateResponse(
        status="ok",
        session=session,
        evaluation=evaluation,
        updatedTopic=topic,
    )
