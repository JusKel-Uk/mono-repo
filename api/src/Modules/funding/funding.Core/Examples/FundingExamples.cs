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
        false,
        false,
        [
            new IntegrationStatusDto(IntegrationProvider.OpenBanking, false, null, null),
            new IntegrationStatusDto(IntegrationProvider.Xero, false, null, null),
            new IntegrationStatusDto(IntegrationProvider.QuickBooks, false, null, null),
        ],
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
