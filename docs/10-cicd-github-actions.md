# 10. CI/CD — GitHub Actions


### 9.1 Pipeline Padrão por Microserviço

```yaml
# ─────────────────────────────────────────────────────
# .github/workflows/ci.yml — Build & Test Pipeline
# ─────────────────────────────────────────────────────
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ghcr.io/vinheria

jobs:
  lint:
    name: "🔍 Lint (Ktlint + Detekt)"
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '21' }
      - uses: gradle/actions/setup-gradle@v4
      - name: Ktlint Check
        run: ./gradlew ktlintCheck
      - name: Detekt
        run: ./gradlew detekt
      - name: Upload SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: build/reports/ktlint/

  test:
    name: "🧪 Tests (Unit + Integration + Arch)"
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: vinheria_test
          POSTGRES_USER: vinheria
          POSTGRES_PASSWORD: test
        ports: ['5432:5432']
        options: >-
          --health-cmd "pg_isready -U vinheria"
          --health-interval 5s
          --health-timeout 5s
          --health-retries 5
      valkey:
        image: valkey/valkey:8-alpine
        ports: ['6379:6379']
        options: >-
          --health-cmd "valkey-cli ping"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '21' }
      - uses: gradle/actions/setup-gradle@v4

      - name: Unit Tests (Kotest + MockK)
        run: ./gradlew test -Punit

      - name: Integration Tests (Testcontainers)
        run: ./gradlew test -Pintegration

      - name: Architecture Tests (ArchUnit)
        run: ./gradlew test -Parchitecture

      - name: Coverage (Kover ≥ 80%)
        run: ./gradlew koverVerify

      - name: Upload Test Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-reports
          path: build/reports/tests/

  build:
    name: "🏗️ Build & Push Image"
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: 'temurin', java-version: '21' }
      - uses: gradle/actions/setup-gradle@v4

      - name: Build Native Image
        run: ./gradlew build -Dquarkus.native.enabled=true -Dquarkus.native.container-build=true

      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build & Push Docker Image
        uses: docker/build-push-action@v6
        with:
          context: .
          file: src/main/docker/Dockerfile.native
          push: true
          tags: |
            ${{ env.IMAGE_PREFIX }}/${{ github.event.repository.name }}:${{ github.sha }}
            ${{ env.IMAGE_PREFIX }}/${{ github.event.repository.name }}:latest

  k6-smoke:
    name: "🚀 K6 Smoke Tests"
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Start services
        run: docker compose up -d && sleep 30
      - name: Run K6 Smoke
        uses: grafana/k6-action@v0.3.1
        with:
          filename: k6/scripts/smoke/catalog-smoke.js
          flags: --env BASE_URL=http://localhost:8080
```

```yaml
# ─────────────────────────────────────────────────────
# .github/workflows/deploy.yml — Deploy Pipeline
# ─────────────────────────────────────────────────────
name: Deploy

on:
  workflow_run:
    workflows: ["CI Pipeline"]
    branches: [main]
    types: [completed]

env:
  TF_VAR_image_tag: ${{ github.sha }}

jobs:
  deploy-staging:
    name: "🚀 Deploy to Staging"
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    environment: staging
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init (Staging)
        working-directory: infra/terraform/environments/staging
        run: terraform init

      - name: Terraform Plan
        working-directory: infra/terraform/environments/staging
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        working-directory: infra/terraform/environments/staging
        run: terraform apply -auto-approve tfplan

      - name: Update K8s Deployment
        run: |
          kubectl set image deployment/${{ github.event.repository.name }} \
            app=ghcr.io/vinheria/${{ github.event.repository.name }}:${{ github.sha }} \
            --namespace=staging

      - name: K6 Smoke (Staging)
        uses: grafana/k6-action@v0.3.1
        with:
          filename: k6/scripts/smoke/catalog-smoke.js
          flags: --env BASE_URL=${{ vars.STAGING_URL }}

  deploy-production:
    name: "🚀 Deploy to Production"
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: production      # Requer approval manual no GitHub
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init (Production)
        working-directory: infra/terraform/environments/production
        run: terraform init

      - name: Terraform Plan
        working-directory: infra/terraform/environments/production
        run: terraform plan -out=tfplan

      - name: Terraform Apply
        working-directory: infra/terraform/environments/production
        run: terraform apply -auto-approve tfplan

      - name: Rolling Update K8s
        run: |
          kubectl set image deployment/${{ github.event.repository.name }} \
            app=ghcr.io/vinheria/${{ github.event.repository.name }}:${{ github.sha }} \
            --namespace=production
          kubectl rollout status deployment/${{ github.event.repository.name }} \
            --namespace=production --timeout=300s
```

### 9.2 Pipeline Diagram

```
  PR / push develop        push main
       │                      │
       ▼                      ▼
  ┌─────────┐           ┌─────────┐
  │  Lint   │           │  Lint   │
  │ Ktlint  │           │ Ktlint  │
  │ Detekt  │           │ Detekt  │
  └────┬────┘           └────┬────┘
       ▼                      ▼
  ┌─────────┐           ┌─────────┐
  │  Test   │           │  Test   │
  │ Kotest  │           │ Kotest  │
  │ArchUnit │           │ArchUnit │
  │ Kover   │           │ Kover   │
  └────┬────┘           └────┬────┘
       │                      ▼
       │                ┌─────────┐
       │                │  Build  │
       │                │ Native  │
       │                │ Docker  │
       │                └────┬────┘
       │                      ▼
       │                ┌─────────┐
       │                │K6 Smoke │
       │                └────┬────┘
       │                      ▼
       │                ┌─────────┐
       │                │ Deploy  │──→ Terraform Plan/Apply
       │                │ Staging │──→ K8s Rolling Update
       │                │ + K6    │──→ K6 Smoke Staging
       │                └────┬────┘
       │                      ▼
       │                ┌─────────┐
       │                │ Deploy  │──→ Manual Approval ⚠️
       │                │  Prod   │──→ Terraform Apply
       │                │         │──→ K8s Rolling Update
       │                └─────────┘
```

---
