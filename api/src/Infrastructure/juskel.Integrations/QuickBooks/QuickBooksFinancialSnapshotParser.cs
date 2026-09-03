using System.Globalization;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace juskel.Integrations.QuickBooks;

internal static partial class QuickBooksFinancialSnapshotParser
{
    private static readonly HashSet<string> LoanAccountTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "Long Term Liability",
        "Other Current Liability",
        "Credit Card",
    };

    private static readonly HashSet<string> LoanAccountSubTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "NotesPayable",
        "LineOfCredit",
        "LoanPayable",
        "OtherLongTermLiabilities",
        "CreditCard",
    };

    public static QuickBooksFinancialSnapshot Parse(
        JsonDocument companyInfo,
        JsonDocument profitAndLoss,
        JsonDocument? profitAndLossPrior,
        JsonDocument balanceSheet,
        JsonDocument agedReceivables,
        JsonDocument agedPayables,
        JsonDocument cashFlow,
        IReadOnlyList<QuickBooksAccountSummary> accounts,
        DateOnly periodStart,
        DateOnly periodEnd,
        DateOnly? priorPeriodEnd,
        DateOnly balanceSheetAsOf)
    {
        var companyName = ReadCompanyName(companyInfo);
        var currency = ReadCurrency(profitAndLoss) ?? ReadCurrency(balanceSheet) ?? "GBP";
        var hasReportData = !ReadNoReportData(profitAndLoss);
        var priorHasReportData = profitAndLossPrior is not null && !ReadNoReportData(profitAndLossPrior);

        var annualRevenue = hasReportData
            ? ReadReportAmount(profitAndLoss, "Income", "Total Income")
            : null;
        var priorAnnualRevenue = priorHasReportData && profitAndLossPrior is not null
            ? ReadReportAmount(profitAndLossPrior, "Income", "Total Income")
            : null;

        var grossProfit = hasReportData
            ? ReadReportAmount(profitAndLoss, "GrossProfit", "Gross Profit")
            : null;
        var operatingProfit = hasReportData
            ? ReadReportAmount(profitAndLoss, "NetOperatingIncome", "Net Operating Income", "Operating Income")
            : null;
        var netIncome = hasReportData
            ? ReadReportAmount(profitAndLoss, "NetIncome", "Net Income")
            : null;
        var priorNetIncome = priorHasReportData && profitAndLossPrior is not null
            ? ReadReportAmount(profitAndLossPrior, "NetIncome", "Net Income")
            : null;

        var ebitda = hasReportData ? DeriveEbitda(profitAndLoss, netIncome) : null;

        var buckets = BucketAccounts(accounts);
        var cashBalance = buckets.CashBank;

        var accountsReceivable = FindAmountByLabels(agedReceivables, "Total", "TOTAL")
            ?? (buckets.Receivables > 0m ? buckets.Receivables : null);
        var accountsPayable = FindAmountByLabels(agedPayables, "Total", "TOTAL")
            ?? (buckets.Payables > 0m ? buckets.Payables : null);

        var currentAssets = FindAmountByLabels(balanceSheet, "Total Current Assets", "Current Assets");
        var currentLiabilities = FindAmountByLabels(balanceSheet, "Total Current Liabilities", "Current Liabilities");
        var totalAssets = FindAmountByLabels(balanceSheet, "TOTAL ASSETS", "Total Assets");
        var totalLiabilities = FindTotalLiabilities(balanceSheet);
        var totalEquity = FindAmountByLabels(balanceSheet, "Total Equity", "Net Assets", "TOTAL EQUITY");

        decimal? workingCapital = currentAssets is not null && currentLiabilities is not null
            ? currentAssets - currentLiabilities
            : null;

        var operatingCashFlow = FindAmountByLabels(
            cashFlow,
            "Net cash provided by operating activities",
            "Net Cash Provided by Operating Activities");

        var currentRatio = SafeDivide(currentAssets, currentLiabilities);
        var debtToAssets = SafeDivide(totalLiabilities, totalAssets);
        var profitMargin = SafeDivide(netIncome, annualRevenue);
        var revenueGrowth = GrowthRate(annualRevenue, priorAnnualRevenue);
        var netIncomeGrowth = GrowthRate(netIncome, priorNetIncome);

        return new QuickBooksFinancialSnapshot(
            companyName,
            currency,
            hasReportData,
            priorHasReportData,
            periodStart,
            periodEnd,
            priorPeriodEnd,
            balanceSheetAsOf,
            annualRevenue,
            priorAnnualRevenue,
            grossProfit,
            operatingProfit,
            netIncome,
            priorNetIncome,
            ebitda,
            cashBalance,
            accountsReceivable,
            accountsPayable,
            currentAssets,
            currentLiabilities,
            workingCapital,
            totalAssets,
            totalLiabilities,
            totalEquity,
            buckets.LoanDebt,
            operatingCashFlow,
            currentRatio,
            debtToAssets,
            profitMargin,
            revenueGrowth,
            netIncomeGrowth,
            buckets.AccountCount);
    }

    private static decimal? DeriveEbitda(JsonDocument profitAndLoss, decimal? netIncome)
    {
        if (netIncome is null)
            return null;

        var interest = FindExpenseAmount(profitAndLoss, "Interest");
        var tax = FindExpenseAmount(profitAndLoss, "Tax", "Income Tax");
        var depreciation = FindExpenseAmount(profitAndLoss, "Depreciation");
        var amortization = FindExpenseAmount(profitAndLoss, "Amortization");

        var total = netIncome.Value;
        var hasAddBack = false;

        foreach (var part in new[] { interest, tax, depreciation, amortization })
        {
            if (part is null)
                continue;

            total += part.Value;
            hasAddBack = true;
        }

        return hasAddBack ? total : null;
    }

    private static AccountBuckets BucketAccounts(IReadOnlyList<QuickBooksAccountSummary> accounts)
    {
        decimal cash = 0m;
        decimal receivables = 0m;
        decimal payables = 0m;
        decimal loanDebt = 0m;

        foreach (var account in accounts)
        {
            var balance = account.CurrentBalance;
            var accountType = account.AccountType;
            var subtype = account.AccountSubType;

            if (string.Equals(accountType, "Bank", StringComparison.OrdinalIgnoreCase))
                cash += balance;

            if (string.Equals(accountType, "Accounts Receivable", StringComparison.OrdinalIgnoreCase)
                || string.Equals(subtype, "AccountsReceivable", StringComparison.OrdinalIgnoreCase))
            {
                receivables += balance;
            }

            if (string.Equals(accountType, "Accounts Payable", StringComparison.OrdinalIgnoreCase)
                || string.Equals(subtype, "AccountsPayable", StringComparison.OrdinalIgnoreCase))
            {
                payables += Math.Abs(balance);
            }

            if (IsLoanAccount(accountType, subtype))
                loanDebt += Math.Abs(balance);
        }

        return new AccountBuckets(cash, receivables, payables, loanDebt, accounts.Count);
    }

    private static bool IsLoanAccount(string? accountType, string? subtype)
    {
        var matchesType = accountType is not null && LoanAccountTypes.Contains(accountType);
        var matchesSubtype = subtype is not null && LoanAccountSubTypes.Contains(subtype);

        if (!matchesType && !matchesSubtype)
            return false;

        if (string.Equals(subtype, "AccountsPayable", StringComparison.OrdinalIgnoreCase)
            || string.Equals(subtype, "PayrollTaxPayable", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (accountType is not null && accountType.Contains("Payable", StringComparison.OrdinalIgnoreCase))
            return false;

        return true;
    }

    private static decimal? FindTotalLiabilities(JsonDocument balanceSheet)
    {
        var explicitTotal = FindAmountByLabels(balanceSheet, "Total Liabilities", "TOTAL LIABILITIES");
        if (explicitTotal.HasValue)
            return explicitTotal;

        return FindAmountByLabels(balanceSheet, "Total Liabilities And Equity");
    }

    private static string ReadCompanyName(JsonDocument companyInfo)
    {
        if (companyInfo.RootElement.TryGetProperty("CompanyInfo", out var info)
            && info.TryGetProperty("CompanyName", out var name))
        {
            return name.GetString() ?? string.Empty;
        }

        return string.Empty;
    }

    private static string? ReadCurrency(JsonDocument report)
    {
        if (report.RootElement.TryGetProperty("Header", out var header)
            && header.TryGetProperty("Currency", out var currency))
        {
            return currency.GetString();
        }

        return null;
    }

    private static bool ReadNoReportData(JsonDocument report)
    {
        if (!report.RootElement.TryGetProperty("Header", out var header)
            || !header.TryGetProperty("Option", out var options))
        {
            return false;
        }

        foreach (var option in options.EnumerateArray())
        {
            if (option.TryGetProperty("Name", out var name)
                && name.GetString() == "NoReportData"
                && option.TryGetProperty("Value", out var value)
                && string.Equals(value.GetString(), "true", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }
        }

        return false;
    }

    private static decimal? ReadReportAmount(
        JsonDocument report,
        string group,
        params string[] summaryLabels)
    {
        if (!report.RootElement.TryGetProperty("Rows", out var rows))
            return null;

        foreach (var label in summaryLabels)
        {
            var byGroup = FindAmountInRows(rows, group, label);
            if (byGroup.HasValue)
                return byGroup;
        }

        return FindAmountByLabels(report, summaryLabels);
    }

    private static decimal? FindAmountInRows(JsonElement rowsNode, string group, string summaryLabel)
    {
        if (!rowsNode.TryGetProperty("Row", out var rowArray))
            return null;

        foreach (var row in rowArray.EnumerateArray())
        {
            if (row.TryGetProperty("group", out var groupEl)
                && groupEl.GetString() == group
                && row.TryGetProperty("Summary", out var summary))
            {
                var amount = ReadColDataAmount(summary, summaryLabel);
                if (amount.HasValue)
                    return amount;
            }

            if (row.TryGetProperty("Rows", out var nested))
            {
                var nestedAmount = FindAmountInRows(nested, group, summaryLabel);
                if (nestedAmount.HasValue)
                    return nestedAmount;
            }
        }

        return null;
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

    private static decimal? FindExpenseAmount(JsonDocument report, params string[] needles)
    {
        if (!report.RootElement.TryGetProperty("Rows", out var rows))
            return null;

        var needlesNorm = needles.Select(NormalizeLabel).ToArray();
        return FindExpenseAmountInRows(rows, needlesNorm);
    }

    private static decimal? FindExpenseAmountInRows(JsonElement rowsNode, string[] needlesNorm)
    {
        if (!rowsNode.TryGetProperty("Row", out var rowArray))
            return null;

        foreach (var row in rowArray.EnumerateArray())
        {
            if (row.TryGetProperty("ColData", out var colData))
            {
                var items = colData.EnumerateArray().ToList();
                if (items.Count > 0)
                {
                    var label = items[0].TryGetProperty("value", out var labelEl) ? labelEl.GetString() : null;
                    if (label is not null
                        && needlesNorm.Any(n => NormalizeLabel(label).Contains(n, StringComparison.Ordinal)))
                    {
                        var amount = ReadAmountFromColData(items);
                        if (amount.HasValue)
                            return Math.Abs(amount.Value);
                    }
                }
            }

            if (row.TryGetProperty("Rows", out var nested))
            {
                var nestedAmount = FindExpenseAmountInRows(nested, needlesNorm);
                if (nestedAmount.HasValue)
                    return nestedAmount;
            }
        }

        return null;
    }

    private static decimal? ReadColDataAmount(JsonElement summary, string expectedLabel)
    {
        if (!summary.TryGetProperty("ColData", out var colData))
            return null;

        var items = colData.EnumerateArray().ToList();
        if (items.Count == 0)
            return null;

        var label = items[0].TryGetProperty("value", out var labelEl) ? labelEl.GetString() : null;
        if (!string.Equals(label, expectedLabel, StringComparison.OrdinalIgnoreCase))
            return null;

        return ReadAmountFromColData(items);
    }

    private static decimal? ReadAmountFromColData(List<JsonElement> items)
    {
        if (items.Count < 2)
            return null;

        return ParseDecimal(items[^1].TryGetProperty("value", out var valueEl) ? valueEl.GetString() : null);
    }

    private static decimal? SafeDivide(decimal? numerator, decimal? denominator)
    {
        if (numerator is null || denominator is null || denominator == 0m)
            return null;

        return numerator / denominator;
    }

    private static decimal? GrowthRate(decimal? current, decimal? prior)
    {
        if (current is null || prior is null || prior == 0m)
            return null;

        return (current - prior) / Math.Abs(prior.Value);
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

    private readonly record struct AccountBuckets(
        decimal CashBank,
        decimal Receivables,
        decimal Payables,
        decimal LoanDebt,
        int AccountCount);
}
