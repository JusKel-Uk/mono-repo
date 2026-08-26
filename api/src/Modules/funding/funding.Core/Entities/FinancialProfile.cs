using funding.Contracts;

namespace funding.Core.Entities;

internal sealed class FinancialProfile
{
    public Guid ApplicationId { get; set; }

    public RevenueBand? RevenueBand { get; set; }

    public EbitdaBand? EbitdaBand { get; set; }

    public DebtBand? DebtBand { get; set; }

    public CashReservesBand? CashReservesBand { get; set; }

    public MonthlyRevenueBand? MonthlyRevenueBand { get; set; }

    public bool BandsLockedByIntegration { get; set; }

    public DateTime UpdatedAt { get; set; }
}
