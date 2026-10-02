using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;
using System.Text.Json;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class FoodCouponsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsFoodCoupons()
    {
        using var db = TestDbContextFactory.Create();
        db.FoodCoupons.Add(new FoodCoupon { Id = "fc1", ResidentName = "Resident A", FlatNumber = "A-101", TotalAmount = 600, Day = "Day 1" });
        await db.SaveChangesAsync();

        var controller = new FoodCouponsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<FoodCoupon>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task GetByResident_ReturnsOnlyResidentCoupons()
    {
        using var db = TestDbContextFactory.Create();
        db.FoodCoupons.AddRange(
            new FoodCoupon { Id = "fc1", ResidentId = "r1", ResidentName = "Resident A", TotalAmount = 600 },
            new FoodCoupon { Id = "fc2", ResidentId = "r2", ResidentName = "Resident B", TotalAmount = 800 }
        );
        await db.SaveChangesAsync();

        var controller = new FoodCouponsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.GetByResident("r1");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<FoodCoupon>;
        list.Should().HaveCount(1);
        list![0].ResidentId.Should().Be("r1");
    }

    [Fact]
    public async Task IssueOnline_CreatesDocAndOnlineCoupons()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new FoodCouponsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var json = JsonSerializer.Serialize(new
        {
            residentId = "res1",
            flatNumber = "5-2-B",
            residentName = "John Doe",
            accessCode = "4321",
            paymentMode = "UPI",
            cartItems = new[]
            {
                new { day = "Saptami", dayDate = "2026-10-18", mealType = "Lunch", foodType = "Veg", normalDineOutCount = 2, totalAmount = 300 }
            }
        });
        var body = JsonSerializer.Deserialize<JsonElement>(json);

        var result = await controller.IssueOnline(body);
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();

        var doc = await db.FoodCouponDocs.FirstOrDefaultAsync(d => d.FlatNumber == "5-2-B");
        doc.Should().NotBeNull();
        doc!.AccessCode.Should().Be("4321");

        var coupon = await db.FoodCoupons.FirstOrDefaultAsync(c => c.FlatNumber == "5-2-B");
        coupon.Should().NotBeNull();
        coupon!.IsOnline.Should().BeTrue();
        coupon.FlatDocId.Should().Be(doc.Id);
    }

    [Fact]
    public async Task ValidateAccessCode_ValidatesCorrectly()
    {
        using var db = TestDbContextFactory.Create();
        db.FoodCouponDocs.Add(new FoodCouponDoc
        {
            Id = "doc1",
            FlatNumber = "10-4-B",
            AccessCode = "9999"
        });
        await db.SaveChangesAsync();

        var controller = new FoodCouponsController(db, AuditMock.Object, StatsMock.Object);

        // Valid code
        var validJson = JsonSerializer.Serialize(new { flatNumber = "10-4-B", accessCode = "9999" });
        var validResult = await controller.ValidateAccessCode(JsonSerializer.Deserialize<JsonElement>(validJson));
        validResult.Should().BeOfType<OkObjectResult>();

        // Invalid code
        var invalidJson = JsonSerializer.Serialize(new { flatNumber = "10-4-B", accessCode = "0000" });
        var invalidResult = await controller.ValidateAccessCode(JsonSerializer.Deserialize<JsonElement>(invalidJson));
        invalidResult.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task ServeCoupon_IncrementsCountAndMarksRedeemedWhenFullyServed()
    {
        using var db = TestDbContextFactory.Create();
        var coupon = new FoodCoupon
        {
            Id = "fc_serve",
            NormalDineOutCount = 1,
            ServedNormalDineOut = 0,
            Redeemed = false
        };
        db.FoodCoupons.Add(coupon);
        await db.SaveChangesAsync();

        var controller = new FoodCouponsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var serveJson = JsonSerializer.Serialize(new { field = "servedNormalDineOut", count = 1, servedBy = "Counter Admin" });
        var result = await controller.ServeCoupon("fc_serve", JsonSerializer.Deserialize<JsonElement>(serveJson));

        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var updated = ok!.Value as FoodCoupon;
        updated!.ServedNormalDineOut.Should().Be(1);
        updated.Redeemed.Should().BeTrue();
        updated.LastServedBy.Should().Be("Counter Admin");
    }
}
