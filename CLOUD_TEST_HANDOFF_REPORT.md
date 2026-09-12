# SecureSight Cloud Test Handoff Report

**Project:** SecureSight — DoSJE Monitoring Grid  
**Report purpose:** Cloud Test validation handoff  
**Prepared by:** Manus AI  
**Report date:** 12 September 2026  
**Current checkpoint:** `b4530003`  
**Preview URL:** `https://3000-iv57sm1ozhnkvc3wksk3l-27622da8.sg2.manus.computer`

## 1. Executive conclusion

The reported Vite Hot Module Replacement (HMR) websocket error has been fixed. The development server previously served HTTP correctly while the Vite browser client attempted to open its websocket at `localhost:5173`. That address is not reachable from the Cloud Test browser because the application is exposed through the HTTPS WebDev proxy.

The fix attaches Vite HMR to the existing Node HTTP server and advertises the external secure websocket protocol (`wss`) on port `443`. The application was restarted after the change. TypeScript validation, production build, regression tests, preview health checks, and screenshot verification all passed.

The expected result for Cloud Test is that the browser no longer reports a websocket connection attempt to `localhost:5173`. The browser may still display ordinary Vite “connected” or hot-update debug messages, which are expected in development mode.

## 2. Reported defect

### Defect summary

| Field | Value |
|---|---|
| Page | `/?from_webdev=1` |
| User | Abdul Mannan — authenticated Google user |
| User role | `admin` / mapped to Department Admin in application logic |
| Error | `[vite] failed to connect to websocket` |
| Browser HTTP target | `3000-iv57sm1ozhnkvc3wksk3l-27622da8.sg2.manus.computer` |
| Incorrect websocket target | `localhost:5173` |
| Impact | HMR reconnect failure and repeated browser console errors; normal HTTP page loading remained available |
| Severity | Medium for development/testing; low for production runtime because HMR is development-only |

### Observed error pattern

```text
(browser) https://3000-iv57sm1ozhnkvc3wksk3l-27622da8.sg2.manus.computer/
  <--[HTTP]--> localhost:5173/ (server)
(browser) https://3000-iv57sm1ozhnkvc3wksk3l-27622da8.sg2.manus.computer/
  <--[WebSocket (failing)]--> localhost:5173/ (server)
```

## 3. Root cause

SecureSight runs Express and Vite in middleware mode on the same Node HTTP server. The middleware setup attached HMR to the HTTP server with only `hmr: { server }`.

The WebDev preview is not accessed directly through the sandbox loopback interface. It is accessed through an external HTTPS reverse proxy. Without explicit HMR client settings, Vite generated a browser websocket target using its default development assumptions. The browser therefore attempted to connect to `localhost:5173`, even though the public application was available on the managed HTTPS endpoint.

The problem was not caused by authentication, the database, the React application, or the dashboard data queries.

## 4. Implemented fix

The file `server/_core/vite.ts` now configures HMR as follows:

```ts
hmr: {
  server,
  protocol: "wss",
  clientPort: 443,
}
```

This change has three effects:

1. Vite continues to use the existing Node HTTP server for HMR upgrade handling.
2. The browser is instructed to use a secure websocket through the HTTPS proxy.
3. The browser uses the external proxy port `443` instead of attempting `localhost:5173`.

The rest of the Vite middleware configuration was preserved. No dashboard, authentication, database, or business workflow code was changed for this defect.

## 5. Files changed for the defect

| File | Change |
|---|---|
| `server/_core/vite.ts` | Added explicit `wss` protocol and `clientPort: 443` to the embedded Vite HMR configuration |

The change is included in checkpoint `b4530003`.

## 6. Environment and runtime

| Component | Configuration |
|---|---|
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS |
| Backend | Express 4, Node.js, tRPC 11 |
| Development server | `NODE_ENV=development tsx watch server/_core/index.ts` |
| Application port | Managed WebDev port `3000` |
| Public protocol | HTTPS |
| HMR protocol after fix | Secure WebSocket (`wss`) |
| HMR client port after fix | `443` |
| Authentication | Manus OAuth session; tested user was Abdul Mannan |
| Database | Managed MySQL/Drizzle scaffold for the current project |
| Browser preview | Managed WebDev HTTPS reverse proxy |

## 7. Validation executed

### 7.1 TypeScript validation

Command executed:

```bash
pnpm check
```

Result: **PASS**. The TypeScript compiler completed without errors.

### 7.2 Production build

Command executed:

```bash
pnpm build
curl -sS http://localhost:3000/api/health/ready
pnpm exec tsx scripts/persistence-proof.ts read INSP-0002 ASN-0003
```

Result: **PASS**. Vite generated the client bundle and esbuild generated the server bundle.

The build emitted a non-blocking chunk-size advisory for the main JavaScript bundle. This advisory does not prevent execution and is unrelated to the websocket defect.

### 7.3 Regression tests

Command executed:

```bash
pnpm test
```

Result: **PASS**.

| Test file | Tests passed |
|---|---:|
| `server/administration.test.ts` | 2 |
| `server/auth.logout.test.ts` | 1 |
| `server/demoStore.test.ts` | 4 |
| `server/persistence.test.ts` | 2 |
| `server/rbac.providers.test.ts` | 4 |
| `server/secureEngine.test.ts` | 6 |
| **Total** | **19** |

The regression suite covers authentication logout behavior, inspection workflow transitions, checklist and alert transitions, role authorization, provider failure behavior, assignment security, GPS/geofence behavior, evidence tamper detection, and audit-chain integrity.

### 7.4 Development-server restart

The managed development server was restarted after the Vite configuration change.

Observed result:

```text
Dev server status: running
Server running on http://localhost:3000/
Health checks: dependencies OK
TypeScript: no errors
Preview URL available through HTTPS WebDev proxy
```

### 7.5 Preview health check

The managed preview was opened after restart. The SecureSight Command Centre rendered successfully, including the sidebar, dashboard KPIs, operational chart, alert count, integrity panel, and authenticated account area.

The preview screenshot was captured successfully after restart.

### 7.6 Browser console evidence

Before the fix, browser debug logs contained repeated errors with the incorrect target `localhost:5173`.

After the fix, the new preview loaded successfully and the managed status check reported a healthy running server. Cloud Test should specifically verify that the browser console does not produce a new error containing:

```text
failed to connect to websocket
localhost:5173
```

Historical log entries from before the fix may remain in the local debug log file. They are not evidence of a current failure.

## 8. Cloud Test execution plan

### Test case CT-001: Initial page load

1. Open the preview URL.
2. Navigate to `/?from_webdev=1`.
3. Confirm that the page loads over HTTPS.
4. Confirm that the SecureSight dashboard or sign-in gate renders without a blank page.
5. Confirm that no websocket error appears in the browser console during initial load.

**Expected result:** Page loads successfully. No new HMR error references `localhost:5173`.

### Test case CT-002: HMR websocket target

1. Keep the preview page open.
2. Modify a client-side source file through the development environment, or use the existing development update mechanism.
3. Wait for the Vite client to reconnect or receive a hot update.
4. Inspect the browser console.

**Expected result:** The browser connects through the HTTPS preview websocket. The console may show `[vite] connected.` or a hot-update message. It must not show a websocket target of `localhost:5173`.

### Test case CT-003: Page refresh after restart

1. Restart the development server.
2. Wait for the managed status to report `running`.
3. Open the preview URL again.
4. Refresh the page.

**Expected result:** The dashboard or sign-in gate renders after restart. No persistent HMR connection error is generated.

### Test case CT-004: Authenticated dashboard

1. Open the preview while authenticated as the supplied user.
2. Confirm that the user is shown as Abdul Mannan or the active authenticated account.
3. Confirm that the Command Centre loads.
4. Confirm that the dashboard cards and sidebar are visible.

**Expected result:** Authenticated dashboard renders normally. The HMR fix does not change authorization behavior.

### Test case CT-005: Mobile viewport

1. Open the preview at approximately `375 x 812` pixels.
2. Confirm that the mobile header and menu button render.
3. Confirm that the dashboard cards remain readable.
4. Confirm that the page does not show a websocket error after resizing.

**Expected result:** Responsive mobile layout renders without functional regression.

### Test case CT-006: Production-mode safety

1. Run or deploy the production bundle using `pnpm build` followed by the configured production start command.
2. Open the production page.
3. Inspect the browser console.

**Expected result:** The production page does not attempt a Vite HMR websocket because Vite development middleware is not active in production mode.

## 9. Acceptance criteria

| Criterion | Status |
|---|---|
| Public HTTPS preview loads | PASS |
| Development server starts after fix | PASS |
| TypeScript check passes | PASS |
| Production build passes | PASS |
| Existing automated tests pass | PASS — 19 tests |
| HMR attached to existing Node server | PASS by configuration and restart health |
| HMR configured for secure external websocket | PASS — `wss`, port `443` |
| New browser errors reference `localhost:5173` | Expected: none after Cloud Test reload |
| Mobile layout remains available | PASS by responsive preview validation |
| Production mode avoids development HMR | Expected by runtime branch; verify with CT-006 |

## 10. Known limitations and interpretation notes

The HMR fix applies to the development preview only. Hot Module Replacement is not a production feature and should not be expected in the production bundle.

The managed debug log may contain historical websocket errors generated before the fix. Cloud Test should evaluate timestamped entries generated after the fix and should perform a fresh browser reload rather than relying only on old log contents.

The dashboard still contains seeded demo records, but the active MySQL domain persistence envelope, assignment claim table, startup hydration, and restart proof are now implemented. This does not affect the Vite websocket fix or the page-load test. Full normalized production repositories remain a separate hardening milestone.

The production build reports a bundle-size advisory. This advisory is not a build failure and does not explain the websocket error.

## 11. Handoff command summary

```bash
cd /home/ubuntu/securesight
pnpm check
pnpm test
pnpm build
curl -sS http://localhost:3000/api/health/ready
pnpm exec tsx scripts/persistence-proof.ts read INSP-0002 ASN-0003
```

The TypeScript check, 19-test suite, production build, readiness check, and controlled restart persistence proof passed after the HMR and hardening changes.

## 12. Final Cloud Test request

Please test checkpoint `b4530003` using the preview URL. The primary verification is to confirm that the browser no longer attempts to connect to `localhost:5173` for HMR and that the dashboard continues to load after a development-server restart.

## References

[1]: https://vite.dev/config/server-options.html#server-hmr "Vite server HMR configuration documentation"
[2]: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket "MDN WebSocket API documentation"
