from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = 'CargoNest API'
    app_env: str = 'development'
    app_host: str = '127.0.0.1'
    app_port: int = 8000
    frontend_origin: str = 'http://localhost:5173'
    frontend_origins: str = 'http://localhost:5173,http://127.0.0.1:5173'
    supabase_url: str = ''
    supabase_anon_key: str = ''
    supabase_service_role_key: str = ''
    supabase_storage_bucket: str = 'cargonest-attachments'
    supabase_storage_folder: str = 'forms'
    database_url: str = 'sqlite:///./cargonest.db'
    auto_create_tables: bool = True
    log_level: str = 'INFO'
    frontend_error_reporting_enabled: bool = True
    session_duration_hours: int = 24
    session_secret_key: str = 'development-session-secret'
    session_cookie_name: str = 'cargonest_session'
    csrf_cookie_name: str = 'cargonest_csrf'
    bootstrap_admin_enabled: bool = False
    bootstrap_admin_username: str = ''
    bootstrap_admin_email: str = ''
    bootstrap_admin_password: str = ''

    model_config = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    @property
    def allowed_frontend_origins(self) -> list[str]:
        origins = [origin.strip() for origin in self.frontend_origins.split(',') if origin.strip()]
        if self.frontend_origin and self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        return origins or ['http://localhost:5173', 'http://127.0.0.1:5173']

    @property
    def storage_enabled(self) -> bool:
        return bool(
            self.supabase_url.strip()
            and self.supabase_service_role_key.strip()
            and self.supabase_storage_bucket.strip()
        )

    @property
    def session_cookie_secure(self) -> bool:
        return self.app_env == 'production'

    @property
    def session_cookie_samesite(self) -> str:
        return 'none' if self.session_cookie_secure else 'lax'


settings = Settings()
