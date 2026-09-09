"""In-process app statistics & activity feed (demo-friendly, no external cache)."""
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any


class _SafeDeque:
    def __init__(self, maxlen: int = 30) -> None:
        self._d: deque = deque(maxlen=maxlen)
        self._lock = threading.Lock()

    def append(self, item: Any) -> None:
        with self._lock:
            self._d.appendleft(item)

    def list(self) -> list:
        with self._lock:
            return list(self._d)


class AppStats:
    def __init__(self) -> None:
        self.started_at = datetime.now(timezone.utc)
        self._lock = threading.Lock()
        self.counters: dict[str, int] = {
            "queries_total": 0,
            "queries_today": 0,
            "scans_total": 0,
            "scans_today": 0,
            "applications": 0,
            "logins": 0,
        }
        self.recent_queries = _SafeDeque(maxlen=30)
        self.recent_scans = _SafeDeque(maxlen=12)

    def increment(self, key: str, amount: int = 1) -> None:
        with self._lock:
            self.counters[key] = self.counters.get(key, 0) + amount

    def record_query(self, message: str, mode: str, intent: str, status: str) -> None:
        self.increment("queries_total")
        self.increment("queries_today")
        self.recent_queries.append(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "message": message[:240],
                "mode": mode,
                "intent": intent,
                "status": status,
            }
        )

    def record_scan(self, filename: str, mode: str, status: str) -> None:
        self.increment("scans_total")
        self.increment("scans_today")
        self.recent_scans.append(
            {
                "ts": datetime.now(timezone.utc).isoformat(),
                "filename": filename[:160],
                "mode": mode,
                "status": status,
            }
        )

    def snapshot(self) -> dict:
        with self._lock:
            basic = dict(self.counters)
        basic.update(
            {
                "started_at": self.started_at.isoformat(),
                "recent_queries": self.recent_queries.list(),
                "recent_scans": self.recent_scans.list(),
            }
        )
        return basic


stats = AppStats()