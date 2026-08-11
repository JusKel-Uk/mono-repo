#!/usr/bin/env python3
"""Read-only check: EF migrations applied on the configured Identity database."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

SECRETS = Path.home() / ".microsoft/usersecrets/e58049ed-cab6-4f81-b1d4-bc2e2cde0d23/secrets.json"
QUERY = """
SET NOCOUNT ON;
SELECT DB_NAME() AS DatabaseName;
SELECT TABLE_SCHEMA, TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_SCHEMA, TABLE_NAME;
SELECT MigrationId
FROM [identity].[__EFMigrationsHistory]
ORDER BY MigrationId;
"""


def parse_connection_string(cs: str) -> dict[str, str]:
    parts: dict[str, str] = {}
    for segment in cs.split(";"):
        if not segment.strip() or "=" not in segment:
            continue
        key, value = segment.split("=", 1)
        parts[key.strip().lower()] = value.strip()
    return parts


def main() -> int:
    if not SECRETS.exists():
        print(f"Secrets file not found: {SECRETS}", file=sys.stderr)
        return 1

    secrets = json.loads(SECRETS.read_text(encoding="utf-8-sig"))
    cs = secrets.get("ConnectionStrings:Identity", "")
    if not cs:
        print("ConnectionStrings:Identity is not set in user secrets.", file=sys.stderr)
        return 1

    parsed = parse_connection_string(cs)
    server = parsed.get("server", "").replace("tcp:", "")
    database = parsed.get("database", "")
    user = parsed.get("user id") or parsed.get("uid", "")
    password = parsed.get("password", "")

    if not all([server, database, user, password]):
        print("Connection string is missing server, database, user, or password.", file=sys.stderr)
        return 1

    env = os.environ.copy()
    env["SQLCMDPASSWORD"] = password

    cmd = [
        "docker",
        "exec",
        "-e",
        "SQLCMDPASSWORD",
        "juskel-sql",
        "/opt/mssql-tools18/bin/sqlcmd",
        "-S",
        server,
        "-U",
        user,
        "-d",
        database,
        "-C",
        "-l",
        "90",
        "-Q",
        QUERY,
    ]

    print(f"Target: {server} / {database}")
    print()

    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.returncode != 0:
        if result.stderr:
            print(result.stderr.rstrip(), file=sys.stderr)
        return result.returncode

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
