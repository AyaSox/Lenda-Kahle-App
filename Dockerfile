# Dockerfile for .NET 8 Backend on Render.com
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["LendaKahleApp.Server/LendaKahleApp.Server.csproj", "LendaKahleApp.Server/"]
RUN dotnet restore "LendaKahleApp.Server/LendaKahleApp.Server.csproj"
COPY . .
WORKDIR "/src/LendaKahleApp.Server"
RUN dotnet build "LendaKahleApp.Server.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "LendaKahleApp.Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Create uploads directory
RUN mkdir -p /app/uploads/loan-documents

# Set environment variable for Render
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "LendaKahleApp.Server.dll"]
