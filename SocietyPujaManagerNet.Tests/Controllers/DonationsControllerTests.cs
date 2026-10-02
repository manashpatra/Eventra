using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class DonationsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsAllDonations()
    {
        using var db = TestDbContextFactory.Create();
        db.Donations.AddRange(
            new Donation { Id = "d1", DonorName = "Donor 1", Amount = 1000, PaymentMode = "Cash" },
            new Donation { Id = "d2", DonorName = "Donor 2", Amount = 2000, PaymentMode = "UPI" }
        );
        await db.SaveChangesAsync();

        var controller = new DonationsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<Donation>)ok!.Value!).Should().HaveCount(2);
    }

    [Fact]
    public async Task Create_ValidDonation_SavesAndReturnsCreated()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new DonationsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var donation = new Donation { DonorName = "Generous Donor", Amount = 5000, PaymentMode = "UPI" };
        var result = await controller.Create(donation);

        result.Should().BeOfType<OkObjectResult>();
        db.Donations.Should().ContainSingle(d => d.DonorName == "Generous Donor" && d.Amount == 5000);
    }

    [Fact]
    public async Task Delete_ExistingDonation_RemovesFromDb()
    {
        using var db = TestDbContextFactory.Create();
        db.Donations.Add(new Donation { Id = "d1", DonorName = "Donor", Amount = 500 });
        await db.SaveChangesAsync();

        var controller = new DonationsController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.Delete("d1");
        result.Should().BeOfType<OkResult>();
        db.Donations.Should().BeEmpty();
    }
}
