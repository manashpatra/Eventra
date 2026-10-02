using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class DashboardStatsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetStats_ServiceHasStats_ReturnsOk()
    {
        var statsServiceMock = new Mock<IDashboardStatsService>();
        statsServiceMock.Setup(s => s.GetStatsAsync())
            .ReturnsAsync(new DashboardStats { Id = "summary", StatsJson = "{\"test\":true}" });

        var controller = new DashboardStatsController(statsServiceMock.Object);
        SetUser(controller);

        var result = await controller.GetStats();
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }

    [Fact]
    public async Task Refresh_CallsRefreshStats()
    {
        var statsServiceMock = new Mock<IDashboardStatsService>();
        var controller = new DashboardStatsController(statsServiceMock.Object);
        SetUser(controller);

        var result = await controller.RefreshStats();
        result.Should().BeOfType<OkResult>();
        statsServiceMock.Verify(s => s.RefreshStatsAsync(), Times.Once);
    }
}
