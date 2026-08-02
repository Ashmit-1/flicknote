from typing import Optional

from sqlmodel import SQLModel


class RegisterRequest(SQLModel):
    username: str
    password: str


class LoginRequest(SQLModel):
    username: str
    password: str


class TokenResponse(SQLModel):
    token: str
    username: str


class TaskCreate(SQLModel):
    name: str
    tag: str = ""


class TaskUpdate(SQLModel):
    name: Optional[str] = None
    tag: Optional[str] = None
    completed: Optional[bool] = None


class TaskPayload(SQLModel):
    id: str
    name: str
    tag: str = ""
    completed: bool = False
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    deleted_at: Optional[str] = None


class SyncUpsert(SQLModel):
    id: str
    name: str
    tag: str = ""
    completed: bool = False
    created_at: str
    updated_at: str
    completed_at: Optional[str] = None
    deleted_at: Optional[str] = None


class SyncDelete(SQLModel):
    id: str
    updated_at: str


class SyncRequest(SQLModel):
    last_sync_at: Optional[str] = None
    upserts: list[SyncUpsert] = []
    deletes: list[SyncDelete] = []


class SyncResponse(SQLModel):
    server_time: str
    tasks: list[TaskPayload] = []
