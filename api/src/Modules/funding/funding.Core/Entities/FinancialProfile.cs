using funding.Contracts;

namespace funding.Core.Entities;

internal sealed class FinancialProfile
{
    public Guid ApplicationId { get; set; }

    public AnnualRevenueBand? AnnualRevenueBand { get; set; }

    public EbitdaMarginBand? EbitdaBand { get; set; }

    public ExistingDebtBand? ExistingDebtBand { get; set; }

    public CashReservesMonthsBand? CashReserves { get; set; }

    public AvgMonthlyRevenueBand? AvgMonthlyRevenue { get; set; }

    public bool BandsLockedByIntegration { get; set; }

    public DateTime UpdatedAt { get; set; }
}
