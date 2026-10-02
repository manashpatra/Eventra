using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class ExpensesControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsAllExpenses()
    {
        using var db = TestDbContextFactory.Create();
        db.Expenses.Add(new Expense { Id = "e1", Category = "Decoration", Amount = 15000, PaymentMode = "Cash" });
        await db.SaveChangesAsync();

        var controller = new ExpensesController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<Expense>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_ValidExpense_SavesToDb()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new ExpensesController(db, AuditMock.Object, StatsMock.Object, ProofMock.Object);
        SetUser(controller);

        var exp = new Expense { Category = "Sound & Light", Amount = 20000, PaymentMode = "Cheque" };
        var result = await controller.Create(exp);

        result.Should().BeOfType<OkObjectResult>();
        db.Expenses.Should().ContainSingle(e => e.Category == "Sound & Light" && e.Amount == 20000);
    }
}
