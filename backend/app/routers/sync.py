from datetime import datetime

from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.database import from_iso, to_iso, utc_now
from app.deps import get_current_user, get_db
from app.models import Task, User
from app.schemas import SyncRequest, SyncResponse, TaskPayload

router = APIRouter(prefix="/sync", tags=["sync"])

EPOCH = datetime.fromtimestamp(0)


def _to_payload(task: Task) -> TaskPayload:
    return TaskPayload(
        id=task.id,
        name=task.name,
        tag=task.tag,
        completed=task.completed,
        created_at=to_iso(task.created_at),
        updated_at=to_iso(task.updated_at),
        completed_at=to_iso(task.completed_at),
        deleted_at=to_iso(task.deleted_at),
    )


def _apply_upsert(session: Session, user: User, item) -> None:
    client_updated = from_iso(item.updated_at) or utc_now()
    client_created = from_iso(item.created_at)
    existing = session.get(Task, item.id)

    if existing is None or existing.user_id != user.id:
        if existing is not None and existing.user_id != user.id:
            return
        if from_iso(item.deleted_at) is not None:
            return
        task = Task(
            id=item.id,
            user_id=user.id,
            name=item.name,
            tag=item.tag or "",
            completed=item.completed,
            created_at=client_created or client_updated,
            updated_at=client_updated,
            completed_at=from_iso(item.completed_at),
            deleted_at=from_iso(item.deleted_at),
        )
        session.add(task)
        return

    if client_updated > existing.updated_at:
        existing.name = item.name
        existing.tag = item.tag or ""
        existing.completed = item.completed
        existing.updated_at = client_updated
        existing.completed_at = from_iso(item.completed_at)
        existing.deleted_at = from_iso(item.deleted_at)
        session.add(existing)


def _apply_delete(session: Session, user: User, item) -> None:
    client_updated = from_iso(item.updated_at) or utc_now()
    existing = session.get(Task, item.id)
    if existing is None or existing.user_id != user.id:
        return
    if existing.deleted_at is not None:
        return
    if client_updated > existing.updated_at:
        existing.deleted_at = utc_now()
        existing.updated_at = client_updated
        session.add(existing)


@router.post("", response_model=SyncResponse)
def sync(
    body: SyncRequest,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> SyncResponse:
    last_sync_at = from_iso(body.last_sync_at) or EPOCH

    for item in body.upserts:
        _apply_upsert(session, user, item)
    for item in body.deletes:
        _apply_delete(session, user, item)
    session.commit()

    changed = session.exec(
        select(Task)
        .where(Task.user_id == user.id, Task.updated_at > last_sync_at)
        .order_by(Task.updated_at)
    ).all()

    return SyncResponse(
        server_time=to_iso(utc_now()),
        tasks=[_to_payload(t) for t in changed],
    )
