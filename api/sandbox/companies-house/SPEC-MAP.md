# Companies House ↔ juskel MVP spec mapping

From **Data.html** — Business Identity & Verification data points.

| Spec field | Companies House source | Endpoint |
|------------|------------------------|----------|
| Company Name | `company_name` | `GET /company/{number}` |
| Company Number | `company_number` | `GET /company/{number}` |
| Registered Address | `registered_office_address` (address_line_1, locality, postal_code, country) | `GET /company/{number}` |
| SIC Code | `sic_codes[]` | `GET /company/{number}` |
| Incorporated Date | `date_of_creation` | `GET /company/{number}` |
| Directors | `officers[].name`, `officer_role`, `appointed_on` | `GET /company/{number}/officers` |
| PSCs | `name`, `natures_of_control`, `notified_on` | `GET /company/{number}/persons-with-significant-control` |
| Filing Status | `company_status` (+ recent filings in `filing-history`) | `GET /company/{number}` + `GET /company/{number}/filing-history` |

**Onboarding trust controls** (Supporting Platform Requirement):

- Company name + Companies House match → `GET /search/companies?q={name}` then compare `title` / `company_number`
- Company registration number → validate via `GET /company/{number}`

Run `./explore-spec.sh` to fetch all of the above for one company and print a coverage report.
