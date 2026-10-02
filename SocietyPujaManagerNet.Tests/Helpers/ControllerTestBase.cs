using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocietyPujaManagerNet.Services;

namespace SocietyPujaManagerNet.Tests.Helpers;

public abstract class ControllerTestBase
{
    protected readonly Mock<IAuditService> AuditMock = new();
    protected readonly Mock<IDashboardStatsService> StatsMock = new();
    protected readonly Mock<IPaymentProofService> ProofMock = new();

    protected void SetUser(ControllerBase controller, string email = "admin@dpc.com", string role = "Super Admin", string userId = "test-user-id")
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, userId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, email),
            new(ClaimTypes.Role, role),
            new("role", role),
            new("fullName", "Test Admin")
        };

        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var principal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };
    }
}
