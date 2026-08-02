from datetime import datetime
from typing import Optional

from sqlalchemy import Column, String
from sqlmodel import Field, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True)
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class AuthToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token_hash: str = Field(index=True, unique=True)
    user_id: int = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())


class Task(SQLModel, table=True):
    id: str = Field(default=None, sa_column=Column(String, primary_key=True))
    user_id: int = Field(index=True)
    name: str
    tag: str = Field(default="")
    completed: bool = Field(default=False)
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None
