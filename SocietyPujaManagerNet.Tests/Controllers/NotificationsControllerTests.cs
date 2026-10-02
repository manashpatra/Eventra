using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class NotificationsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task Create_ValidNotice_SetsDefaultsAndSaves()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new NotificationsController(db, AuditMock.Object);
        SetUser(controller);

        var notice = new Notification { Title = "Anandamelu Rules", Message = "Please register food stalls." };
        var result = await controller.Create(notice);

        result.Should().BeOfType<OkObjectResult>();
        db.Notifications.Should().ContainSingle(n => n.Title == "Anandamelu Rules" && n.Active);
    }
}
