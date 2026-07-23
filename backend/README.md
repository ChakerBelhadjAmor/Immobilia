# Immobil'IA — Backend

FastAPI backend for Immobil'IA. **Scaffold stage**: dependencies, container setup, the shared
dev environment, and the layered project structure. Domain models and endpoints are not
implemented yet — only `/health` responds.

## Run it

Requires Docker (with Compose v2). Nothing else — no local Python needed.

```bash
cp .env.example .env     # then fill MISTRAL_API_KEY
docker compose up --build
```

That single command starts all five services:

| Service  | URL                    | Notes                                |
| -------- | ---------------------- | ------------------------------------ |
| api      | http://localhost:8000  | Docs at `/docs`, health at `/health` |
| postgres | localhost:5432         | user/db `immobilia`                  |
| qdrant   | http://localhost:6333  | dashboard at `/dashboard`            |
| redis    | localhost:6379         |                                      |
| minio    | http://localhost:9001  | console, login `minioadmin`          |

Verify the stack is up:

```bash
curl localhost:8000/health   # -> {"status":"ok"}
```

The `app/` directory is bind-mounted and uvicorn runs with `--reload`, so code edits apply
without a rebuild. Rebuild only when dependencies change.

## Dependencies

Managed with [uv](https://docs.astral.sh/uv/). `uv.lock` is committed — everyone resolves to
byte-identical versions.

```bash
uv add <package>        # add a dependency (updates pyproject.toml + uv.lock)
uv sync                 # install locally, if you work outside Docker
```

After anyone changes dependencies, others run `docker compose up --build` to pick them up.

## Project layout

Organized by technical layer. Domain code lives in `models/`, `schemas/`, `routers/`,
`services/`; each holds every domain, grouped by table-group file (docs §2). AI agents are
grouped by actor, with the orchestration library kept behind `agents/base/`.

```
app/
  core/       config, async DB engine, security, lazy redis/qdrant/minio clients, deps
  models/     SQLAlchemy ORM, one file per table-group (+ _example.py pattern)
  schemas/    Pydantic request/response models
  routers/    HTTP endpoints; __init__.py aggregates into api_router
  services/   business logic (no FastAPI imports)
  agents/     base/ (Mistral client, prompts, orchestrator iface) · seller/ buyer/ investor/
  main.py     composition root — mounts api_router, manages client lifespan
alembic/      migrations (async env.py wired to Settings + Base.metadata)
tests/        pytest (httpx ASGI)
```

Import direction: `routers → services → models/core`. The `_example.py` stubs are the
copy-me pattern; delete them once real domains land.

## Working outside Docker

```bash
uv sync                        # install all deps (incl. dev) into .venv
uv run ruff check .            # lint
uv run ruff format .           # format (drop --check to write)
uv run mypy app tests          # types (strict)
uv run pytest                  # tests
```

Migrations (once real models exist):

```bash
uv run alembic revision --autogenerate -m "message"   # generate from models
uv run alembic upgrade head                            # apply
```

Autogenerate sees a table only if its module is imported in `app/models/__init__.py`.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and every PR:

| Job     | Checks                                             |
| ------- | -------------------------------------------------- |
| quality | `ruff check` · `ruff format --check` · `mypy` · `pytest` |
| docker  | `docker build` then boot the image and poll `/health` |

Green is advisory until branch protection marks these checks required on `main`.

## Architecture

See `CLAUDE.md` for the full architecture summary, and `docs/` for the source specifications.
