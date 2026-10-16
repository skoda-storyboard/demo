# App Builder integration for the asset sync (SKODA-511): what it takes to connect

*Review note, 2026-10-16. It goes deeper on [`SKODA-ASSET-INGESTION-M2.md`](SKODA-ASSET-INGESTION-M2.md) §3F. Nothing
here is built or provisioned. Sources are Adobe's documentation as read on 2026-10-16, linked per fact; the research
notes with every citation are in `.migration/app-builder-review/`.*

## Summary

The job needs **four connections**, and each one has its own credential:

| # | Connection | Credential | Status |
|---|---|---|---|
| 1 | AEM Assets **events** → Runtime action | OAuth server-to-server (S2S) credential in the App Builder workspace (Developer Console) | Documented. Needs the entitlement and an admin on an AEM product profile |
| 2 | Job → AEM **author** (QueryBuilder, asset metadata) | **AEM service credentials** (JWT technical account from the AEM Developer Console). Classic endpoints like QueryBuilder don't take S2S tokens | Documented. Client AEM admin creates it |
| 3 | Job → **DA** (write the feed sheets) | Undocumented for machines. DA shows only `Bearer {IMS token}` | **Must be tested**: does `admin.da.live` accept an S2S token, and with which `permissions` entry |
| 4 | Job → **admin.hlx.page** (preview, publish) | Site **admin API key** with the `publish` role | Documented, ready to use |

Four findings change the §3F design:

1. **Touch UI edits send no events.** `metadata_updated` **and `deleted`** fire only for Assets View and the Assets
   OpenAPI. Moves and deletes in the Touch UI send no `unpublished` either. Unless Škoda's DAM team works in Assets
   View, events alone can't keep the feed correct. A frequent incremental sweep has to carry the load; events only
   shorten the delay.
2. **The event payload carries the DAM path** (`data.repositoryMetadata["repo:path"]`), not only the `assetId`. The
   event action needs no lookup.
3. **No SLA.** AEM doesn't guarantee that every event is sent. I/O Events delivers at least once, unordered, with
   possible duplicates, and retries only on 429/5xx for 24 h. There's no dead-letter queue.
4. **QueryBuilder needs the JWT service credential**, a second credential beside the workspace's S2S one. The
   alternative is the Assets Author OpenAPI (S2S), whose `search` is marked experimental and whose coverage of our
   custom `skoda:*` metadata is unverified.

## 1. What the client must provide

These are blocking, in order. Owner = the role in Škoda's Adobe org.

| # | Item | Owner | Notes |
|---|---|---|---|
| C1 | **App Builder entitlement** on the IMS org that owns `p220607` | Škoda / Adobe account team | Licensed in packs with AEM; there is no trial ([FAQ](https://developer.adobe.com/app-builder/docs/intro_and_overview/faq)). Confirm which IMS org the AEM program sits in |
| C2 | Developer access: our developers get the **Developer** role, plus an App Builder product profile | Org **System Admin** | Needed to create the project and deploy |
| C3 | **Developer Console project** from the App Builder template, with **Stage** and **Production** workspaces | Developer (us, once C2 is done) | Each workspace has its own Runtime namespace (`orgId-project-workspace`), its own State store and its own credentials; nothing carries over |
| C4 | **I/O Events → AEM Assets** added to each workspace, environment `e2281243`, event types below, with the preselected **OAuth S2S** credential | Developer | The person subscribing must be an **admin on an AEM product profile of that environment** ([enable events](https://developer.adobe.com/experience-cloud/experience-manager-apis/guides/events/#enable-aem-events-on-your-aem-cloud-service-environment)) |
| C5 | **AEM service credentials** (JWT) for author `e2281243` | Client **AEM admin** (Cloud Manager → Developer Console) | Token lifetime 24 h. Stored as an App Builder secret ([server-side tokens](https://experienceleague.adobe.com/en/docs/experience-manager-cloud-service/content/implementing/developing/generating-access-tokens-for-server-side-apis)) |
| C6 | A **product profile** for that technical account, and **read** on `/content/dam/storyboard` for the AEM group it becomes | Admin Console admin + AEM admin | The profile appears as a group on author after the first call. Narrower than *AEM Administrators* |
| C7 | Policy answers: will an **IP allow-list** be applied to author? Which UI does the DAM team use (Touch UI vs Assets View)? | Client | Today author answers the internet (probe 2026-10-16: login 200, QueryBuilder 401 without credentials). I/O Runtime egress IPs are not static: `aio runtime ip-list get` lists the current ranges, which change, or we route through a fixed-IP proxy |

Optional, only if we move off QueryBuilder (§4): the environment must be on AEM release **2024.10.18459** or later
with the new product profiles. The S2S client id must go into an `allowedClientIDs` file (`kind: "API"`) deployed
by a Cloud Manager config pipeline. Without it, calls return 403
([setup](https://experienceleague.adobe.com/en/docs/experience-manager-learn/cloud-service/aem-apis/openapis/setup)).

## 2. What the team sets up

| # | Item | Notes |
|---|---|---|
| T1 | **Site admin API key**, role `publish` | `POST admin.hlx.page/config/{org}/sites/{site}/apiKeys.json`, sent as `Authorization: token …`. At most 365 days; rotation is create-new, swap, delete-old. The value is shown once. Needs the `admin` role to create ([admin API](https://www.aem.live/docs/admin.html)) |
| T2 | **DA write access for the S2S technical account** | Test first (§5 V1). If it works: add the account to the org `permissions` sheet for `/en/media-feed/**`, write only. If it doesn't: fallbacks in §6 |
| T3 | **App repository** `skoda-storyboard/asset-sync` (separate from this site repo: every file committed here is served) | Headless app: no UI, no extension point. `aio app init` from the template, `aio app add ci` for the GitHub workflows |
| T4 | **Secrets**: AEM service credential JSON, EDS API key, DA/feed settings, all per workspace in `.env` → action `inputs` | Adobe encrypts default parameters at rest and decrypts them only when the action runs ([security](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/security-general)). CI needs `AIO_RUNTIME_NAMESPACE` + `AIO_RUNTIME_AUTH` per workspace as GitHub environment secrets |
| T5 | **Stage target** | Stage writes to a non-published path (e.g. `/drafts/media-feed-stage/`, preview only). Production writes `/en/media-feed/` and publishes. Only Production publishes |
| T6 | **Feed registry cache** | Test a `cache-control` entry for the registry path in `headers.json` (needs `config_admin`, §5 V2). Without it the registry keeps `max-age=7200` on aem.live |

## 3. App shape (`app.config.yaml`)

```yaml
application:
  runtimeManifest:
    packages:
      asset-sync:
        license: Apache-2.0
        actions:
          on-asset-event:          # I/O Events delivery: record and return (< 60 s)
            function: src/on-asset-event.js
            web: 'no'
            runtime: nodejs:22
            annotations: { require-adobe-auth: false, final: true }
            relations:
              event-listener-for: [aem-assets-author]   # registration name, below
          sweep:                    # every 15 min: dirty set + incremental QueryBuilder since the watermark
            function: src/sweep.js
            web: 'no'
            runtime: nodejs:22
            limits: { timeout: 3600000, memory: 512 }
            inputs: { AEM_SERVICE_CREDENTIAL: $AEM_SERVICE_CREDENTIAL, EDS_API_KEY: $EDS_API_KEY }
          reconcile:                # nightly full rebuild + delete detection
            function: src/reconcile.js
            web: 'no'
            runtime: nodejs:22
            limits: { timeout: 10800000, memory: 1024 }
            inputs: { AEM_SERVICE_CREDENTIAL: $AEM_SERVICE_CREDENTIAL, EDS_API_KEY: $EDS_API_KEY }
        triggers:
          every-15-min: { feed: /whisk.system/alarms/interval, inputs: { minutes: 15 } }
          nightly:      { feed: /whisk.system/alarms/alarm, inputs: { cron: '0 2 * * *' } }   # UTC
        rules:
          sweep-rule:     { trigger: every-15-min, action: sweep }
          reconcile-rule: { trigger: nightly, action: reconcile }
  events:
    registrations:
      aem-assets-author:
        description: AEM Assets author events for the media feed
        events_of_interest:
          - provider_metadata: aem    # exact provider id/metadata: from the Console after C4 (undocumented for YAML)
            event_codes:
              - aem.assets.asset.published
              - aem.assets.asset.unpublished
              - aem.assets.asset.deleted
              - aem.assets.asset.metadata_updated
```

The shape follows the [alarms](https://developer.adobe.com/app-builder/docs/guides/runtime_guides/reference_docs/prepackages)
and [events](https://developer.adobe.com/events/docs/guides/appbuilder/) guides. Two things to check when we build it:
- the timeouts need `limits.timeout` (the default is 60 s; up to 3 h non-blocking);
- the event provider id for YAML registration isn't documented. Create the registration in the Console once, then
  copy it into the file.

### Behaviour

- **on-asset-event:** validates nothing itself (Adobe checks the signature for a non-web action), de-duplicates on the
  event `id`, writes `dirty:<assetId>` = `{ path, type, ts }` to State (region **emea**, TTL 7 days) and returns
  200. It must never call AEM or DA: it has 60 s, and returning a 5xx causes 24 h of retries.
- **sweep (every 15 min):**
  - takes a lock in State; overlapping alarms skip;
  - reads the dirty set (`list('dirty:*')`, eventually consistent, so it re-checks against author);
  - adds assets whose `jcr:lastModified` or `cq:lastReplicated` is after the stored watermark (QueryBuilder on author).
    This is the part that covers **Touch UI** edits and publishes;
  - rebuilds only the touched SKODA-517 shards, writes them to DA, bulk-previews and publishes them, publishes the
    registry last, then advances the watermark and clears the processed ids.
- **reconcile (nightly):** a full QueryBuilder pass over published assets under `/content/dam/storyboard`. Builds every
  shard under a new build id, swaps the registry atomically, and **drops rows for assets that no longer exist or are
  unpublished**. That covers Touch UI deletes and moves, which send no event. It also writes a run report (counts,
  drift, failures) next to the registry.

The design keeps everything that's large out of Runtime's 1 MB limits: shard content goes to DA directly, and no action
returns data.

## 4. QueryBuilder (JWT) or Assets OpenAPI (S2S)

| | QueryBuilder + AEM service credentials | Assets Author OpenAPI + S2S |
|---|---|---|
| Credential | A second credential (JWT, 24 h), created by the client in Cloud Manager | The workspace S2S credential only |
| Setup | Product profile + AEM group read | Environment on 2024.10 or later, `allowedClientIDs` via a config pipeline, Assets API Users profile |
| Query | Exactly what we need today: path, `cq:lastReplicated`, `jcr:lastModified`, our `skoda:*` properties, `cq:tags` | `POST /adobe/assets/search` (marked *experimental*) plus `GET /adobe/assets/{assetId}/metadata`. **Unverified:** custom `skoda:*` properties and the tag-id ↔ `cq:tags` mapping. There's no `cq:lastReplicated`; `aem:published` comes closest |
| Fit now | ✅ Recommended for the first release | Revisit once search is stable and V5 passes |

## 5. Verifications before the build (cheap, in order)

| # | Check | How | Unblocks |
|---|---|---|---|
| V1 | **DA accepts an S2S token** | With the workspace credential: `GET admin.da.live/list/skoda-storyboard/demo/en/` and read `x-da-actions`. Then a write to `/drafts/` after adding the technical account (`…@techacct.adobe.com` or the org id) to the `permissions` sheet | T2, or a fallback (§6) |
| V2 | **Custom `cache-control`** on one JSON path | `headers.json` entry for a `/drafts/` sheet; compare aem.page and aem.live response headers | Registry freshness (T6) |
| V3 | **`published` fires for Touch UI** Quick Publish, Manage Publication and workflow publishing | Publish one test asset each way in `e2281243`; read Debug Tracing in the Console | How much the sweep must carry |
| V4 | **QueryBuilder with the service credential** returns `skoda:*`, `cq:tags`, `cq:lastReplicated` | One query against `/content/dam/storyboard` | §4 choice |
| V5 | **OpenAPI metadata** returns custom properties | `GET /adobe/assets/{id}/metadata` on one asset with `skoda:sourceUrl` | The §4 alternative |
| V6 | **An alarm-started action runs non-blocking** past 60 s with `limits.timeout` | Stage: a sleep action on an interval trigger | Sweep and reconcile timings |

## 6. If DA rejects machine tokens (V1 fails)

Options, best first:
1. **Ask Adobe** for the supported service-identity path into DA (the content source is DA, so the feed has to be
   written there to be previewed and published).
2. **Serve the feed from a BYOM overlay**: the job keeps the shards in App Builder Files or State, and the site's
   content config points the feed paths at a markup endpoint. To verify: overlay support for `.json`, caching, and
   Files being US-only.
3. **Keep the M1 shape**: the job builds the shards and opens a PR to a data repo, or hands them to a scheduled
   GitHub Action that pushes with a named user's token. That works, but it's a person's credential and a weaker
   audit trail. Last resort.

## 7. Operating it

- **Limits:**
  - 100 concurrent activations per namespace;
  - 600 trigger firings per minute;
  - 1 MB payload and result;
  - admin API 10 requests/second per project, at most 500 pending bulk jobs.

  A bulk 504a publish of thousands of assets lands as dirty keys and one sweep, well inside these.
- **State quotas:** production workspace 1 GB and 200K keys (more by ticket). The dirty set and watermarks are small.
- **Logs and alerting:**
  - `aio app logs`; activations and logs are kept 7 days. Forward them to the client's log tool (Splunk, Azure Log
    Analytics and New Relic are supported);
  - Org admins get an email when an event registration turns unstable or disabled;
  - Add a **freshness monitor**: alert when the registry's `built` timestamp is older than 2 h.
- **Recovery:** the event journal keeps 7 days, and the nightly reconcile repairs anything missed.
- **Fallback runtime:** the sweep and reconcile core is a plain Node module, so the same code runs as a scheduled
  GitHub Action if the entitlement is late. In that case there are no events, only the 15-minute sweep.

## 8. Order of work

1. Client: C1, C2 (entitlement, roles). Ask now; it's the long pole.
2. Team: T3 skeleton, then V1, V2 and V6 on Stage as soon as the project exists. V1 decides T2 or a §6 fallback.
3. Client: C4 and C5 + C6; then V3 and V4.
4. Build SKODA-511 against SKODA-517's shapes on Stage. Run it beside the M1 generator and compare row by row.
5. Production cutover; the source-listing generator retires.
