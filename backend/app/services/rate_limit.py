from collections import defaultdict, deque
from collections.abc import Hashable
from threading import Lock
from time import monotonic

from fastapi import HTTPException, status


class SlidingWindowLimiter:
    def __init__(self) -> None:
        self._events: dict[Hashable, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, key: Hashable, limit: int, window_seconds: int, detail: str) -> None:
        now = monotonic()

        with self._lock:
            events = self._events[key]
            while events and now - events[0] > window_seconds:
                events.popleft()

            if len(events) >= limit:
                retry_after = max(1, int(window_seconds - (now - events[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=detail,
                    headers={'Retry-After': str(retry_after)},
                )

            events.append(now)


class LoginFailureGuard:
    def __init__(self) -> None:
        self._failures: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def enforce(self, key: str, max_failures: int, window_seconds: int, detail: str) -> None:
        now = monotonic()

        with self._lock:
            failures = self._failures[key]
            while failures and now - failures[0] > window_seconds:
                failures.popleft()

            if len(failures) >= max_failures:
                retry_after = max(1, int(window_seconds - (now - failures[0])))
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=detail,
                    headers={'Retry-After': str(retry_after)},
                )

    def register_failure(self, key: str, window_seconds: int) -> None:
        now = monotonic()

        with self._lock:
            failures = self._failures[key]
            while failures and now - failures[0] > window_seconds:
                failures.popleft()
            failures.append(now)

    def clear(self, key: str) -> None:
        with self._lock:
            self._failures.pop(key, None)


auth_burst_limiter = SlidingWindowLimiter()
login_failure_guard = LoginFailureGuard()
