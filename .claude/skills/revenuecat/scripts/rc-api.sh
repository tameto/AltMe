#!/usr/bin/env bash
# RevenueCat REST API v2 wrapper
# Requires: RC_API_KEY environment variable
#
# Usage:
#   rc-api.sh [options] <endpoint>
#
# Options:
#   -X METHOD    HTTP method (GET, POST, PUT, DELETE). Default: GET
#   -d DATA      Request body (JSON string)
#   -q PARAMS    Query parameters (appended to URL)
#   -r           Raw output (no jq formatting)
#   -v           Verbose (show request details)
#   -h           Show this help
#
# Examples:
#   rc-api.sh /projects
#   rc-api.sh /projects/{project_id}/customers/{customer_id}
#   rc-api.sh -X POST /projects/{project_id}/entitlements -d '{"lookup_key":"pro","display_name":"Pro Access"}'
#   rc-api.sh -X DELETE /projects/{project_id}/products/{product_id}
#   rc-api.sh /projects/{project_id}/charts/mrr -q "start_date=2026-01-01&end_date=2026-02-14&currency=JPY"

set -euo pipefail

BASE_URL="https://api.revenuecat.com/v2"
METHOD="GET"
DATA=""
QUERY=""
RAW=false
VERBOSE=false

usage() {
  sed -n '/^# Usage:/,/^$/p' "$0" | sed 's/^# //' | sed 's/^#//'
  echo ""
  sed -n '/^# Options:/,/^# Examples:/p' "$0" | sed 's/^# //' | sed 's/^#//' | head -n -1
  echo ""
  sed -n '/^# Examples:/,/^$/p' "$0" | sed 's/^# //' | sed 's/^#//'
  exit 0
}

# Parse options
while getopts "X:d:q:rvh" opt; do
  case $opt in
    X) METHOD="${OPTARG}" ;;
    d) DATA="${OPTARG}" ;;
    q) QUERY="${OPTARG}" ;;
    r) RAW=true ;;
    v) VERBOSE=true ;;
    h) usage ;;
    *) echo "Unknown option: -${OPTARG}" >&2; exit 1 ;;
  esac
done
shift $((OPTIND - 1))

# Validate API key
if [[ -z "${RC_API_KEY:-}" ]]; then
  echo "Error: RC_API_KEY not set" >&2
  echo "Set it with: export RC_API_KEY='your_v2_secret_key'" >&2
  exit 1
fi

# Validate endpoint
if [[ $# -lt 1 ]]; then
  echo "Error: endpoint required" >&2
  echo "Usage: rc-api.sh [options] <endpoint>" >&2
  echo "Run 'rc-api.sh -h' for help" >&2
  exit 1
fi

ENDPOINT="$1"
URL="${BASE_URL}${ENDPOINT}"

# Append query parameters
if [[ -n "${QUERY}" ]]; then
  URL="${URL}?${QUERY}"
fi

# Build curl arguments
CURL_ARGS=(
  -s
  -w "\n%{http_code}"
  -X "${METHOD}"
  -H "Authorization: Bearer ${RC_API_KEY}"
  -H "Content-Type: application/json"
)

# Add request body for POST/PUT/PATCH
if [[ -n "${DATA}" ]]; then
  CURL_ARGS+=(-d "${DATA}")
fi

# Verbose output
if [[ "${VERBOSE}" == true ]]; then
  echo ">>> ${METHOD} ${URL}" >&2
  if [[ -n "${DATA}" ]]; then
    echo ">>> Body: ${DATA}" >&2
  fi
  echo "" >&2
fi

# Execute request
RESPONSE=$(curl "${CURL_ARGS[@]}" "${URL}")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "${RESPONSE}" | tail -n 1)
BODY=$(echo "${RESPONSE}" | sed '$d')

# Check for errors
if [[ "${HTTP_CODE}" -ge 400 ]]; then
  echo "Error: HTTP ${HTTP_CODE}" >&2
  if [[ "${HTTP_CODE}" == "429" ]]; then
    echo "Rate limited. Check Retry-After header." >&2
  fi
fi

# Output response
if [[ "${RAW}" == true ]]; then
  echo "${BODY}"
else
  if command -v jq &> /dev/null; then
    echo "${BODY}" | jq . 2>/dev/null || echo "${BODY}"
  else
    echo "${BODY}"
  fi
fi

# Exit with error code if request failed
if [[ "${HTTP_CODE}" -ge 400 ]]; then
  exit 1
fi
