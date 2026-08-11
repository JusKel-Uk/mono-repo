# juskel API

Backend API for the juskel platform.

## Tech Stack

- **.NET 10**
- **SQL Server**

## Documentation

Hostable technology documentation lives in [`documentation/`](documentation/). It is a static HTML site organised by feature module (schematics, flow, ideations, implementation).

**Local preview:** open `documentation/index.html` or run `python3 -m http.server 8080` from that folder.

**Deploy to Netlify** (from this `api/` folder):

```bash
./deploy-docs           # preview URL
./deploy-docs --prod    # production
```

First-time setup: `netlify login`, then `cd documentation && netlify link`.

See [`documentation/README.md`](documentation/README.md) for full Netlify setup.

## Azure CLI

Azure CLI is used to manage Container Apps, SQL, and other Azure resources from your terminal.

**Check status** (from this `api/` folder):

```bash
./az-check
```

**First-time login** (interactive — opens browser):

```bash
az login
az account list --output table
az account set --subscription "<your-subscription>"
./az-check
```

Installed: `azure-cli` 2.89.0 + `containerapp` extension (for Azure Container Apps).

## Deploy API to Azure Container Apps

From this `api/` folder:

```bash
cp deploy-azure.env.example deploy-azure.env   # fill in secrets — never commit
./deploy-azure.sh bootstrap                  # once: providers + ACR + environment
./deploy-azure.sh deploy                     # build image in ACR + deploy app
./deploy-azure.sh status                     # show URL and scale settings
```

After deploy, hit `https://<fqdn>/health` (in-memory only — no DB ping per budget rules).

Set `ASPNETCORE_ENVIRONMENT=Development` in `deploy-azure.env` for the dev Container App (enables `/swagger`). Use `Production` only for real prod.

**Email image storage:** `./provision-storage.sh` (Azure Blob, container `email`).

**SQL note:** Your server already has `AllowAllWindowsAzureIps`, so Container Apps can reach Azure SQL without a per-IP firewall rule.

## Status

Project scaffolding is pending. Setup instructions will be added here once the API is initialized.

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/en-us/sql-server)
