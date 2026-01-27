#!/usr/bin/env bash

# Minimal check-prerequisites script - Linux version

# Parse command line arguments
REQUIRE_TASKS=false
INCLUDE_TASKS=false
PATHS_ONLY=false
HELP=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --require-tasks) REQUIRE_TASKS=true; shift ;;
    --include-tasks) INCLUDE_TASKS=true; shift ;;
    --paths-only) PATHS_ONLY=true; shift ;;
    --help|-h) HELP=true; shift ;;
    *) shift ;;
  esac
done

if [ "$HELP" = true ]; then
  echo "Usage: check-prerequisites.sh [OPTIONS]"
  echo "  --require-tasks      Require tasks.md to exist"
  echo "  --include-tasks      Include tasks.md in AVAILABLE_DOCS list"
  echo "  --paths-only         Only output path variables"
  echo "  --help, -h          Show this help message"
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CURRENT_BRANCH=$(git -C "$REPO_ROOT" branch --show-current 2>/dev/null || echo "no-git")
HAS_GIT=$([ -d "$REPO_ROOT/.git" ] && echo "true" || echo "false")

FEATURE_DIR=""
for dir in "$REPO_ROOT"/[0-9]*-*; do
  if [ -d "$dir" ]; then
    branch_name=$(basename "$dir")
    if [ "$CURRENT_BRANCH" = "$branch_name" ]; then
      FEATURE_DIR="$dir"
      break
    fi
done

if [ -z "$FEATURE_DIR" ]; then
  FEATURE_DIR="$REPO_ROOT"
fi

FEATURE_SPEC="$FEATURE_DIR/spec.md"
IMPL_PLAN="$FEATURE_DIR/plan.md"
TASKS="$FEATURE_DIR/tasks.md"
CONTRACTS_DIR="$FEATURE_DIR/contracts"
QUICKSTART="$FEATURE_DIR/quickstart.md"
RESEARCH="$FEATURE_DIR/research.md"
DATA_MODEL="$FEATURE_DIR/data-model.md"

VALID=true

if [ "$HAS_GIT" != "true" ] || [ "$CURRENT_BRANCH" = "no-git" ]; then
  echo "ERROR: Not on a proper feature branch."
  VALID=false
fi

if [ ! -d "$FEATURE_DIR" ]; then
  echo "ERROR: Feature directory not found: $FEATURE_DIR"
  VALID=false
fi

if [ "$REQUIRE_TASKS" = true ] || [ "$INCLUDE_TASKS" = true ]; then
  if [ ! -f "$TASKS" ]; then
    echo "ERROR: tasks.md not found in $FEATURE_DIR"
    VALID=false
  fi

  if [ "$REQUIRE_TASKS" = true ]; then
    if [ ! -f "$IMPL_PLAN" ]; then
      echo "ERROR: plan.md not found in $FEATURE_DIR"
      VALID=false
    fi
  fi
fi

DOCS=""
if [ -f "$RESEARCH" ]; then DOCS="$DOCS $RESEARCH"; fi
if [ -f "$DATA_MODEL" ]; then DOCS="$DOCS $DATA_MODEL"; fi
if [ -d "$CONTRACTS_DIR" ] && [ "$(ls -A "$CONTRACTS_DIR" 2>/dev/null | wc -l)" -gt 0 ]; then DOCS="$DOCS contracts/"; fi
if [ -f "$QUICKSTART" ]; then DOCS="$DOCS $QUICKSTART"; fi
if [ "$INCLUDE_TASKS" = true ] && [ -f "$TASKS" ]; then DOCS="$DOCS $TASKS"; fi

if [ "$PATHS_ONLY" = true ]; then
  echo "REPO_ROOT: $REPO_ROOT"
  echo "BRANCH: $CURRENT_BRANCH"
  echo "HAS_GIT: $HAS_GIT"
  echo "FEATURE_DIR: $FEATURE_DIR"
  echo "FEATURE_SPEC: $FEATURE_SPEC"
  echo "IMPL_PLAN: $IMPL_PLAN"
  echo "TASKS: $TASKS"
  echo "CONTRACTS_DIR: $CONTRACTS_DIR"
  echo "QUICKSTART: $QUICKSTART"
  echo "RESEARCH: $RESEARCH"
  echo "DATA_MODEL: $DATA_MODEL"
  exit 0
fi

if [ "$VALID" = true ]; then
  echo "VALID: $VALID"
  echo "FEATURE_DIR: $FEATURE_DIR"
  echo "FEATURE_SPEC: $FEATURE_SPEC"
  echo "IMPL_PLAN: $IMPL_PLAN"
  echo "TASKS: $TASKS"
  echo "CONTRACTS_DIR: $CONTRACTS_DIR"
  echo "QUICKSTART: $QUICKSTART"
  echo "RESEARCH: $RESEARCH"
  echo "DATA_MODEL: $DATA_MODEL"
  echo "AVAILABLE_DOCS:"
  for doc in $DOCS; do
    if [ -f "$doc" ] || [ -d "$doc" ]; then
      echo "  - $(basename "$doc")"
    fi
  done
  exit 0
else
  exit 1
fi
