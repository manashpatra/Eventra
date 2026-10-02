using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class ChequeTransactionsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetAll_ReturnsChequeTransactions()
    {
        using var db = TestDbContextFactory.Create();
        db.ChequeTransactions.Add(new ChequeTransaction { Id = "ct1", ChequeNumber = "123456", Amount = 10000, TransactionType = "To Cash" });
        await db.SaveChangesAsync();

        var controller = new ChequeTransactionsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var result = await controller.GetAll();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        ((List<ChequeTransaction>)ok!.Value!).Should().HaveCount(1);
    }

    [Fact]
    public async Task Create_ValidTransaction_SavesToDb()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new ChequeTransactionsController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var ct = new ChequeTransaction { ChequeNumber = "999888", Amount = 5000, TransactionType = "To Vendor", VendorName = "Caterer" };
        var result = await controller.Create(ct);

        result.Should().BeOfType<OkObjectResult>();
        db.ChequeTransactions.Should().ContainSingle(t => t.ChequeNumber == "999888");
    }
}
