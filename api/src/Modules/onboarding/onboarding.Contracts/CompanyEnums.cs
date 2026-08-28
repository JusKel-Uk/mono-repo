namespace onboarding.Contracts;

// Dropdown enums: integer values are persisted in SQL. Never reuse or renumber a value
// after release — add new members with the next free integer and mirror the same
// value in api/onboarding-lookups.json. Use 99 for "Other" where applicable.

public enum CompanyRelationship
{
    SoleTrader = 1,
    Director = 2,
    Shareholder = 3,
    Partner = 4,
    Other = 5,
}

public enum UkRegion
{
    England = 1,
    Wales = 2,
    Scotland = 3,
    NorthernIreland = 4,
}

public enum EmployeeSizeBand
{
    Micro1To9 = 1,
    Small10To49 = 2,
    Medium50To249 = 3,
    Large250Plus = 4,
}

public enum AnnualTurnoverBand
{
    Under250K = 1,
    From250KTo1M = 2,
    From1MTo5M = 3,
    From5MTo25M = 4,
    Over25M = 5,
}

public enum YearsInOperationBand
{
    Under1Year = 1,
    From1To3Years = 2,
    From3To5Years = 3,
    From5To10Years = 4,
    Over10Years = 5,
}

public enum BusinessSector
{
    Technology = 1,
    Manufacturing = 2,
    Retail = 3,
    ProfessionalServices = 4,
    Hospitality = 5,
    Construction = 6,
    Agriculture = 7,
    Healthcare = 8,
    Other = 99,
}
