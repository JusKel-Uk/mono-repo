namespace funding.Contracts;

public enum RevenueBand
{
    Under100K = 1,
    From100KTo500K = 2,
    From500KTo1M = 3,
    From1MTo5M = 4,
    Over5M = 5,
}

public enum EbitdaBand
{
    Negative = 1,
    Under50K = 2,
    From50KTo250K = 3,
    From250KTo1M = 4,
    Over1M = 5,
}

public enum DebtBand
{
    None = 1,
    Under100K = 2,
    From100KTo500K = 3,
    From500KTo1M = 4,
    Over1M = 5,
}

public enum CashReservesBand
{
    Under10K = 1,
    From10KTo50K = 2,
    From50KTo250K = 3,
    From250KTo1M = 4,
    Over1M = 5,
}

public enum MonthlyRevenueBand
{
    Under10K = 1,
    From10KTo50K = 2,
    From50KTo100K = 3,
    From100KTo500K = 4,
    Over500K = 5,
}

public enum FundingPurpose
{
    WorkingCapital = 1,
    Equipment = 2,
    Expansion = 3,
    Refinance = 4,
    Other = 99,
}

public enum FundingUrgency
{
    Immediate = 1,
    Within30Days = 2,
    Within90Days = 3,
    Flexible = 4,
}

public enum IntegrationProvider
{
    OpenBanking = 1,
    Xero = 2,
    QuickBooks = 3,
}
