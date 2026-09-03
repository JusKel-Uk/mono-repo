using funding.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace funding.Core.Examples;

public sealed class FinancialProfileResponseExample : IExamplesProvider<FinancialProfileResponse>
{
    public FinancialProfileResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        AnnualRevenueBand.From250KTo1M,
        EbitdaMarginBand.Margin5To15,
        ExistingDebtBand.NoDebt,
        CashReservesMonthsBand.From3To6Months,
        AvgMonthlyRevenueBand.From20KTo80K,
        true,
        false,
        [
            new IntegrationStatusDto(IntegrationProvider.OpenBanking, false, null, null),
            new IntegrationStatusDto(IntegrationProvider.Xero, false, null, null),
            new IntegrationStatusDto(IntegrationProvider.QuickBooks, true, DateTime.UtcNow, DateTime.UtcNow.AddHours(1)),
        ],
        [
            new EvidenceResponse(
                Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Guid.Parse("11111111-1111-1111-1111-111111111111"),
                "bank-statement.pdf",
                "application/pdf",
                512_000,
                DateTime.UtcNow),
        ],
        new FinancialIntegrationMetricsDto(
            IntegrationProvider.QuickBooks,
            "GBP",
            new DateOnly(2026, 1, 1),
            new DateOnly(2026, 12, 31),
            new DateOnly(2025, 12, 31),
            new DateOnly(2026, 12, 31),
            DateTime.UtcNow,
            750_000m,
            680_000m,
            180_000m,
            120_000m,
            95_000m,
            88_000m,
            110_000m,
            12_500m,
            42_000m,
            18_000m,
            180_000m,
            60_000m,
            120_000m,
            320_000m,
            45_000m,
            275_000m,
            35_000m,
            72_000m,
            3.0m,
            0.14m,
            0.127m,
            0.103m,
            0.08m,
            24,
            true,
            true),
        DateTime.UtcNow);
}

public sealed class UpsertFinancialProfileRequestExample : IExamplesProvider<UpsertFinancialProfileRequest>
{
    public UpsertFinancialProfileRequest GetExamples() => new(
        AnnualRevenueBand.From250KTo1M,
        EbitdaMarginBand.Margin5To15,
        ExistingDebtBand.NoDebt,
        CashReservesMonthsBand.From3To6Months,
        AvgMonthlyRevenueBand.From20KTo80K);
}

public sealed class FundingProfileResponseExample : IExamplesProvider<FundingProfileResponse>
{
    public FundingProfileResponse GetExamples() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        150_000.00m,
        FundingPurpose.WorkingCapital,
        24,
        FundingUrgency.Within90Days,
        DateTime.UtcNow);
}

public sealed class UpsertFundingProfileRequestExample : IExamplesProvider<UpsertFundingProfileRequest>
{
    public UpsertFundingProfileRequest GetExamples() => new(
        150_000.00m,
        FundingPurpose.WorkingCapital,
        24,
        FundingUrgency.Within90Days);
}

public sealed class OAuthAuthorizeResponseExample : IExamplesProvider<OAuthAuthorizeResponse>
{
    public OAuthAuthorizeResponse GetExamples() => new(
        "https://auth.truelayer-sandbox.com/?response_type=code",
        Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes("state-token")));
}

public sealed class EvidenceResponseExample : IExamplesProvider<EvidenceResponse>
{
    public EvidenceResponse GetExamples() => new(
        Guid.Parse("22222222-2222-2222-2222-222222222222"),
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "bank-statement.pdf",
        "application/pdf",
        512_000,
        DateTime.UtcNow);
}
