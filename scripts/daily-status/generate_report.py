#!/usr/bin/env python3
"""Daily repository status report powered by DeepSeek."""

import json
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from openai import OpenAI

# ── Config ────────────────────────────────────────────────────────────────────
GITHUB_TOKEN = os.environ["GITHUB_TOKEN"]
DEEPSEEK_API_KEY = os.environ["DEEPSEEK_API_KEY"]
REPO = os.environ["GITHUB_REPOSITORY"]
STATE_FILE = Path(os.environ.get("STATE_FILE", "/tmp/daily-status-state/state.json"))

GH_HEADERS = {
    "Authorization": f"Bearer {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
}
GH_BASE = "https://api.github.com"

# ── GitHub API helpers ────────────────────────────────────────────────────────

def gh_get(path: str, params: dict | None = None) -> dict | list:
    url = f"{GH_BASE}/repos/{REPO}{path}"
    resp = requests.get(url, headers=GH_HEADERS, params=params or {}, timeout=30)
    resp.raise_for_status()
    return resp.json()


def gh_post(path: str, data: dict) -> dict:
    url = f"{GH_BASE}/repos/{REPO}{path}"
    resp = requests.post(url, headers=GH_HEADERS, json=data, timeout=30)
    resp.raise_for_status()
    return resp.json()

# ── State helpers ─────────────────────────────────────────────────────────────

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            return json.loads(STATE_FILE.read_text())
        except Exception:
            pass
    return {
        "last_run_date": None,
        "previous_open_issues": 0,
        "previous_open_prs": 0,
        "previous_ci_failures": 0,
    }


def save_state(state: dict) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATE_FILE.write_text(json.dumps(state, indent=2))

# ── Data gathering ────────────────────────────────────────────────────────────

def gather_data(now: datetime) -> dict:
    cutoff_24h = (now - timedelta(hours=24)).strftime("%Y-%m-%dT%H:%M:%SZ")
    cutoff_14d = (now - timedelta(days=14)).strftime("%Y-%m-%dT%H:%M:%SZ")
    cutoff_3d  = (now - timedelta(days=3)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Issues (exclude PRs which GitHub /issues also returns)
    raw_open = gh_get("/issues", {"state": "open", "per_page": 100})
    open_issues = [i for i in raw_open if "pull_request" not in i]

    issues_opened_24h = [i for i in open_issues if i["created_at"] >= cutoff_24h]

    raw_closed = gh_get("/issues", {"state": "closed", "per_page": 50, "since": cutoff_24h})
    closed_issues_24h = [i for i in raw_closed if "pull_request" not in i]

    stale_issues = [i for i in open_issues if i["updated_at"] < cutoff_14d][:5]

    critical_issues = [
        i for i in open_issues
        if any(l["name"] in {"critical", "high-priority", "security"} for l in i.get("labels", []))
    ]

    # PRs
    open_prs = gh_get("/pulls", {"state": "open", "per_page": 100})
    prs_opened_24h = [p for p in open_prs if p["created_at"] >= cutoff_24h]
    stale_prs = [
        {
            **p,
            "age_days": (now - datetime.fromisoformat(p["created_at"].replace("Z", "+00:00"))).days,
        }
        for p in open_prs if p["created_at"] < cutoff_3d
    ][:5]

    raw_closed_prs = gh_get("/pulls", {"state": "closed", "per_page": 50, "sort": "updated"})
    merged_24h = [
        p for p in raw_closed_prs
        if p.get("merged_at") and p["merged_at"] >= cutoff_24h
    ]

    # Workflow runs (last 50 across all workflows)
    runs_resp = requests.get(
        f"{GH_BASE}/repos/{REPO}/actions/runs",
        headers=GH_HEADERS,
        params={"per_page": 50},
        timeout=30,
    )
    all_runs = runs_resp.json().get("workflow_runs", []) if runs_resp.ok else []
    recent_runs = [r for r in all_runs if r.get("created_at", "") >= cutoff_24h]

    ci_main = next(
        (r for r in all_runs if r.get("name") == "CI Pipeline" and r.get("head_branch") == "main"),
        None,
    )
    sec_main = next(
        (r for r in all_runs if r.get("name") == "Security & Quality Gate" and r.get("head_branch") == "main"),
        None,
    )
    failures_24h = [r for r in recent_runs if r.get("conclusion") == "failure"]

    # Recent commits on main
    commits = gh_get("/commits", {"sha": "main", "per_page": 5})

    def run_status(r):
        if r is None:
            return None
        return {"status": r.get("conclusion") or r.get("status"), "url": r.get("html_url")}

    return {
        "open_issues_count": len(open_issues),
        "issues_opened_24h": [
            {"title": i["title"], "author": i["user"]["login"], "url": i["html_url"]}
            for i in issues_opened_24h
        ],
        "issues_closed_24h": [
            {"title": i["title"], "url": i["html_url"]} for i in closed_issues_24h
        ],
        "stale_issues": [
            {"title": i["title"], "url": i["html_url"], "last_update": i["updated_at"][:10]}
            for i in stale_issues
        ],
        "critical_issues": [
            {
                "title": i["title"],
                "url": i["html_url"],
                "labels": [l["name"] for l in i.get("labels", [])],
            }
            for i in critical_issues
        ],
        "open_prs_count": len(open_prs),
        "prs_opened_24h": [
            {"title": p["title"], "author": p["user"]["login"], "url": p["html_url"]}
            for p in prs_opened_24h
        ],
        "merged_prs_24h": [
            {
                "title": p["title"],
                "merged_by": (p.get("merged_by") or {}).get("login", "unknown"),
                "url": p["html_url"],
            }
            for p in merged_24h
        ],
        "stale_prs": [
            {
                "title": p["title"],
                "author": p["user"]["login"],
                "url": p["html_url"],
                "age_days": p["age_days"],
            }
            for p in stale_prs
        ],
        "ci_pipeline_main": run_status(ci_main),
        "security_main": run_status(sec_main),
        "workflow_failures_24h": [
            {"name": r["name"], "url": r["html_url"], "branch": r.get("head_branch", "")}
            for r in failures_24h
        ],
        "recent_commits": [
            {
                "sha": c["sha"][:7],
                "author": c["commit"]["author"]["name"],
                "message": c["commit"]["message"].split("\n")[0][:72],
                "date": c["commit"]["author"]["date"][:10],
            }
            for c in commits
        ],
    }

# ── Report assembly ───────────────────────────────────────────────────────────

def trend(current: int, previous: int) -> str:
    if current > previous:
        return "📈"
    if current < previous:
        return "📉"
    return "➡️"


def ci_badge(run: dict | None) -> str:
    if run is None:
        return "⬜ No run"
    status = run.get("status", "")
    if status == "success":
        return f"[✅ Passing]({run['url']})"
    if status in ("failure", "cancelled"):
        return f"[❌ Failed]({run['url']})"
    return f"[🔄 {status}]({run['url']})"


def build_prompt(data: dict, state: dict, today: str) -> str:
    prev_i = state.get("previous_open_issues", 0)
    prev_p = state.get("previous_open_prs", 0)
    prev_f = state.get("previous_ci_failures", 0)

    date_long = datetime.strptime(today, "%Y-%m-%d").strftime("%A, %B %d %Y")

    def lines(items, fmt):
        return "\n".join(fmt(x) for x in items) if items else "_none_"

    critical_lines = lines(data["critical_issues"],
        lambda i: f"- [{i['title']}]({i['url']}) `{', '.join(i['labels'])}`")
    stale_pr_lines = lines(data["stale_prs"],
        lambda p: f"- [{p['title']}]({p['url']}) · @{p['author']} · {p['age_days']}d open")
    merged_lines = lines(data["merged_prs_24h"],
        lambda p: f"- [{p['title']}]({p['url']}) · merged by @{p['merged_by']}")
    failures_lines = lines(data["workflow_failures_24h"],
        lambda r: f"- [{r['name']}]({r['url']}) on `{r['branch']}`")
    commits_rows = "\n".join(
        f"| `{c['sha']}` | {c['author']} | {c['message']} | {c['date']} |"
        for c in data["recent_commits"]
    )

    report_body = f"""\
## 📊 Daily Repository Status — {date_long}

> Auto-generated by the [Daily Status Report](.github/workflows/daily-repo-status.md) workflow (powered by DeepSeek).

---

### 🐛 Issues

| Metric | Count | Trend |
|--------|------:|-------|
| Open issues | {data['open_issues_count']} | {trend(data['open_issues_count'], prev_i)} |
| Opened today | {len(data['issues_opened_24h'])} | — |
| Closed today | {len(data['issues_closed_24h'])} | — |
| Stale (>14 days, no activity) | {len(data['stale_issues'])} | — |

**🔴 Critical / High-priority open issues:**
{critical_lines}

---

### 🔀 Pull Requests

| Metric | Count | Trend |
|--------|------:|-------|
| Open PRs | {data['open_prs_count']} | {trend(data['open_prs_count'], prev_p)} |
| Opened today | {len(data['prs_opened_24h'])} | — |
| Merged today | {len(data['merged_prs_24h'])} | — |
| Awaiting review >3 days | {len(data['stale_prs'])} | — |

**⏳ Stale PRs needing review:**
{stale_pr_lines}

**✅ Merged today:**
{merged_lines}

---

### 🏗️ CI / CD

| Workflow | Latest Run | Branch |
|----------|:----------:|--------|
| CI Pipeline | {ci_badge(data['ci_pipeline_main'])} | main |
| Security Scan | {ci_badge(data['security_main'])} | main |

**❌ Failures in last 24 h:**
{failures_lines}

---

### 📝 Recent Commits on `main`

| SHA | Author | Message | When |
|-----|--------|---------|------|
{commits_rows}

---

### ✅ Action Items

{{ACTION_ITEMS}}"""

    context = f"""\
You are a maintainer assistant for Vinheria Digital — a B2B wine distribution platform
(Quarkus + Kotlin backend, Angular frontend).

Write the "Action Items" checklist for today's repository health report.
Be specific: reference PRs, issues, or CI runs by name/number/link.
If everything is healthy, state that explicitly with a single "All good" item.

Today: {today}
Open issues: {data['open_issues_count']} (was {prev_i} yesterday, {trend(data['open_issues_count'], prev_i)})
Open PRs: {data['open_prs_count']} (was {prev_p} yesterday, {trend(data['open_prs_count'], prev_p)})
CI failures today: {len(data['workflow_failures_24h'])} (was {prev_f} yesterday)
Critical / security issues: {len(data['critical_issues'])}
Stale PRs (>3 days without review): {len(data['stale_prs'])}
Stale issues (>14 days no activity): {len(data['stale_issues'])}

Details:
{json.dumps({k: data[k] for k in ['critical_issues','stale_prs','workflow_failures_24h','stale_issues']}, indent=2)}

Return ONLY the checklist items in GitHub Markdown format (lines starting with "- [ ]").
Do not include any heading or preamble."""

    return report_body, context

# ── DeepSeek call ─────────────────────────────────────────────────────────────

def call_deepseek(context_prompt: str) -> str:
    client = OpenAI(
        api_key=DEEPSEEK_API_KEY,
        base_url="https://api.deepseek.com/v1",
    )
    response = client.chat.completions.create(
        model="deepseek-v4-pro",
        messages=[{"role": "user", "content": context_prompt}],
        max_tokens=512,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()

# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> None:
    if not DEEPSEEK_API_KEY:
        print("::error::DEEPSEEK_API_KEY secret is empty or not set. "
              "Go to Settings → Secrets → Actions and add the secret value.")
        sys.exit(1)

    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    state = load_state()
    if state.get("last_run_date") == today:
        print(f"Report already generated for {today}. Skipping.")
        return

    print("Gathering repository data…")
    data = gather_data(now)

    print("Assembling report template…")
    report_body_template, action_items_prompt = build_prompt(data, state, today)

    print("Generating action items with DeepSeek…")
    action_items = call_deepseek(action_items_prompt)

    report_body = report_body_template.replace("{ACTION_ITEMS}", action_items)
    issue_title = f"📊 Daily Status Report — {today}"

    print(f"Creating GitHub issue: {issue_title}")
    result = gh_post("/issues", {"title": issue_title, "body": report_body, "labels": []})
    print(f"Issue created: {result['html_url']}")

    save_state({
        "last_run_date": today,
        "previous_open_issues": data["open_issues_count"],
        "previous_open_prs": data["open_prs_count"],
        "previous_ci_failures": len(data["workflow_failures_24h"]),
    })


if __name__ == "__main__":
    main()
