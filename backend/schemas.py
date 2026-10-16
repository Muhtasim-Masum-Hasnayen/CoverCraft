"""Pydantic models for the HTTP layer.

The request body is intentionally a loose JSON object: the single source of truth
for field rules is validators.normalize(), which is framework-free and unit-tested.
"""
from typing import Any

from pydantic import BaseModel


class CoverRequest(BaseModel):
    model_config = {"extra": "allow"}
    document: dict[str, Any] = {}
    institution: dict[str, Any] = {}
    submitted_to: dict[str, Any] = {}
    submitted_by: dict[str, Any] = {}
    design: dict[str, Any] = {}


class HealthResponse(BaseModel):
    status: str
    version: str


class ErrorResponse(BaseModel):
    message: str
    errors: dict[str, str] = {}
