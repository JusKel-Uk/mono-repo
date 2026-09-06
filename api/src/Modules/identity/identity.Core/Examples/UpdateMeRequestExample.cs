using identity.Contracts;
using Swashbuckle.AspNetCore.Filters;

namespace identity.Core.Examples;

public sealed class UpdateMeRequestExample : IExamplesProvider<UpdateMeRequest>
{
    public UpdateMeRequest GetExamples() => new(
        FirstName: "Ada",
        LastName: "Lovelace",
        JobTitle: "Founder & Managing Director",
        Phone: "+44 117 000 0000");
}
