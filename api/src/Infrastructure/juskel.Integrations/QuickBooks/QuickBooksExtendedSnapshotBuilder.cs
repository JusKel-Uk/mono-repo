using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace juskel.Integrations.QuickBooks;

internal static partial class QuickBooksExtendedSnapshotBuilder
{
    public static QuickBooksExtendedSnapshot Build(
        string externalRealmId,
        QuickBooksRawPayloads raw,
        bool hasReportData,
        bool priorPeriodHasReportData)
    {
        using var companyInfo = JsonDocument.Parse(raw.CompanyInfoJson);
        using var profitAndLoss = JsonDocument.Parse(raw.ProfitAndLossJson);
        using var profitAndLossPrior = JsonDocument.Parse(raw.ProfitAndLossPriorJson);
        using var balanceSheet = JsonDocument.Parse(raw.BalanceSheetJson);
        using var agedReceivables = JsonDocument.Parse(raw.AgedReceivablesJson);
        using var agedPayables = JsonDocument.Parse(raw.AgedPayablesJson);
        using var cashFlow = JsonDocument.Parse(raw.CashFlowJson);
        using var accountsDoc = JsonDocument.Parse(raw.AccountsJson);

        var company = ReadCompanyInfo(companyInfo);
        var accounts = ReadAccounts(accountsDoc);
        var reportLines = new List<QuickBooksReportLine>();
        reportLines.AddRange(WalkReportLines("profitAndLoss", profitAndLoss));
        reportLines.AddRange(WalkReportLines("profitAndLossPrior", profitAndLossPrior));
        reportLines.AddRange(WalkReportLines("balanceSheet", balanceSheet));
        reportLines.AddRange(WalkReportLines("agedReceivables", agedReceivables));
        reportLines.AddRange(WalkReportLines("agedPayables", agedPayables));
        reportLines.AddRange(WalkReportLines("cashFlow", cashFlow));

        return new QuickBooksExtendedSnapshot(
            externalRealmId,
            company,
            accounts,
            reportLines,
            ReadAgingBuckets(agedReceivables),
            ReadAgingBuckets(agedPayables),
            ReadCashFlowSections(cashFlow),
            hasReportData,
            priorPeriodHasReportData);
    }

    private static QuickBooksCompanyInfo ReadCompanyInfo(JsonDocument companyInfo)
    {
        if (!companyInfo.RootElement.TryGetProperty("CompanyInfo", out var info))
            return new QuickBooksCompanyInfo(string.Empty, null, null, null, null, null);

        var companyName = info.TryGetProperty("CompanyName", out var nameEl) ? nameEl.GetString() ?? string.Empty : string.Empty;
        var legalName = info.TryGetProperty("LegalName", out var legalEl) ? legalEl.GetString() : null;
        var country = info.TryGetProperty("Country", out var countryEl) ? countryEl.GetString() : null;
        var fiscalYearStartMonth = info.TryGetProperty("FiscalYearStartMonth", out var fiscalEl)
            ? fiscalEl.GetString()
            : null;

        string? email = null;
        if (info.TryGetProperty("Email", out var emailObj)
            && emailObj.TryGetProperty("Address", out var addressEl))
        {
            email = addressEl.GetString();
        }

        DateOnly? companyStartDate = null;
        if (info.TryGetProperty("CompanyStartDate", out var startEl)
            && DateOnly.TryParse(startEl.GetString(), CultureInfo.InvariantCulture, out var parsed))
        {
            companyStartDate = parsed;
        }

        return new QuickBooksCompanyInfo(
            companyName,
            legalName,
            country,
            email,
            fiscalYearStartMonth,
            companyStartDate);
    }

    private static IReadOnlyList<QuickBooksAccountDetail> ReadAccounts(JsonDocument accountsDoc)
    {
        var accounts = new List<QuickBooksAccountDetail>();
        if (!accountsDoc.RootElement.TryGetProperty("QueryResponse", out var queryResponse)
            || !queryResponse.TryGetProperty("Account", out var accountArray))
        {
            return accounts;
        }

        foreach (var account in accountArray.EnumerateArray())
        {
            accounts.Add(new QuickBooksAccountDetail(
                account.TryGetProperty("Id", out var idEl) ? idEl.GetString() : null,
                account.TryGetProperty("Name", out var nameEl) ? nameEl.GetString() : null,
                account.TryGetProperty("AccountType", out var typeEl) ? typeEl.GetString() : null,
                account.TryGetProperty("AccountSubType", out var subtypeEl) ? subtypeEl.GetString() : null,
                account.TryGetProperty("Classification", out var classEl) ? classEl.GetString() : null,
                account.TryGetProperty("CurrentBalance", out var balanceEl) ? balanceEl.GetDecimal() : 0m,
                account.TryGetProperty("CurrencyRef", out var currencyRef)
                    && currencyRef.TryGetProperty("value", out var currencyEl)
                    ? currencyEl.GetString()
                    : null));
        }

        return accounts;
    }

    private static IReadOnlyList<QuickBooksReportLine> WalkReportLines(string reportName, JsonDocument report)
    {
        var lines = new List<QuickBooksReportLine>();
        if (!report.RootElement.TryGetProperty("Rows", out var rows))
            return lines;

        WalkRows(reportName, rows, null, lines);
        return lines;
    }

    private static void WalkRows(
        string reportName,
        JsonElement rowsNode,
        string? group,
        List<QuickBooksReportLine> lines)
    {
        if (!rowsNode.TryGetProperty("Row", out var rowArray))
            return;

        foreach (var row in rowArray.EnumerateArray())
        {
            var rowGroup = row.TryGetProperty("group", out var groupEl) ? groupEl.GetString() : group;

            foreach (var source in new[] { row, row.TryGetProperty("Summary", out var summary) ? summary : default })
            {
                if (source.ValueKind == JsonValueKind.Undefined)
                    continue;

                if (!source.TryGetProperty("ColData", out var colData))
                    continue;

                var items = colData.EnumerateArray().ToList();
                if (items.Count < 2)
                    continue;

                var label = items[0].TryGetProperty("value", out var labelEl) ? labelEl.GetString() : null;
                if (string.IsNullOrWhiteSpace(label))
                    continue;

                var amount = ParseDecimal(items[^1].TryGetProperty("value", out var valueEl) ? valueEl.GetString() : null);
                if (amount is null)
                    continue;

                lines.Add(new QuickBooksReportLine(reportName, label, rowGroup, amount));
            }

            if (row.TryGetProperty("Rows", out var nested))
                WalkRows(reportName, nested, rowGroup, lines);
        }
    }

    private static QuickBooksAgingBuckets? ReadAgingBuckets(JsonDocument report)
    {
        var total = FindAmountByLabels(report, "Total", "TOTAL");
        var current = FindAmountByLabels(report, "Current", "CURRENT");
        var days1To30 = FindAmountByLabels(report, "1 - 30", "1-30", "1 to 30");
        var days31To60 = FindAmountByLabels(report, "31 - 60", "31-60", "31 to 60");
        var days61To90 = FindAmountByLabels(report, "61 - 90", "61-90", "61 to 90");
        var daysOver90 = FindAmountByLabels(report, "91 and over", "91+", "> 90", "91 and Over");

        if (total is null && current is null && days1To30 is null)
            return null;

        return new QuickBooksAgingBuckets(total, current, days1To30, days31To60, days61To90, daysOver90);
    }

    private static QuickBooksCashFlowSections? ReadCashFlowSections(JsonDocument cashFlow)
    {
        var operating = FindAmountByLabels(
            cashFlow,
            "Net cash provided by operating activities",
            "Net Cash Provided by Operating Activities");
        var investing = FindAmountByLabels(
            cashFlow,
            "Net cash provided by investing activities",
            "Net Cash Provided by Investing Activities",
            "Net cash used in investing activities",
            "Net Cash Used in Investing Activities");
        var financing = FindAmountByLabels(
            cashFlow,
            "Net cash provided by financing activities",
            "Net Cash Provided by Financing Activities",
            "Net cash used in financing activities",
            "Net Cash Used in Financing Activities");
        var netChange = FindAmountByLabels(
            cashFlow,
            "Net cash increase for period",
            "Net Cash Increase for Period",
            "Net cash decrease for period",
            "Net Cash Decrease for Period",
            "Net change in cash",
            "Net Change in Cash");

        if (operating is null && investing is null && financing is null && netChange is null)
            return null;

        return new QuickBooksCashFlowSections(operating, investing, financing, netChange);
    }

    private static decimal? FindAmountByLabels(JsonDocument report, params string[] labels)
    {
        if (!report.RootElement.TryGetProperty("Rows", out var rows))
            return null;

        return FindAmountByLabelsInRows(rows, labels);
    }

    private static decimal? FindAmountByLabelsInRows(JsonElement rowsNode, params string[] labels)
    {
        var wanted = labels.Select(NormalizeLabel).ToHashSet(StringComparer.Ordinal);

        if (!rowsNode.TryGetProperty("Row", out var rowArray))
            return null;

        foreach (var row in rowArray.EnumerateArray())
        {
            foreach (var source in new[] { row, row.TryGetProperty("Summary", out var summary) ? summary : default })
            {
                if (source.ValueKind == JsonValueKind.Undefined)
                    continue;

                if (!source.TryGetProperty("ColData", out var colData))
                    continue;

                var items = colData.EnumerateArray().ToList();
                if (items.Count == 0)
                    continue;

                var label = items[0].TryGetProperty("value", out var labelEl) ? labelEl.GetString() : null;
                if (label is null || !wanted.Contains(NormalizeLabel(label)))
                    continue;

                var amount = ReadAmountFromColData(items);
                if (amount.HasValue)
                    return amount;
            }

            if (row.TryGetProperty("Rows", out var nested))
            {
                var nestedAmount = FindAmountByLabelsInRows(nested, labels);
                if (nestedAmount.HasValue)
                    return nestedAmount;
            }
        }

        return null;
    }

    private static decimal? ReadAmountFromColData(List<JsonElement> items)
    {
        if (items.Count < 2)
            return null;

        return ParseDecimal(items[^1].TryGetProperty("value", out var valueEl) ? valueEl.GetString() : null);
    }

    private static decimal? ParseDecimal(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw) || raw is "-" or "—")
            return null;

        return decimal.TryParse(raw, NumberStyles.Number, CultureInfo.InvariantCulture, out var value)
            ? value
            : null;
    }

    private static string NormalizeLabel(string label) =>
        NonAlphaNumericRegex().Replace(label.ToLowerInvariant(), string.Empty);

    [GeneratedRegex(@"[^a-z0-9]+")]
    private static partial Regex NonAlphaNumericRegex();
}
