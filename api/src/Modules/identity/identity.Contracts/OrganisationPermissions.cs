namespace identity.Contracts;

public static class OrganisationPermissions
{
    public static bool CanWrite(OrganisationRole role) =>
        role is OrganisationRole.Owner or OrganisationRole.Admin or OrganisationRole.Contributor;

    public static bool CanSubmit(OrganisationRole role) =>
        role is OrganisationRole.Owner or OrganisationRole.Admin;

    public static bool CanManageTeam(OrganisationRole role) =>
        role is OrganisationRole.Owner or OrganisationRole.Admin;

    public static bool CanCloseOrganisation(OrganisationRole role) =>
        role is OrganisationRole.Owner;
}
