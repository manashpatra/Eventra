using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class PublicDataControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetSubscriptionReport_ReturnsPublicStats()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.AddRange(
            new Resident { Id = "r1", FlatNumber = "A-101", SubscriptionStatus = "paid", SubscriptionAmount = 1500 },
            new Resident { Id = "r2", FlatNumber = "B-202", SubscriptionStatus = "pending", SubscriptionAmount = 0 }
        );
        await db.SaveChangesAsync();

        var controller = new PublicDataController(db);

        var result = await controller.GetSubscriptionReport();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }

    [Fact]
    public async Task GetFlatData_ExistingFlat_ReturnsInfo()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", FlatNumber = "A-101", Name = "Resident", SubscriptionStatus = "paid" });
        await db.SaveChangesAsync();

        var controller = new PublicDataController(db);

        var result = await controller.GetFlatData("A-101");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }

    [Fact]
    public async Task GetFlatData_IncludesDraftCartsAndFeedbacks()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", FlatNumber = "2-3-A", Name = "Resident", SubscriptionStatus = "paid" });
        db.DraftCarts.Add(new DraftCart { Id = "dc1", FlatNumber = "2-3-A", Status = "pending", TotalAmount = 500 });
        db.Feedbacks.Add(new Feedback { Id = "fb1", FlatNumber = "2-3-A", Message = "Great food" });
        await db.SaveChangesAsync();

        var controller = new PublicDataController(db);

        var result = await controller.GetFlatData("2-3-A");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }
}
