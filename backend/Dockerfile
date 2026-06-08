# ============================================================
# Stage 1: BUILD
# ============================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy csproj files riêng để tận dụng Docker layer cache khi restore.
# Context là thư mục `backend/`, nên đường dẫn bắt đầu từ src/
COPY src/LMS.Domain/LMS.Domain.csproj                       src/LMS.Domain/
COPY src/LMS.Application/LMS.Application.csproj             src/LMS.Application/
COPY src/LMS.Infrastructure/LMS.Infrastructure.csproj       src/LMS.Infrastructure/
COPY src/LMS.API/LMS.API.csproj                             src/LMS.API/

# Restore dependencies (cached nếu .csproj không đổi)
RUN dotnet restore src/LMS.API/LMS.API.csproj

# Copy toàn bộ source code sau khi restore
COPY src/ src/

# Publish release build
# Không dùng --no-restore vì NuGet cache từ bước restore ở WORKDIR /src
# đôi khi không được nhận ra đúng khi path có nested src/
RUN dotnet publish src/LMS.API/LMS.API.csproj \
    --configuration Release \
    --output /app/publish

# ============================================================
# Stage 2: RUNTIME
# ============================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Cài thư viện hệ thống thiếu (cần root, PHẢI trước USER appuser).
# libgssapi-krb5-2: required by Npgsql/PostgreSQL native driver trên Debian.
RUN apt-get update \
 && apt-get install -y --no-install-recommends libgssapi-krb5-2 \
 && rm -rf /var/lib/apt/lists/*

# Chạy với user non-root để tăng bảo mật.
# Image dotnet/aspnet:10.0 dùng nền Debian nên phải dùng groupadd/useradd (không có addgroup/adduser Alpine)
RUN groupadd --system appgroup \
 && useradd --system --gid appgroup --no-create-home appuser
USER appuser

# Sao chép artifacts từ stage build
COPY --from=build /app/publish .

# Cổng lắng nghe (Render sẽ map sang 443 tự động)
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "LMS.API.dll"]
