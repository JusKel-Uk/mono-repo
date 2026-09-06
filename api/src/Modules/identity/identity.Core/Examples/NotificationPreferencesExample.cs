using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class NotificationPreferencesExample : IExamplesProvider<NotificationPreferencesDto>
{
    public NotificationPreferencesDto GetExamples() => NotificationPreferencesDto.AllEnabled;
}
