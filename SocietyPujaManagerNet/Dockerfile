FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["SocietyPujaManagerNet.csproj", "./"]
RUN dotnet restore "SocietyPujaManagerNet.csproj"
COPY . .
WORKDIR "/src/"
RUN dotnet build "SocietyPujaManagerNet.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SocietyPujaManagerNet.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SocietyPujaManagerNet.dll"]
