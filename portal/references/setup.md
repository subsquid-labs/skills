# Set Up a Coding Agent for SQD Portal

Use this when the user asks to be set up for SQD Portal, for example after pasting the prompt from the Portal app's "Onboard your agent" card. Finish what applies, then report what is configured and what the user still has to do.

## 1. Connect the Portal MCP server

The hosted server is `https://portal.sqd.dev/mcp`. It needs no account and no key.

Check whether the client already has it before adding a second copy (`claude mcp list`, `codex mcp list`, or the `mcpServers` entries in Cursor's `mcp.json`).

| Client | Command or config |
|---|---|
| Claude Code | `claude mcp add --transport http sqd-portal https://portal.sqd.dev/mcp` |
| Codex | `codex mcp add sqd-portal --url https://portal.sqd.dev/mcp` |
| Cursor | `{"mcpServers": {"sqd-portal": {"url": "https://portal.sqd.dev/mcp"}}}` in `mcp.json` |
| VS Code | `{"servers": {"sqd-portal": {"type": "http", "url": "https://portal.sqd.dev/mcp"}}}` in `.vscode/mcp.json` |
| Claude (web, desktop) | Add the [SQD connector](https://claude.ai/directory/connectors/sqd) from the Claude Directory |

Other clients take the same URL as a streamable HTTP server. The [Portal MCP Server](https://docs.sqd.dev/en/ai/mcp-server) page has the current steps.

If the skills were installed with `npx skills add`, add the MCP endpoint directly. The SQD plugins for Claude Code, Codex and Cursor bundle the same skills, so installing a plugin as well gives the agent two copies.

Most clients load a new MCP server only in a new session. Tell the user to restart the client, then confirm the `portal_` tools are listed.

## 2. Decide whether a key is needed

- The public Portal (`https://portal.sqd.dev`) and the MCP server need no key. Stop here if that is all the user wants.
- A plan with an API key, or a dedicated Portal, uses a key on every Stream API request. The paths and request bodies are the same as on the public Portal; only the base URL and the key header differ.

Do not ask for a key when the public Portal answers the user's need.

## 3. Have the user create a key

The user creates keys in the Portal app at <https://portal.sqd.dev/app>, under **API keys** for their organization. A key:

- starts with `sqd_prt_`
- is named for the service that uses it
- may be limited to chosen chains, and may have an expiry date
- counts its usage toward the organization's plan
- reaches the portals within five minutes of being created or changed

The user copies the token into their own secret store or `.env` file. Never ask them to paste the token into chat, and never print it.

Use the Portal base URL that the user's plan gives them. Ask for it if the project does not record it; do not guess a hostname.

## 4. Store the key outside version control

Use these names, which the SQD docs also use:

```bash
# .env (untracked)
SQD_PORTAL_URL=<base URL of the user's Portal, without /datasets>
SQD_PORTAL_API_KEY=<the user pastes the key here>
```

- Add both names with placeholder values to `.env.example`.
- Check that `.env` is in `.gitignore`, and add it if it is missing.
- For a hosted service, put the key in the platform's secret variables instead of a file.

See the credential rules in `../SKILL.md` (External Data Boundary) and, for indexers, `pipes-sdk/references/CREDENTIALS.md`.

## 5. Send the key

Send `Authorization: Bearer <key>`. Portal also accepts `x-api-key: <key>`. When a request carries both, Portal reads `Authorization`, and an `Authorization` header it cannot use is refused without falling back to `x-api-key`.

**curl.** Read the header from a process substitution so the key never appears in the command's arguments:

```bash
curl -sS --compressed -X POST "$SQD_PORTAL_URL/datasets/ethereum-mainnet/stream" \
  -H 'content-type: application/json' \
  -H @<(printf 'Authorization: Bearer %s\n' "$SQD_PORTAL_API_KEY") \
  -d '{"type":"evm","fromBlock":20000000,"toBlock":20000000,"fields":{"block":{"number":true}}}'
```

**Pipes SDK.** Pass the key as a header on the Portal client:

```ts
portal: {
  url: `${process.env.SQD_PORTAL_URL}/datasets/ethereum-mainnet`,
  http: {
    headers: { authorization: `Bearer ${process.env.SQD_PORTAL_API_KEY}` },
  },
},
```

`http` replaces the HTTP client settings as a whole. Keep any existing options, such as `retryAttempts`, next to `headers`.

**Squid SDK** (`@subsquid/evm-stream` or `@subsquid/solana-stream`): `.setPortal({ url, http: { headers } })` with the same header. The docs guide is [Dedicated Portal key](https://docs.sqd.dev/en/sdk/squid-sdk/evm/guides/migration/portal-api-key). A squid still on `.setGateway()` uses a v2 gateway key instead; see the `migrate-to-portal` skill.

**Ponder on Portal** reads `PORTAL_API_KEY` and sends it as `x-api-key`.

## 6. Verify

Run the one-block stream request from the curl example above on a dataset the key covers. A `200` with one NDJSON line means the key works. Test with a stream request, since that is what the user's client sends; a `200` from `/head` or `/metadata` does not show that the key is accepted. Every credential problem answers `403`; branch on `error.code`:

| `code` | What to tell the user |
|---|---|
| `missing_credential` | The request carried no key. Check that the variable is loaded in this process. |
| `invalid_credential` | The key is wrong or incomplete. Copy it again from the Portal app. |
| `revoked_credential` | The key was revoked. Create a new one. |
| `expired_credential` | The key passed its expiry date. Create a new one. |
| `portal_not_allowed` | The key's plan does not include this Portal. Check the base URL. |
| `dataset_not_allowed` | The key is not allowed this chain. Add the chain to the key in the Portal app, or use another dataset. |

A key that is less than five minutes old, or a chain that was just added, can still answer `403`. Wait and retry once before changing anything.

A `529` with `"code": "overloaded"` is a capacity answer, not a key problem. Wait the `Retry-After` seconds and send the request again.

## 7. Report

Tell the user, in a few lines:

- which MCP client entry was added, and whether a restart is needed
- which file holds the Portal URL and the key variable, and that the value was not read or printed
- whether the key check passed, and if not, the `error.code` and the fix from the table above
