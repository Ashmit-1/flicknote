import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.database import to_iso, utc_now
from app.deps import get_current_user, get_db
from app.models import Task, User
from app.schemas import TaskCreate, TaskPayload, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["tasks"])


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


def _get_owned_task(session: Session, user: User, task_id: str) -> Task:
    task = session.get(Task, task_id)
    if task is None or task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("", response_model=list[TaskPayload])
def list_tasks(
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> list[TaskPayload]:
    tasks = session.exec(
        select(Task)
        .where(Task.user_id == user.id, Task.deleted_at.is_(None))
        .order_by(Task.created_at)
    ).all()
    return [_to_payload(t) for t in tasks]


@router.post("", response_model=TaskPayload, status_code=status.HTTP_201_CREATED)
def create_task(
    body: TaskCreate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskPayload:
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Task name cannot be empty")
    now = utc_now()
    task = Task(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=name,
        tag=body.tag.strip(),
        created_at=now,
        updated_at=now,
    )
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_payload(task)


@router.patch("/{task_id}", response_model=TaskPayload)
def update_task(
    task_id: str,
    body: TaskUpdate,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> TaskPayload:
    task = _get_owned_task(session, user, task_id)
    if task.deleted_at is not None:
        raise HTTPException(status_code=404, detail="Task not found")
    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Task name cannot be empty")
        task.name = name
    if body.tag is not None:
        task.tag = body.tag.strip()
    if body.completed is not None:
        if body.completed and not task.completed:
            task.completed_at = utc_now()
        elif not body.completed:
            task.completed_at = None
        task.completed = body.completed
    task.updated_at = utc_now()
    session.add(task)
    session.commit()
    session.refresh(task)
    return _to_payload(task)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    session: Session = Depends(get_db),
    user: User = Depends(get_current_user),
) -> None:
    task = _get_owned_task(session, user, task_id)
    task.deleted_at = utc_now()
    task.updated_at = utc_now()
    session.add(task)
    session.commit()
