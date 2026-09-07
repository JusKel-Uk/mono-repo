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
        true,
        [
            new IntegrationStatusDto(IntegrationProvider.OpenBanking, true, DateTime.UtcNow, DateTime.UtcNow.AddHours(1)),
            new IntegrationStatusDto(IntegrationProvider.Xero, false, null, null),
            new IntegrationStatusDto(IntegrationProvider.QuickBooks, false, null, null),
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
        null,
        [
            new OpenBankingConnectionDto(
                Guid.Parse("33333333-3333-3333-3333-333333333333"),
                "mock-a",
                "Mock Bank",
                1,
                DateTime.UtcNow,
                DateTime.UtcNow.AddHours(1)),
        ],
        new BankingIntegrationMetricsDto(
            "GBP",
            new DateOnly(2026, 6, 9),
            new DateOnly(2026, 9, 7),
            DateTime.UtcNow,
            1,
            1,
            125_000m,
            84_000m,
            66_000m,
            18_000m,
            28_000m,
            22_000m,
            26,
            false),
        new BankingCompletenessAttestationDto(true, DateTime.UtcNow, Guid.Parse("44444444-4444-4444-4444-444444444444")),
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

public sealed class OpenBankingConnectionsResponseExample : IExamplesProvider<OpenBankingConnectionsResponse>
{
    public OpenBankingConnectionsResponse GetExamples() => new(
    [
        new OpenBankingConnectionDto(
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            "mock-a",
            "Mock Bank",
            1,
            DateTime.UtcNow,
            DateTime.UtcNow.AddHours(1)),
        new OpenBankingConnectionDto(
            Guid.Parse("55555555-5555-5555-5555-555555555555"),
            "mock-b",
            "Second Mock Bank",
            1,
            DateTime.UtcNow,
            DateTime.UtcNow.AddHours(1)),
    ]);
}

public sealed class UpsertBankingCompletenessRequestExample : IExamplesProvider<UpsertBankingCompletenessRequest>
{
    public UpsertBankingCompletenessRequest GetExamples() => new(true);
}
