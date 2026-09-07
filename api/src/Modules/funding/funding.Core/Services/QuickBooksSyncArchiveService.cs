using System.Text.Json;
using funding.Core.Entities;
using funding.Core.Persistence;
using juskel.Integrations.QuickBooks;
using Microsoft.EntityFrameworkCore;

namespace funding.Core.Services;

internal static class QuickBooksSyncArchiveService
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    internal static async Task UpsertAsync(
        FundingDbContext db,
        Guid applicationId,
        string externalRealmId,
        DateOnly periodStart,
        DateOnly periodEnd,
        QuickBooksRawPayloads raw,
        QuickBooksExtendedSnapshot extended,
        CancellationToken ct)
    {
        var archive = await db.QuickBooksSyncArchives
            .FirstOrDefaultAsync(a => a.ApplicationId == applicationId, ct);

        archive ??= new QuickBooksSyncArchive { ApplicationId = applicationId };

        archive.ExternalRealmId = externalRealmId;
        archive.SyncedAt = DateTime.UtcNow;
        archive.PeriodStart = periodStart;
        archive.PeriodEnd = periodEnd;
        archive.CompanyInfoJson = raw.CompanyInfoJson;
        archive.ProfitAndLossJson = raw.ProfitAndLossJson;
        archive.ProfitAndLossPriorJson = raw.ProfitAndLossPriorJson;
        archive.BalanceSheetJson = raw.BalanceSheetJson;
        archive.AgedReceivablesJson = raw.AgedReceivablesJson;
        archive.AgedPayablesJson = raw.AgedPayablesJson;
        archive.CashFlowJson = raw.CashFlowJson;
        archive.AccountsJson = raw.AccountsJson;
        archive.ExtendedSnapshotJson = JsonSerializer.Serialize(extended, JsonOptions);

        if (db.Entry(archive).State == EntityState.Detached)
            db.QuickBooksSyncArchives.Add(archive);
    }
}
