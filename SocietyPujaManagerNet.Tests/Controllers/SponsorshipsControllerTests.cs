using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class SponsorshipsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsSponsorships()
    {
        using var db = TestDbContextFactory.Create();
        db.Sponsorships.Add(new Sponsorship { Id = "s1", SponsorName = "Company A", Amount = 50000, Status = "Received", SponsorType = "External" });
        await db.SaveChangesAsync();

        var controller = new SponsorshipsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<Sponsorship>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_ValidSponsorship_SetsDefaultsAndSaves()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new SponsorshipsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var spon = new Sponsorship { SponsorName = "Company B", Amount = 25000 };
        var result = await controller.Create(spon);

        result.Should().BeOfType<OkObjectResult>();
        var saved = await db.Sponsorships.FindAsync(spon.Id);
        saved!.Status.Should().Be("Pending");
        saved.SponsorType.Should().Be("External");
    }

    [Fact]
    public async Task Update_PersistsCancelledStatusAndRefundDetails()
    {
        using var db = TestDbContextFactory.Create();
        var spon = new Sponsorship { Id = "s_cancel", SponsorName = "Client A", Amount = 30000, Status = "Received" };
        db.Sponsorships.Add(spon);
        await db.SaveChangesAsync();

        var controller = new SponsorshipsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var refundDate = new DateTime(2026, 9, 20);
        var updateData = new Sponsorship
        {
            SponsorName = "Client A",
            Amount = 30000,
            Status = "Cancelled",
            RefundDate = refundDate,
            RefundMode = "UPI",
            RefundRemarks = "Event withdrawn"
        };

        var result = await controller.Update("s_cancel", updateData);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();

        var updated = await db.Sponsorships.FindAsync("s_cancel");
        updated!.Status.Should().Be("Cancelled");
        updated.RefundDate.Should().Be(refundDate);
        updated.RefundMode.Should().Be("UPI");
        updated.RefundRemarks.Should().Be("Event withdrawn");
    }
}
