# Feature Specification: TLS/WSS Support for OpenClaw WebSocket

**Feature Branch**: `20260220-tls-wss`
**Created**: 2026-02-20
**Status**: Draft
**Input**: TLS/WSS対応 — OpenClaw WebSocket接続のセキュア化

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pro User Secure Chat Connection (Priority: P1)

As a Pro user, I want my AI twin chat connection to be encrypted so that my conversations and authentication tokens cannot be intercepted by attackers.

**Why this priority**: Security is the primary driver. All chat messages and the gateway_token are currently transmitted in plaintext over `ws://`, making them vulnerable to man-in-the-middle attacks. This directly impacts user trust and OWASP Mobile Top 10 compliance (M3: Insecure Communication).

**Independent Test**: Can be tested by verifying that a Pro user's WebSocket connection uses `wss://` protocol and that the TLS handshake completes successfully before any chat data is exchanged.

**Acceptance Scenarios**:

1. **Given** a Pro user with a running OpenClaw instance, **When** the app initiates a WebSocket connection, **Then** the connection uses `wss://{ip}:443` via nginx reverse proxy with TLS encryption, and the gateway_token is never transmitted in plaintext.
2. **Given** a Pro user's Droplet is newly provisioned, **When** cloud-init completes, **Then** nginx is running as a TLS-terminating reverse proxy on port 443 with a self-signed certificate, proxying to OpenClaw on localhost:18789.
3. **Given** a Pro user connects via `wss://`, **When** the self-signed certificate is presented, **Then** the React Native WebSocket client accepts the connection (self-signed cert tolerance for IP-based connections).

---

### User Story 2 - Health Check Over TLS (Priority: P2)

As the system, health checks must connect via the same TLS-encrypted path to accurately verify that the full connection chain (nginx + OpenClaw) is working.

**Why this priority**: If health checks bypass TLS (connecting directly to port 18789), they can't detect nginx/TLS configuration issues, leading to false positives where health checks pass but user connections fail.

**Independent Test**: Can be tested by running the health-check Edge Function against a provisioned instance and verifying it connects via `wss://` on port 443.

**Acceptance Scenarios**:

1. **Given** a running OpenClaw instance with nginx TLS proxy, **When** the health-check Edge Function executes, **Then** it connects via `wss://{ip}:443` (not `ws://{ip}:18789`).
2. **Given** nginx is down but OpenClaw is running on 18789, **When** the health check runs, **Then** it reports unhealthy (because the full chain is broken).

---

### User Story 3 - Backward-Compatible Provisioning (Priority: P2)

As the system, new Droplets must be provisioned with nginx + TLS automatically, while existing running instances continue to work until re-provisioned.

**Why this priority**: There may be existing running instances using `ws://`. The transition must not break them. New provisioning uses TLS; existing instances are upgraded on next restart/re-provision.

**Independent Test**: Can be tested by provisioning a new Droplet and verifying nginx is installed, self-signed cert is generated, and port 443 is open.

**Acceptance Scenarios**:

1. **Given** a new Pro user completes payment, **When** provision-openclaw runs, **Then** the cloud-init script installs nginx, generates a self-signed certificate, configures reverse proxy (443 → 18789), and opens port 443 via UFW.
2. **Given** an existing instance running without TLS, **When** the user triggers a restart, **Then** the instance is re-provisioned with the new TLS-enabled cloud-init script.

---

### Edge Cases

- What happens when nginx crashes but OpenClaw is still running?
  - Health check fails (connects to 443 which is down), instance marked as unhealthy after threshold
- What happens when the self-signed certificate expires (365-day default)?
  - Certificate is regenerated on each fresh provisioning; for long-running instances, a renewal mechanism or monitoring alert is needed
- What happens when a user's app has strict certificate validation?
  - React Native's WebSocket implementation on iOS/Android accepts self-signed certificates for IP-based connections when configured appropriately; if not, a custom SSL pinning bypass for development/self-signed certs is needed
- What happens during the transition period when some instances have TLS and some don't?
  - The client detects the connection mode and falls back to `ws://` if `wss://` fails, ensuring continuity
- What happens if port 443 is already in use on the Droplet?
  - cloud-init checks for port conflicts; the docker-20-04 image has no services on 443 by default

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST configure nginx as a TLS-terminating reverse proxy on port 443 during Droplet provisioning, proxying WebSocket connections to OpenClaw on localhost:18789
- **FR-002**: System MUST generate a self-signed TLS certificate (RSA 2048-bit, 365-day validity) during cloud-init, with the Droplet's IP address as the CN/SAN
- **FR-003**: System MUST update UFW firewall rules to allow port 443/tcp and close direct access to port 18789 from external networks (only localhost access)
- **FR-004**: Mobile app MUST connect to `wss://{ip}:443` instead of `ws://{ip}:18789` for all WebSocket connections
- **FR-005**: Health-check Edge Function MUST connect via `wss://{ip}:443` instead of `ws://{ip}:18789`
- **FR-006**: System MUST clean up cloud-init scripts containing gateway_token after execution (`rm -f /var/lib/cloud/instance/user-data.txt`)
- **FR-007**: System MUST support a transition period where the client falls back to `ws://` if `wss://` connection fails, to support existing pre-TLS instances [NEEDS CLARIFICATION: Should we support fallback to ws:// for existing instances, or force all instances to be re-provisioned?]

### Key Entities

- **Nginx Reverse Proxy**: TLS-terminating proxy listening on port 443, forwarding to localhost:18789 with WebSocket upgrade headers
- **Self-Signed Certificate**: RSA 2048-bit certificate stored at `/etc/nginx/ssl/selfsigned.{crt,key}`, valid for 365 days, CN set to the Droplet's IP address
- **UFW Firewall Rules**: Port 443 open externally, port 18789 restricted to localhost only

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of newly provisioned Droplets have nginx running on port 443 with a valid TLS certificate within 5 minutes of provisioning
- **SC-002**: All WebSocket connections from the mobile app use `wss://` protocol (verified via network traffic inspection)
- **SC-003**: gateway_token is never transmitted in plaintext over the network
- **SC-004**: Health check Edge Function detects nginx failures within 15 minutes (existing threshold)
- **SC-005**: Zero downtime for existing Pro users during the transition to TLS

## Assumptions

- The `docker-20-04` DigitalOcean image has `apt-get` available and can install nginx and openssl packages during cloud-init
- React Native's WebSocket implementation can connect to `wss://` endpoints with self-signed certificates on both iOS and Android (may require custom SSL handling)
- No domain name is available per-Droplet; TLS is IP-based with self-signed certificates (Let's Encrypt requires a domain)
- Existing instances without TLS will be upgraded on their next restart or re-provisioning cycle
- Port 443 is not used by any other service on the docker-20-04 base image
