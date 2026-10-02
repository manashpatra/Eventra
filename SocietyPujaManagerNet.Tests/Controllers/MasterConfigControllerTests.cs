using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class MasterConfigControllerTests : ControllerTestBase
{
    private readonly Mock<UserManager<AppUser>> _userManagerMock;

    public MasterConfigControllerTests()
    {
        var store = new Mock<IUserStore<AppUser>>();
        _userManagerMock = new Mock<UserManager<AppUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public async Task GetConfig_ExistingConfig_ReturnsOk()
    {
        using var db = TestDbContextFactory.Create();
        db.MasterConfigs.Add(new MasterConfig { Id = "main-config", ConfigJson = "{\"societyName\":\"Eternis\"}" });
        await db.SaveChangesAsync();

        var controller = new MasterConfigController(db, AuditMock.Object, _userManagerMock.Object);
        SetUser(controller);

        var result = await controller.GetConfig();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }
}
