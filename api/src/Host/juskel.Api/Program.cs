using juskel.Shared;
using juskel.Api.Infrastructure;
using juskel.Api.Contracts.Examples;
using juskel.Api.Contracts.Responses;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Filters;
using identity.Core;
using identity.Core.Examples;

var builder = WebApplication.CreateBuilder(args);


builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("juskel", LogLevel.Information);



builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options=>{
    options.SwaggerDoc("v1", new(){
        Title =ApiConstants.ApiName, Version = ApiConstants.ApiVersion
    });
    options.ExampleFilters();
});

builder.Services.AddSwaggerExamplesFromAssemblyOf<RootResponseExample>();
builder.Services.AddSwaggerExamplesFromAssemblyOf<UserSummaryExample>();
builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddIdentityModule(builder.Configuration);




var app = builder.Build();
app.UseExceptionHandler();
app.MapHealthChecks("/health");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options=>{
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "juskel API v1");
        options.RoutePrefix = "swagger";
    });
}

if (app.Environment.IsDevelopment()){
    {
        app.MapGet("/debug",()=>{
            throw new InvalidOperationException("This is a test exception");
        }).WithName("GetDebug").WithTags("debug")
        .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);
    }
}


app.MapIdentityEndpoints();



app.MapGet("/", () => Results.Ok(new RootResponse("online",ApiConstants.ApiVersion)))
    .WithName("GetRoot")
    .WithTags("system")
    .Produces<RootResponse>(StatusCodes.Status200OK)
    .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
    .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(RootResponseExample)))
    .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status500InternalServerError, typeof(ProblemDetailsExample)));
app.Run();