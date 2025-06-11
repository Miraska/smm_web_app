"""
Base Pydantic schemas
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class BaseSchema(BaseModel):
    """Base schema with common fields"""
    
    class Config:
        orm_mode = True
        allow_population_by_field_name = True


class BaseEntitySchema(BaseSchema):
    """Base entity schema with ID and timestamps"""
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")


class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: list
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class MessageResponse(BaseModel):
    """Simple message response"""
    message: str


class StatusResponse(BaseModel):
    """Status response"""
    status: str
    details: Optional[dict] = None 