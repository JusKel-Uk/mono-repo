# Companies House sandbox

Docs: https://developer.company-information.service.gov.uk/

## Where to put your API key

```bash
cd api/sandbox/companies-house
cp secrets.env.example secrets.env
```

Edit **`secrets.env`** (gitignored):

```env
COMPANIES_HOUSE_API_KEY=paste-your-key-here
```

Get a key: register at https://developer.company-information.service.gov.uk/ → create an application → copy the API key.

Auth is HTTP Basic: **username = API key, password empty** (`curl -u "$KEY:"`).

## juskel spec fields (from Data.html)

| You need | API call |
|----------|----------|
| Company name, number, address, SIC, incorporated date, status | `GET /company/{number}` |
| Directors | `GET /company/{number}/officers` |
| PSCs | `GET /company/{number}/persons-with-significant-control` |
| Filing activity | `GET /company/{number}/filing-history` |
| Name ↔ number match (onboarding) | `GET /search/companies?q={name}` |

See **`SPEC-MAP.md`** for field-level mapping.

## Run all spec calls (recommended)

```bash
./explore-spec.sh                    # default company 00000006 (BBC)
./explore-spec.sh 12345678           # your test company number
```

This saves JSON under `responses/*.live.json` and prints a spec coverage report.

## Individual curl tests

```bash
./test.sh get-company
./test.sh search "your company name"
./test.sh officers
./test.sh psc
./test.sh filing-history
./test.sh explore 00000006
```

Base URL: `https://api.company-information.service.gov.uk`

## Web UI

Linked explorer — search → company details → all Public Data API endpoints.

```bash
cd ui
./run-ui.sh
# open http://127.0.0.1:8765
```

- Type a company name → click a suggestion → company details page
- Left sidebar: every company-scoped endpoint (profile, officers, PSC, filings, charges, etc.)
- List results have **View details →** to drill into child endpoints
- Home page: officer search, alphabetical search, advanced search
- Plain-language summary + collapsed JSON
- **Documents** sidebar: scan all filing history for downloadable PDFs/XBRL; open metadata and files via Document API

Includes Public Data API + **Document API** (metadata + content download). Does not include Streaming API or OAuth Filing APIs.
