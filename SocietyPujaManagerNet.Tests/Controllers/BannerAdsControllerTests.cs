using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class BannerAdsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetActive_ReturnsOnlyActiveAds()
    {
        using var db = TestDbContextFactory.Create();
        db.BannerAds.AddRange(
            new BannerAd { Id = "b1", Title = "Active Ad", Active = true, Slot = "hero_banner" },
            new BannerAd { Id = "b2", Title = "Inactive Ad", Active = false, Slot = "hero_banner" }
        );
        await db.SaveChangesAsync();

        var controller = new BannerAdsController(db, AuditMock.Object);
        SetUser(controller);

        var result = await controller.GetActive("hero_banner");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<BannerAd>;
        list.Should().HaveCount(1);
        list![0].Title.Should().Be("Active Ad");
    }
}
