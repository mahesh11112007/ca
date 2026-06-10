"""Vercel serverless function entrypoint."""

import sys
import os

# Add parent directory to path so imports work in Vercel's environment
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app  # noqa: E402

# Vercel expects a variable named 'app'
