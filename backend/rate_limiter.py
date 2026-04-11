"""
rate_limiter.py — Shared SlowAPI limiter instance.
Import `limiter` into main.py and use @limiter.limit() on routes.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["30/minute"])