// OWNER: 05-playground-ui.md — do not edit from another role
// REST-client-style layout over role 03's `endpoints` catalog + `sendRequest` (BUILD_PROMPT.md
// §4a). No status/latency/body math happens here — every response byte comes straight from
// `sendRequest`'s return value; this file only renders it and wires the three toggles.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Chip } from "@/components/ui/Chip";
import { JsonView } from "@/components/ui/JsonView";
import { mulberry32 } from "@/lib/sim/prng";
import { endpoints, resetPlaygroundState, sendRequest } from "@/lib/sim/apiPlayground";
import type { MockEndpoint } from "@/lib/types";

interface SendRequestOutput {
  status: number;
  body: unknown;
  latencyMs: number;
  headers: Record<string, string>;
}

interface HistoryEntry {
  id: number;
  endpoint: MockEndpoint;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  response: SendRequestOutput;
}

type AuthToken = "valid" | "expired";
type DownstreamHealth = "up" | "degraded" | "down";

function endpointLabel(endpoint: MockEndpoint): string {
  return `${endpoint.method} ${endpoint.path}`;
}

function buildRequestHeaders(
  idempotencyEnabled: boolean,
  idempotencyKey: string,
  authToken: AuthToken,
): Record<string, string> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    authorization: authToken === "valid" ? "Bearer live_sk_9f2c4a" : "Bearer expired_sk_1a0021",
  };
  if (idempotencyEnabled && idempotencyKey.trim().length > 0) {
    headers["idempotency-key"] = idempotencyKey.trim();
  }
  return headers;
}

function statusClass(status: number): string {
  if (status >= 200 && status < 300) return "text-accent-success";
  if (status === 400 || status === 401 || status === 409 || status === 429) return "text-accent-warn";
  if (status >= 500) return "text-accent-error";
  return "text-text-primary";
}

function randomIdemKey(rng: () => number): string {
  let out = "";
  for (let i = 0; i < 10; i++) out += Math.floor(rng() * 36).toString(36);
  return `idem_${out}`;
}

export interface ApiPlaygroundProps {
  seed: number;
}

export default function ApiPlayground({ seed }: ApiPlaygroundProps) {
  const rngRef = useRef(mulberry32(seed));
  const idCounterRef = useRef(0);

  const [endpointIndex, setEndpointIndex] = useState(0);
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => randomIdemKey(mulberry32(seed)));
  const [authToken, setAuthToken] = useState<AuthToken>("valid");
  const [downstreamHealth, setDownstreamHealth] = useState<DownstreamHealth>("up");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const endpoint = endpoints[endpointIndex] ?? endpoints[0];

  const [bodyText, setBodyText] = useState(() =>
    endpoint && endpoint.sampleRequest !== null ? JSON.stringify(endpoint.sampleRequest, null, 2) : "",
  );

  // Reseeding (PlaygroundTabs remounts this component with `key={seed}`) starts a fresh,
  // reproducible session: clear the module-level idempotency cache / rate-limit window that
  // apiPlayground.ts keeps between calls, so a shared seed replays identically from a clean slate.
  useEffect(() => {
    resetPlaygroundState();
  }, []);

  // "Adjusting state when a prop changes" (React's recommended render-time pattern, not an
  // effect): switching endpoints resets the body editor to that endpoint's sample request.
  const [priorEndpointIndex, setPriorEndpointIndex] = useState(endpointIndex);
  if (priorEndpointIndex !== endpointIndex) {
    setPriorEndpointIndex(endpointIndex);
    setBodyText(endpoint && endpoint.sampleRequest !== null ? JSON.stringify(endpoint.sampleRequest, null, 2) : "");
  }

  const requestHeaders = useMemo(
    () => buildRequestHeaders(idempotencyEnabled, idempotencyKey, authToken),
    [idempotencyEnabled, idempotencyKey, authToken],
  );

  const parsedBody: unknown = useMemo(() => {
    if (!endpoint || endpoint.sampleRequest === null) return undefined;
    try {
      return JSON.parse(bodyText) as unknown;
    } catch {
      // Deliberately invalid JSON is a valid way to exercise the 400 path: sendRequest treats any
      // non-object body as producing every field error, since it can't read expected fields off it.
      return bodyText;
    }
  }, [bodyText, endpoint]);

  function handleSend() {
    if (!endpoint) return;
    const response = sendRequest({
      endpoint,
      idempotencyKey: idempotencyEnabled ? idempotencyKey.trim() || undefined : undefined,
      authToken,
      downstreamHealth,
      rng: rngRef.current,
      nowMs: Date.now(),
      requestBody: parsedBody,
    });
    const entry: HistoryEntry = {
      id: idCounterRef.current++,
      endpoint,
      requestHeaders,
      requestBody: parsedBody,
      response,
    };
    setHistory((prev) => [entry, ...prev].slice(0, 25));
    setSelectedId(entry.id);
  }

  const active = selectedId !== null ? history.find((h) => h.id === selectedId) : history[0];

  function handleSampleReset() {
    if (endpoint && endpoint.sampleRequest !== null) {
      setBodyText(JSON.stringify(endpoint.sampleRequest, null, 2));
    }
  }

  function handleInvalidBody() {
    setBodyText("{ this is not valid JSON");
  }

  return (
    <Panel title="API Playground — mock payments service" className="flex flex-col gap-4">
      <section aria-label="Endpoint selection">
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">Endpoint</p>
        <div className="flex flex-wrap gap-2">
          {endpoints.map((ep, i) => (
            <Chip key={endpointLabel(ep)} active={i === endpointIndex} onClick={() => setEndpointIndex(i)}>
              {endpointLabel(ep)}
            </Chip>
          ))}
        </div>
      </section>

      <section aria-label="Request toggles" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">Idempotency key</p>
          <div className="flex gap-2">
            <Chip active={!idempotencyEnabled} onClick={() => setIdempotencyEnabled(false)}>
              off
            </Chip>
            <Chip active={idempotencyEnabled} onClick={() => setIdempotencyEnabled(true)}>
              on
            </Chip>
          </div>
          {idempotencyEnabled ? (
            <div className="mt-2 flex items-center gap-2">
              <label htmlFor="idem-key-input" className="sr-only">
                Idempotency key value
              </label>
              <input
                id="idem-key-input"
                type="text"
                value={idempotencyKey}
                onChange={(e) => setIdempotencyKey(e.target.value)}
                className="w-full rounded-panel border border-border bg-bg px-2 py-1 font-mono text-xs text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
              />
              <button
                type="button"
                onClick={() => setIdempotencyKey(randomIdemKey(rngRef.current))}
                className="rounded-panel border border-border px-2 py-1 font-mono text-xs text-text-secondary hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
              >
                regenerate
              </button>
            </div>
          ) : null}
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">Auth token</p>
          <div className="flex gap-2">
            <Chip active={authToken === "valid"} onClick={() => setAuthToken("valid")}>
              valid
            </Chip>
            <Chip active={authToken === "expired"} onClick={() => setAuthToken("expired")}>
              expired
            </Chip>
          </div>
        </div>

        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">Downstream health</p>
          <div className="flex gap-2">
            <Chip active={downstreamHealth === "up"} onClick={() => setDownstreamHealth("up")}>
              up
            </Chip>
            <Chip active={downstreamHealth === "degraded"} onClick={() => setDownstreamHealth("degraded")}>
              degraded
            </Chip>
            <Chip active={downstreamHealth === "down"} onClick={() => setDownstreamHealth("down")}>
              down
            </Chip>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-label="Request" className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Request</p>
          <p className="font-mono text-sm text-text-primary">{endpointLabel(endpoint ?? endpoints[0]!)}</p>
          <div>
            <p className="mb-1 font-mono text-xs text-text-muted">Headers</p>
            <ul className="rounded-panel border border-border bg-bg p-2 font-mono text-xs text-text-secondary">
              {Object.entries(requestHeaders).map(([k, v]) => (
                <li key={k}>
                  <span className="text-syntax-key">{k}</span>: {v}
                </li>
              ))}
            </ul>
          </div>
          {endpoint && endpoint.sampleRequest !== null ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="font-mono text-xs text-text-muted">Body (editable JSON)</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSampleReset}
                    className="font-mono text-xs text-accent-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                  >
                    reset sample
                  </button>
                  <button
                    type="button"
                    onClick={handleInvalidBody}
                    className="font-mono text-xs text-accent-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
                  >
                    send invalid body
                  </button>
                </div>
              </div>
              <label htmlFor="req-body-input" className="sr-only">
                Request body JSON
              </label>
              <textarea
                id="req-body-input"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={6}
                spellCheck={false}
                className="w-full rounded-panel border border-border bg-bg p-2 font-mono text-xs text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
              />
              <p className="mt-1 font-mono text-xs text-text-muted">Preview</p>
              <JsonView data={parsedBody} />
            </div>
          ) : (
            <p className="font-mono text-xs text-text-muted">No request body for this method.</p>
          )}
          <button
            type="button"
            onClick={handleSend}
            className="mt-2 self-start rounded-panel border border-accent-primary bg-accent-primary/10 px-4 py-2 font-mono text-sm text-accent-primary transition-colors duration-150 ease-out hover:bg-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
          >
            Send
          </button>
        </section>

        <section aria-label="Response" className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wide text-text-muted">Response</p>
          {active ? (
            <>
              <p className={`font-mono text-sm font-medium ${statusClass(active.response.status)}`}>
                {active.response.status} · {active.response.latencyMs}ms
              </p>
              {active.response.status === 429 && active.response.headers["retry-after"] ? (
                <p
                  role="status"
                  className="rounded-panel border border-accent-warn bg-accent-warn/10 px-3 py-2 font-mono text-xs text-accent-warn"
                >
                  Rate limited — Retry-After: {active.response.headers["retry-after"]}s
                </p>
              ) : null}
              {active.response.status === 409 && active.response.headers["idempotency-replayed"] ? (
                <p className="rounded-panel border border-border bg-bg px-3 py-2 font-mono text-xs text-text-secondary">
                  Idempotency replay — response below is the exact object cached from the original
                  call, not regenerated.
                </p>
              ) : null}
              <div>
                <p className="mb-1 font-mono text-xs text-text-muted">Headers</p>
                <ul className="rounded-panel border border-border bg-bg p-2 font-mono text-xs text-text-secondary">
                  {Object.entries(active.response.headers).map(([k, v]) => (
                    <li key={k} className={k === "retry-after" ? "text-accent-warn" : undefined}>
                      <span className="text-syntax-key">{k}</span>: {v}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 font-mono text-xs text-text-muted">Body</p>
                <JsonView data={active.response.body} />
              </div>
            </>
          ) : (
            <p className="font-mono text-xs text-text-muted">Send a request to see the response here.</p>
          )}
        </section>
      </div>

      <section aria-label="Request history">
        <p className="mb-2 font-mono text-xs uppercase tracking-wide text-text-muted">
          History ({history.length})
        </p>
        {history.length === 0 ? (
          <p className="font-mono text-xs text-text-muted">No calls yet this session.</p>
        ) : (
          <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(entry.id)}
                  aria-current={entry.id === active?.id}
                  className={`flex w-full items-center justify-between gap-2 rounded-panel border px-2 py-1 font-mono text-xs transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 ${
                    entry.id === active?.id
                      ? "border-accent-primary text-text-primary"
                      : "border-border text-text-secondary hover:text-text-primary"
                  }`}
                >
                  <span>{endpointLabel(entry.endpoint)}</span>
                  <span className={statusClass(entry.response.status)}>{entry.response.status}</span>
                  <span className="text-text-muted">{entry.response.latencyMs}ms</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Panel>
  );
}
