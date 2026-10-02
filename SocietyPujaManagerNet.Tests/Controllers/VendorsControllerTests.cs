using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class VendorsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task AddPayment_ValidVendor_AppendsPayment()
    {
        using var db = TestDbContextFactory.Create();
        var vendor = new Vendor { Id = "v1", Name = "Tent Vendor", DealAmount = 100000 };
        db.Vendors.Add(vendor);
        await db.SaveChangesAsync();

        var controller = new VendorsController(db, AuditMock.Object);
        SetUser(controller);

        var payment = new VendorPayment { Amount = 25000, Mode = "Cheque", Remarks = "CHQ-001" };
        var result = await controller.AddPayment("v1", payment);

        result.Should().BeOfType<OkObjectResult>();
        var updated = await db.Vendors.FindAsync("v1");
        updated!.PaymentsJson.Should().Contain("CHQ-001");
    }
}
