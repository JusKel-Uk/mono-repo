# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files first (Docker layer cache — restore only re-runs when .csproj changes)
COPY ["src/Host/juskel.Api/juskel.Api.csproj", "src/Host/juskel.Api/"]
COPY ["src/Shared/juskel.Shared/juskel.Shared.csproj", "src/Shared/juskel.Shared/"]
COPY ["src/Modules/identity/identity.Contracts/identity.Contracts.csproj", "src/Modules/identity/identity.Contracts/"]
COPY ["src/Modules/identity/identity.Core/identity.Core.csproj", "src/Modules/identity/identity.Core/"]
COPY ["src/Infrastructure/juskel.Email/juskel.Email.csproj", "src/Infrastructure/juskel.Email/"]

RUN dotnet restore "src/Host/juskel.Api/juskel.Api.csproj"

# Copy everything else and publish
COPY . .
WORKDIR "/src/src/Host/juskel.Api"
RUN dotnet publish "juskel.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Runtime (lean — no SDK, only ASP.NET runtime)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "juskel.Api.dll"]