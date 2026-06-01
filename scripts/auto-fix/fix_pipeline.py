#!/usr/bin/env python3
"""Auto-fix CI pipeline failures using Claude as an agentic loop."""

import json
import os
import sys
import textwrap
from pathlib import Path

import anthropic
import requests
from github import Github, GithubException

# ── GitHub context ──────────────────────────────────────────────────────────
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
ANTHROPIC_API_KEY = os.environ["ANTHROPIC_API_KEY"]
REPO_NAME = os.environ["GITHUB_REPOSITORY"]          # e.g. "torgge/vinheteria"
WORKFLOW_RUN_ID = int(os.environ["WORKFLOW_RUN_ID"])
FAILED_WORKFLOW = os.environ["FAILED_WORKFLOW"]      # display name
REPO_ROOT = Path(os.environ.get("GITHUB_WORKSPACE", "."))

# ── Clients ──────────────────────────────────────────────────────────────────
gh = Github(GITHUB_TOKEN)
repo = gh.get_repo(REPO_NAME)
client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)


# ── Tool implementations ──────────────────────────────────────────────────────
def read_file(path: str) -> str:
    target = REPO_ROOT / path
    if not target.exists():
        return f"ERROR: file not found: {path}"
    return target.read_text(encoding="utf-8")


def write_file(path: str, content: str) -> str:
    target = REPO_ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")
    return f"OK: wrote {len(content)} bytes to {path}"


def list_directory(path: str) -> str:
    target = REPO_ROOT / path
    if not target.exists():
        return f"ERROR: directory not found: {path}"
    entries = sorted(target.iterdir(), key=lambda p: (p.is_file(), p.name))
    lines = [f"{'DIR ' if e.is_dir() else 'FILE'} {e.name}" for e in entries]
    return "\n".join(lines) if lines else "(empty)"


def fetch_run_logs() -> str:
    """Download and concatenate job logs for the failed workflow run."""
    headers = {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    jobs_url = f"https://api.github.com/repos/{REPO_NAME}/actions/runs/{WORKFLOW_RUN_ID}/jobs"
    jobs_resp = requests.get(jobs_url, headers=headers, timeout=30)
    jobs_resp.raise_for_status()
    jobs = jobs_resp.json().get("jobs", [])

    log_parts: list[str] = []
    for job in jobs:
        if job["conclusion"] not in ("failure", "cancelled"):
            continue
        log_url = f"https://api.github.com/repos/{REPO_NAME}/actions/jobs/{job['id']}/logs"
        log_resp = requests.get(log_url, headers=headers, timeout=60, allow_redirects=True)
        if log_resp.status_code == 200:
            log_parts.append(f"=== JOB: {job['name']} ===\n{log_resp.text[-8000:]}")

    return "\n\n".join(log_parts) or "No failure logs retrieved."


# ── Tool schema for Claude ────────────────────────────────────────────────────
TOOLS = [
    {
        "name": "read_file",
        "description": "Read a file from the repository. Path relative to repo root.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Relative file path"}},
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write (create or overwrite) a file in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {"type": "string", "description": "Relative file path"},
                "content": {"type": "string", "description": "Full file content"},
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "list_directory",
        "description": "List contents of a directory in the repository.",
        "input_schema": {
            "type": "object",
            "properties": {"path": {"type": "string", "description": "Relative directory path"}},
            "required": ["path"],
        },
    },
]

TOOL_HANDLERS = {
    "read_file": lambda inp: read_file(inp["path"]),
    "write_file": lambda inp: write_file(inp["path"], inp["content"]),
    "list_directory": lambda inp: list_directory(inp["path"]),
}

# ── System prompt (cached) ────────────────────────────────────────────────────
SYSTEM_PROMPT = textwrap.dedent("""
    You are an expert CI/CD engineer for the **Vinheria Digital** project — a Kotlin/Quarkus
    microservices platform built with trunk-based development, Conventional Commits, and
    hexagonal + vertical-slice architecture.

    ## Your task
    A GitHub Actions workflow has failed. Diagnose the root cause from the logs and repository
    files, then apply the minimal correct fix by writing the affected files.

    ## Key constraints
    - **Only `main` branch** — trunk-based. No `develop` branch.
    - **Conventional Commit scopes** (PR validation): catalog, sales, purchase, warehouse,
      pricing, customer, supplier, identity, frontend, shared, infra, k6, docker, terraform, ci
    - **Branch pattern**: `(feat|fix|docs|refactor|perf|test|build|ci|chore)/VNH-[0-9]+-[a-z0-9-]+`
    - **Kotlin services** use Quarkus + Kotest + Detekt + Ktlint + Kover (≥80% coverage)
    - **Catalog service port**: 8081 (not 8080)
    - **Frontend**: Angular + PrimeNG, tested with Jest, built with pnpm
    - Prefer editing existing files over creating new ones.
    - Make the smallest possible change that fixes the failure.

    ## Workflow files
    - `.github/workflows/ci.yml`
    - `.github/workflows/pr-validation.yml`
    - `.github/workflows/security.yml`
    - `.github/workflows/deploy.yml`

    ## Done signal
    When you have applied all necessary fixes, stop calling tools and provide a concise
    summary of what you changed and why.
""").strip()


def dispatch_tools(tool_uses: list) -> list:
    results = []
    for tu in tool_uses:
        handler = TOOL_HANDLERS.get(tu.name)
        if handler is None:
            output = f"ERROR: unknown tool '{tu.name}'"
        else:
            try:
                output = handler(tu.input)
            except Exception as exc:
                output = f"ERROR: {exc}"
        results.append(
            {
                "type": "tool_result",
                "tool_use_id": tu.id,
                "content": output,
            }
        )
    return results


# ── Agentic loop ─────────────────────────────────────────────────────────────
def run_agent(failure_logs: str) -> str:
    messages = [
        {
            "role": "user",
            "content": (
                f"The **{FAILED_WORKFLOW}** workflow (run #{WORKFLOW_RUN_ID}) has failed.\n\n"
                f"## Failure logs\n```\n{failure_logs[:12000]}\n```\n\n"
                "Investigate the repository, identify the root cause, and apply the fix."
            ),
        }
    ]

    while True:
        response = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=8096,
            thinking={"type": "adaptive"},
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            tools=TOOLS,
            messages=messages,
        )

        # Append assistant turn
        messages.append({"role": "assistant", "content": response.content})

        if response.stop_reason == "end_turn":
            # Extract final text summary
            for block in response.content:
                if hasattr(block, "text"):
                    return block.text
            return "Fix applied (no summary text returned)."

        if response.stop_reason == "tool_use":
            tool_uses = [b for b in response.content if b.type == "tool_use"]
            tool_results = dispatch_tools(tool_uses)
            messages.append({"role": "user", "content": tool_results})
        else:
            # Unexpected stop reason — bail out
            return f"Agent stopped unexpectedly: {response.stop_reason}"


# ── PR creation ───────────────────────────────────────────────────────────────
def collect_changed_files() -> list[dict]:
    """Return list of {path, content} for every file written by the agent."""
    changed: list[dict] = []
    # We track writes by re-reading anything under .github/ and scripts/
    for pattern in (".github/**/*.yml", "scripts/**/*.py", "scripts/**/*.txt"):
        for p in REPO_ROOT.glob(pattern):
            changed.append(
                {"path": str(p.relative_to(REPO_ROOT)), "content": p.read_text(encoding="utf-8")}
            )
    return changed


def create_fix_pr(summary: str) -> str:
    base_ref = repo.default_branch  # main
    fix_branch = f"fix/auto-pipeline-{WORKFLOW_RUN_ID}"

    # Get HEAD SHA for base
    base_sha = repo.get_branch(base_ref).commit.sha

    # Create branch
    try:
        repo.create_git_ref(ref=f"refs/heads/{fix_branch}", sha=base_sha)
    except GithubException as exc:
        if exc.status != 422:  # 422 = branch already exists
            raise

    # Commit changed files
    changed = collect_changed_files()
    for item in changed:
        path = item["path"]
        content = item["content"]
        try:
            existing = repo.get_contents(path, ref=fix_branch)
            repo.update_file(
                path=path,
                message=f"fix(ci): auto-fix pipeline failure from run #{WORKFLOW_RUN_ID}",
                content=content,
                sha=existing.sha,
                branch=fix_branch,
            )
        except GithubException:
            repo.create_file(
                path=path,
                message=f"fix(ci): auto-fix pipeline failure from run #{WORKFLOW_RUN_ID}",
                content=content,
                branch=fix_branch,
            )

    # Open PR
    pr = repo.create_pull(
        title=f"fix(ci): auto-fix {FAILED_WORKFLOW} failure (run #{WORKFLOW_RUN_ID})",
        body=(
            f"## Auto-fix by Claude\n\n"
            f"**Failed workflow:** {FAILED_WORKFLOW}\n"
            f"**Run ID:** {WORKFLOW_RUN_ID}\n\n"
            f"### Summary of changes\n\n{summary}\n\n"
            f"---\n_Generated automatically by `scripts/auto-fix/fix_pipeline.py`_"
        ),
        head=fix_branch,
        base=base_ref,
    )
    return pr.html_url


# ── Entry point ───────────────────────────────────────────────────────────────
def main() -> None:
    print(f"Fetching logs for workflow run #{WORKFLOW_RUN_ID}…")
    logs = fetch_run_logs()
    print(f"  Retrieved {len(logs)} bytes of log data.")

    print("Running Claude agentic loop…")
    summary = run_agent(logs)
    print(f"\nAgent summary:\n{summary}\n")

    print("Creating fix PR…")
    pr_url = create_fix_pr(summary)
    print(f"Pull request created: {pr_url}")


if __name__ == "__main__":
    main()
