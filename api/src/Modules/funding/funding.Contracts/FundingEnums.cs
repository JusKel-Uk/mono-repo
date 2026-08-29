namespace funding.Contracts;

// Dropdown enums: integer values are persisted in SQL. Never reuse or renumber a value
// after release — add new members with the next free integer and mirror the same
// value in api/onboarding-lookups.json. Use 99 for "Other" where applicable.

public enum AnnualRevenueBand
{
    Under250K = 1,
    From250KTo1M = 2,
    From1MTo5M = 3,
    From5MTo25M = 4,
    Over25M = 5,
}

public enum EbitdaMarginBand
{
    LossMaking = 1,
    Margin0To5 = 2,
    Margin5To15 = 3,
    Margin15To30 = 4,
    Over30Margin = 5,
}

public enum ExistingDebtBand
{
    NoDebt = 1,
    Under50K = 2,
    From50KTo250K = 3,
    From250KTo1M = 4,
    Over1M = 5,
}

public enum CashReservesMonthsBand
{
    Under1Month = 1,
    From1To3Months = 2,
    From3To6Months = 3,
    From6To12Months = 4,
    Over12Months = 5,
}

public enum AvgMonthlyRevenueBand
{
    Under20K = 1,
    From20KTo80K = 2,
    From80KTo400K = 3,
    From400KTo1M = 4,
    Over1M = 5,
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
