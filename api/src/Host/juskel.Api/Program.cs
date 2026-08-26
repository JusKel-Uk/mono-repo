using funding.Core;
using funding.Core.Examples;
using identity.Core;
using identity.Core.Examples;
using juskel.Api.Infrastructure;
using juskel.Api.Contracts.Examples;
using juskel.Api.Contracts.Responses;
using juskel.Email;
using juskel.Integrations;
using juskel.Shared;
using juskel.Shared.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using onboarding.Core;
using onboarding.Core.Examples;
using scoring.Core;
using scoring.Core.Examples;
using Swashbuckle.AspNetCore.Filters;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddFieldEncryption(builder.Configuration);
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Logging.AddFilter("Microsoft", LogLevel.Warning);
builder.Logging.AddFilter("System", LogLevel.Warning);
builder.Logging.AddFilter("juskel", LogLevel.Information);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = ApiConstants.ApiName,
        Version = ApiConstants.ApiVersion,
    });
    options.ExampleFilters();
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the accessToken from POST /identity/sessions",
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer", document)] = [],
    });
});

builder.Services.AddSwaggerExamplesFromAssemblyOf<RootResponseExample>();
builder.Services.AddSwaggerExamplesFromAssemblyOf<UserSummaryExample>();
builder.Services.AddSwaggerExamplesFromAssemblyOf<CreateApplicationResponseExample>();
builder.Services.AddSwaggerExamplesFromAssemblyOf<FinancialProfileResponseExample>();
builder.Services.AddSwaggerExamplesFromAssemblyOf<SustainabilityProfileResponseExample>();
builder.Services.AddHealthChecks();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("companies-house-verify", limiter =>
    {
        limiter.Window = TimeSpan.FromMinutes(1);
        limiter.PermitLimit = 5;
        limiter.QueueLimit = 0;
    });

    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddIntegrations(builder.Configuration);
builder.Services.AddIdentityModule(builder.Configuration);
builder.Services.AddOnboardingModule(builder.Configuration);
builder.Services.AddFundingModule(builder.Configuration);
builder.Services.AddScoringModule(builder.Configuration);
builder.Services.AddEmail(builder.Configuration);

var jwtOptions = builder.Configuration
    .GetSection(JwtOptions.SectionName)
    .Get<JwtOptions>()
    ?? throw new InvalidOperationException("JWT configuration is missing.");

if (string.IsNullOrWhiteSpace(jwtOptions.Secret))
    throw new InvalidOperationException("JWT secret is not configured.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Secret)),
            ClockSkew = TimeSpan.Zero,
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(
                "http://localhost:3000",
                "https://mono-repo-n96q.vercel.app")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

var app = builder.Build();

EncryptedStringConverter.Initialize(app.Services.GetRequiredService<IFieldEncryptor>());

await app.MigrateAndBackfillPiiAsync();
await app.MigrateOnboardingAsync();
await app.MigrateFundingAsync();
await app.MigrateScoringAsync();

app.UseExceptionHandler();
app.UseStaticFiles();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "juskel API v1");
        options.RoutePrefix = "swagger";
    });
}

if (app.Environment.IsDevelopment())
{
    app.MapGet("/debug", () =>
    {
        throw new InvalidOperationException("This is a test exception");
    })
    .WithName("GetDebug")
    .WithTags("debug")
    .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);
}

app.MapIdentityEndpoints();
app.MapOnboardingEndpoints();
app.MapFundingEndpoints();
app.MapScoringEndpoints();

app.MapGet("/", () => Results.Ok(new RootResponse("online", ApiConstants.ApiVersion)))
    .WithName("GetRoot")
    .WithTags("system")
    .Produces<RootResponse>(StatusCodes.Status200OK)
    .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError)
    .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status200OK, typeof(RootResponseExample)))
    .WithMetadata(new SwaggerResponseExampleAttribute(StatusCodes.Status500InternalServerError, typeof(ProblemDetailsExample)));

app.Run();
