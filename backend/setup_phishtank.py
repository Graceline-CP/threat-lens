"""
setup_phishtank.py — run once to import the PhishTank CSV into SQLite.

Usage:
  1. Download the verified dataset from https://www.phishtank.com/developer_info.php
     (click "Phish Database Download" → verified_online.csv.bz2, then extract)
  2. Place verified_online.csv in the backend/ folder
  3. Run:  python setup_phishtank.py
"""

import sqlite3
import csv
import os
import sys
from pathlib import Path

CSV_PATH   = Path(__file__).parent / "verified_online.csv"
DB_PATH    = Path(__file__).parent / "phishtank_urls.db"

def main():
    if not CSV_PATH.exists():
        print(f"[ERROR] CSV not found at {CSV_PATH}")
        print("Download from: https://www.phishtank.com/developer_info.php")
        sys.exit(1)

    print(f"Opening {CSV_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("""
        CREATE TABLE IF NOT EXISTS phish_urls (
            url       TEXT PRIMARY KEY,
            phish_id  TEXT,
            added     TEXT,
            verified  TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_url ON phish_urls(url)")

    inserted = 0
    skipped  = 0

    with open(CSV_PATH, newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            url = row.get("url", "").strip()
            if not url:
                continue
            rows.append((
                url,
                row.get("phish_id", ""),
                row.get("submission_time", ""),
                row.get("verified", ""),
            ))
            if len(rows) >= 5000:
                conn.executemany(
                    "INSERT OR IGNORE INTO phish_urls VALUES (?,?,?,?)", rows
                )
                inserted += len(rows)
                rows = []
                print(f"  Imported {inserted:,} rows...", end="\r")

        if rows:
            conn.executemany(
                "INSERT OR IGNORE INTO phish_urls VALUES (?,?,?,?)", rows
            )
            inserted += len(rows)

    conn.commit()
    conn.close()

    size_kb = DB_PATH.stat().st_size // 1024
    print(f"\n✅ Done! {inserted:,} URLs imported → {DB_PATH} ({size_kb:,} KB)")


if __name__ == "__main__":
    main()