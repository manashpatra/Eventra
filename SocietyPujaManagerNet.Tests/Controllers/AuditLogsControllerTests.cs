using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class AuditLogsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetLogs_ReturnsFilteredLogs()
    {
        using var db = TestDbContextFactory.Create();
        db.AuditLogs.AddRange(
            new AuditLog { Id = "a1", Action = "CREATE", EntityType = "Resident", PerformedByEmail = "admin@dpc.com" },
            new AuditLog { Id = "a2", Action = "UPDATE", EntityType = "Donation", PerformedByEmail = "user@dpc.com" }
        );
        await db.SaveChangesAsync();

        var controller = new AuditLogsController(db);
        SetUser(controller);

        var result = await controller.GetLogs("CREATE", null, null, 10);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<AuditLog>;
        list.Should().HaveCount(1);
        list![0].EntityType.Should().Be("Resident");
    }
}
