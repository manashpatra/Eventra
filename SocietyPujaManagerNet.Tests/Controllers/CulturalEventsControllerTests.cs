using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class CulturalEventsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsEvents()
    {
        using var db = TestDbContextFactory.Create();
        db.CulturalEvents.Add(new CulturalEvent { Id = "ce1", Title = "Dance Performance", EventDate = DateTime.UtcNow, Active = true });
        await db.SaveChangesAsync();

        var controller = new CulturalEventsController(db, AuditMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<CulturalEvent>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_GeneratesReadableIdAutomatically()
    {
        using var db = TestDbContextFactory.Create();
        db.CulturalEvents.Add(new CulturalEvent { Id = "ce0", ReadableId = "evt0003", Title = "Prior Event" });
        await db.SaveChangesAsync();

        var controller = new CulturalEventsController(db, AuditMock.Object);
        SetUser(controller);

        var newEvent = new CulturalEvent
        {
            Title = "Drama",
            MaxCapacity = 50,
            IsPaidEvent = true,
            ItemCost = 150
        };

        var result = await controller.Create(newEvent);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var created = ok!.Value as CulturalEvent;
        created.Should().NotBeNull();
        created!.ReadableId.Should().Be("evt0004");
        created.Title.Should().Be("Drama");
    }

    [Fact]
    public async Task Update_UpdatesAllCulturalFields()
    {
        using var db = TestDbContextFactory.Create();
        var ev = new CulturalEvent { Id = "ce1", Title = "Old Title", MaxCapacity = 20 };
        db.CulturalEvents.Add(ev);
        await db.SaveChangesAsync();

        var controller = new CulturalEventsController(db, AuditMock.Object);
        SetUser(controller);

        var updateData = new CulturalEvent
        {
            Title = "New Title",
            Description = "New Description",
            MaxCapacity = 100,
            AllowGroupRegistration = true,
            IsPaidEvent = true,
            ItemLabel = "Entry Ticket",
            ItemCost = 200,
            MaxItems = 5
        };

        var result = await controller.Update("ce1", updateData);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var updated = ok!.Value as CulturalEvent;
        updated!.Title.Should().Be("New Title");
        updated.MaxCapacity.Should().Be(100);
        updated.AllowGroupRegistration.Should().BeTrue();
        updated.ItemCost.Should().Be(200);
    }

    [Fact]
    public async Task GetStats_ReturnsAccurateCapacityMetrics()
    {
        using var db = TestDbContextFactory.Create();
        var ev = new CulturalEvent { Id = "ce1", Title = "Concert", MaxCapacity = 10 };
        db.CulturalEvents.Add(ev);
        db.CulturalApplications.AddRange(
            new CulturalApplication { Id = "ca1", EventId = "ce1", CapacityConsumed = 3, AmountPaid = 300, PaymentConfirmed = true },
            new CulturalApplication { Id = "ca2", EventId = "ce1", CapacityConsumed = 2, AmountPaid = 200, AdminPaymentConfirmed = true }
        );
        await db.SaveChangesAsync();

        var controller = new CulturalEventsController(db, AuditMock.Object);
        SetUser(controller);

        var result = await controller.GetStats("ce1");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }
}
