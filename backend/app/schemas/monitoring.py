from pydantic import BaseModel, Field


class FrontendErrorReport(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    source: str = Field(min_length=1, max_length=100)
    url: str = Field(default='', max_length=2000)
    user_agent: str = Field(default='', max_length=1000)
    stack: str = Field(default='', max_length=8000)
    component_stack: str = Field(default='', max_length=8000)
    severity: str = Field(default='error', max_length=20)
