using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class CollectionTrackerControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsTrackers()
    {
        using var db = TestDbContextFactory.Create();
        db.CollectionTrackers.Add(new CollectionTracker { Id = "ct1", Name = "Lead 1", Amount = 10000, Status = "Pending" });
        await db.SaveChangesAsync();

        var controller = new CollectionTrackerController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<CollectionTracker>)ok!.Value!).Should().HaveCount(1);
    }
}
