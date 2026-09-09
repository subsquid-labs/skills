# Credentials for Indexers and Database Tools

Use credentials already authorized for the target. Keep their values out of tool
arguments, terminal output, chat, generated summaries, and version control.
Environment variables keep values out of command arguments but are still visible
to privileged processes and Docker administrators; they are not a secret vault.
Never run `set -x`, dump `.env`, or inspect a container's environment to recover a
password. Report missing variable names or a redacted authentication failure.

## Local ClickHouse

Have the existing secret manager or launcher inject `CLICKHOUSE_PASSWORD` into
the process environment. Do not put a literal assignment into an agent command.
Export an already injected shell variable without displaying its value:

```bash
: "${CLICKHOUSE_PASSWORD:?Configure CLICKHOUSE_PASSWORD through your secret provider}"
export CLICKHOUSE_PASSWORD
docker run -d --name clickhouse \
  -p 127.0.0.1:8123:8123 -p 127.0.0.1:9000:9000 \
  -e CLICKHOUSE_USER=default -e CLICKHOUSE_PASSWORD \
  -v clickhouse-data:/var/lib/clickhouse \
  clickhouse/clickhouse-server:latest

# The client reads CLICKHOUSE_USER/CLICKHOUSE_PASSWORD inside this container.
docker exec clickhouse clickhouse-client --query "SELECT 1"
```

All `docker exec ... clickhouse-client` examples assume the container already has
these variables or a configured client credential file. For an existing server
using another secret mechanism, use its protected ClickHouse client config with
`--config /path/inside/container/client.xml`; do not guess a password or read
server secrets into the conversation. Verify with `SELECT 1` before mutations.

The indexer can read its environment or a local `.env` file populated by the
secret provider. Keep secret files outside version control and restrict access
to their owner (directory mode `700`, file mode `600`). Parse dotenv as data;
do not `source` it as shell code. Configure Compose to require the same secret:

```yaml
environment:
  CLICKHOUSE_PASSWORD: ${CLICKHOUSE_PASSWORD:?Configure CLICKHOUSE_PASSWORD}
```

Replace CLI-generated demo passwords before shared or hosted use. For the
optional PostgreSQL container, inject and export `POSTGRES_PASSWORD` the same way.

## ClickHouse Cloud over HTTP

Have the credential provider provision an owner-readable netrc file outside
version control, such as `.secrets/clickhouse.netrc`. It must contain a `machine`
entry for the exact Cloud hostname, its login, and password; do not use a
`default` entry. Never generate it with a secret-bearing shell command or print
its contents. Set `CLICKHOUSE_NETRC` to the file path, not its contents.

```bash
curl --fail --silent --show-error --max-time 10 \
  --netrc-file "$CLICKHOUSE_NETRC" \
  'https://[service-id].[region].aws.clickhouse.cloud:8443/' \
  --data-binary 'SELECT 1'
```

Use the confirmed HTTPS hostname and normal TLS validation. Do not add redirect
following, verbose tracing, or credential-bearing URLs. For Portal API keys, use
an equivalent protected curl config containing the header for the confirmed
host, or an HTTP client that reads the key from its process environment without
logging requests. Keep keys out of saved query bodies and public exports.

## MCP and Hosted Applications

Use an already configured connector when available. For a new MCP server, use
the client's documented secret store or environment injection at server launch;
do not pass password values to `claude mcp add -e` or store them in a shared
project configuration. Check the client's supported mechanism before configuring
it. Hosted indexers should use the deployment platform's secret variables or
secret manager rather than secret-bearing CLI arguments. Missing secret access
requires the owner to configure it through that secure interface.

## References

- [ClickHouse client configuration and environment variables](https://clickhouse.com/docs/concepts/features/interfaces/client)
- [curl netrc files](https://everything.curl.dev/usingcurl/netrc.html)
