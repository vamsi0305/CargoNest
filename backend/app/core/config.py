from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "CargoNest API"
    app_env: str = "development"
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    database_url: str = "sqlite:///./cargonest.db"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
