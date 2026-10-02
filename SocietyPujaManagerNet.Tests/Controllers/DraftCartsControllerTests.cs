using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class DraftCartsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsDraftCarts()
    {
        using var db = TestDbContextFactory.Create();
        db.DraftCarts.Add(new DraftCart { Id = "dc1", ResidentName = "Resident A", FlatNumber = "A-101", TotalAmount = 500, Status = "pending" });
        await db.SaveChangesAsync();

        var controller = new DraftCartsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<DraftCart>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task Confirm_ValidCart_CreatesFoodCouponsAndMarksCompleted()
    {
        using var db = TestDbContextFactory.Create();
        db.Residents.Add(new Resident { Id = "r1", Name = "Resident A", FlatNumber = "A-101" });
        var cart = new DraftCart
        {
            Id = "dc1",
            ResidentId = "r1",
            ResidentName = "Resident A",
            FlatNumber = "A-101",
            TotalAmount = 500,
            Status = "pending",
            PaymentMode = "Cash",
            ItemsJson = "[{\"Day\":\"Day 1\",\"DayDate\":\"2026-10-17\",\"MealType\":\"Dinner\",\"FoodType\":\"veg\",\"NormalDineOutCount\":2,\"NormalPrice\":100,\"TotalAmount\":200}]"
        };
        db.DraftCarts.Add(cart);
        await db.SaveChangesAsync();

        var controller = new DraftCartsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.ConfirmCart("dc1");
        result.Should().BeOfType<OkObjectResult>();

        var updatedCart = await db.DraftCarts.FindAsync("dc1");
        updatedCart!.Status.Should().Be("completed");
        db.FoodCoupons.Should().ContainSingle(c => c.ResidentId == "r1");
    }
}
