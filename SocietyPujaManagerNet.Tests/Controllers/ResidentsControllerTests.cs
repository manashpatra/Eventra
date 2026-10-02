using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class ResidentsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsAllResidents()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.AddRange(
            new Resident { Id = "r1", Name = "Resident One", FlatNumber = "1-1-A", Block = 1, Floor = 1, FlatType = "A" },
            new Resident { Id = "r2", Name = "Resident Two", FlatNumber = "2-2-B", Block = 2, Floor = 2, FlatType = "B" }
        );
        await db.SaveChangesAsync();

        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<Resident>;
        list.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetById_ExistingId_ReturnsResident()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", Name = "Resident One", FlatNumber = "1-1-A", Block = 1, Floor = 1, FlatType = "A" });
        await db.SaveChangesAsync();

        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetById("r1");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((Resident)ok!.Value!).Name.Should().Be("Resident One");
    }

    [Fact]
    public async Task GetById_NonExistingId_ReturnsNotFound()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetById("missing");
        result.Should().BeOfType<NotFoundResult>();
    }

    [Fact]
    public async Task Create_ValidResident_AddsToDbAndReturnsOk()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var resident = new Resident { Name = "New Resident", Block = 3, Floor = 3, FlatType = "C" };
        var result = await controller.Create(resident);

        result.Should().BeOfType<OkObjectResult>();
        db.Residents.Should().ContainSingle(r => r.FlatNumber == "3-3-C");
    }

    [Fact]
    public async Task Update_ExistingResident_UpdatesFields()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", Name = "Old Name", Block = 1, Floor = 1, FlatType = "A", FlatNumber = "1-1-A" });
        await db.SaveChangesAsync();

        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var update = new Resident { Name = "Updated Name", Block = 1, Floor = 1, FlatType = "A", Mobile = "9876543210" };
        var result = await controller.Update("r1", update);

        result.Should().BeOfType<OkObjectResult>();
        var updated = await db.Residents.FindAsync("r1");
        updated!.Name.Should().Be("Updated Name");
        updated.Mobile.Should().Be("9876543210");
    }

    [Fact]
    public async Task RecordSubscription_ValidPayment_UpdatesStatus()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", Name = "Resident One", FlatNumber = "1-1-A", SubscriptionStatus = "pending" });
        await db.SaveChangesAsync();

        var controller = new ResidentsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var payment = new Dictionary<string, object>
        {
            { "amount", 1500 },
            { "paymentMode", "UPI" },
            { "transactionDate", DateTime.UtcNow.ToString("o") }
        };

        var result = await controller.RecordSubscription("r1", payment);
        result.Should().BeOfType<OkObjectResult>();

        var resident = await db.Residents.FindAsync("r1");
        resident!.SubscriptionStatus.Should().Be("paid");
        resident.SubscriptionAmount.Should().Be(1500);
    }
}
