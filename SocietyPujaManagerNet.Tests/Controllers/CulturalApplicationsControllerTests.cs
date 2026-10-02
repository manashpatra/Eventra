using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class CulturalApplicationsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetByEvent_ReturnsApplicationsForEvent()
    {
        using var db = TestDbContextFactory.Create();
        db.CulturalApplications.AddRange(
            new CulturalApplication { Id = "ca1", EventId = "e1", ParticipantName = "Performer 1", FlatNumber = "A-101" },
            new CulturalApplication { Id = "ca2", EventId = "e2", ParticipantName = "Performer 2", FlatNumber = "B-202" }
        );
        await db.SaveChangesAsync();

        var controller = new CulturalApplicationsController(db, AuditMock.Object);
        SetUser(controller);

        var result = await controller.GetByEvent("e1");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<CulturalApplication>;
        list.Should().HaveCount(1);
        list![0].ParticipantName.Should().Be("Performer 1");
    }

    [Fact]
    public async Task Create_IncrementsEventApplicationCount()
    {
        using var db = TestDbContextFactory.Create();
        var ev = new CulturalEvent { Id = "e1", Title = "Dance", ApplicationCount = 2, MaxCapacity = 20 };
        db.CulturalEvents.Add(ev);
        await db.SaveChangesAsync();

        var controller = new CulturalApplicationsController(db, AuditMock.Object);
        SetUser(controller);

        var app = new CulturalApplication
        {
            EventId = "e1",
            ParticipantName = "Group A",
            FlatNumber = "1-1-A",
            CapacityConsumed = 3,
            IsGroup = true
        };

        var result = await controller.Create(app);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();

        var updatedEvent = await db.CulturalEvents.FindAsync("e1");
        updatedEvent!.ApplicationCount.Should().Be(5);
    }

    [Fact]
    public async Task Update_UpdatesApplicationDetailsAndPayment()
    {
        using var db = TestDbContextFactory.Create();
        var app = new CulturalApplication
        {
            Id = "ca1",
            EventId = "e1",
            ParticipantName = "Solo 1",
            FlatNumber = "1-1-A",
            ScheduleSequence = 1,
            PaymentConfirmed = false
        };
        db.CulturalApplications.Add(app);
        await db.SaveChangesAsync();

        var controller = new CulturalApplicationsController(db, AuditMock.Object);
        SetUser(controller);

        var updateData = new CulturalApplication
        {
            ParticipantName = "Solo 1 Updated",
            ScheduleSequence = 5,
            ScheduleTime = "7:30 PM",
            PaymentConfirmed = true,
            AdminPaymentConfirmed = true,
            AmountPaid = 200,
            AdminComment = "Slot confirmed"
        };

        var result = await controller.Update("ca1", updateData);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();

        var updated = ok!.Value as CulturalApplication;
        updated!.ScheduleSequence.Should().Be(5);
        updated.ScheduleTime.Should().Be("7:30 PM");
        updated.PaymentConfirmed.Should().BeTrue();
        updated.AdminPaymentConfirmed.Should().BeTrue();
        updated.AdminComment.Should().Be("Slot confirmed");
    }

    [Fact]
    public async Task Delete_DecrementsEventApplicationCount()
    {
        using var db = TestDbContextFactory.Create();
        var ev = new CulturalEvent { Id = "e1", Title = "Dance", ApplicationCount = 5 };
        var app = new CulturalApplication { Id = "ca1", EventId = "e1", CapacityConsumed = 2 };
        db.CulturalEvents.Add(ev);
        db.CulturalApplications.Add(app);
        await db.SaveChangesAsync();

        var controller = new CulturalApplicationsController(db, AuditMock.Object);
        SetUser(controller);

        var result = await controller.Delete("ca1");
        result.Should().BeOfType<OkResult>();

        var updatedEvent = await db.CulturalEvents.FindAsync("e1");
        updatedEvent!.ApplicationCount.Should().Be(3);
    }

    [Fact]
    public async Task Update_PartialJsonUpdate_PreservesExistingFields()
    {
        using var db = TestDbContextFactory.Create();
        var app = new CulturalApplication
        {
            Id = "ca99",
            EventId = "e1",
            ParticipantName = "Original Singer",
            FlatNumber = "2-3-B",
            ScheduleSequence = 1,
            ContactNumber = "9876543210"
        };
        db.CulturalApplications.Add(app);
        await db.SaveChangesAsync();

        var controller = new CulturalApplicationsController(db, AuditMock.Object);
        SetUser(controller);

        using var jsonDoc = System.Text.Json.JsonDocument.Parse("{\"adminComment\":\"Reviewed by committee\",\"adminPaymentConfirmed\":true}");
        var result = await controller.Update("ca99", jsonDoc.RootElement);

        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var updated = ok!.Value as CulturalApplication;
        updated!.ParticipantName.Should().Be("Original Singer");
        updated.FlatNumber.Should().Be("2-3-B");
        updated.ContactNumber.Should().Be("9876543210");
        updated.AdminComment.Should().Be("Reviewed by committee");
        updated.AdminPaymentConfirmed.Should().BeTrue();
    }
}
