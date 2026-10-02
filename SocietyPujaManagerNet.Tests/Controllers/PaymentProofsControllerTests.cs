using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Services;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class PaymentProofsControllerTests : ControllerTestBase
{
    [Fact]
    public async Task GetById_CallsServiceAndReturnsImages()
    {
        var proofServiceMock = new Mock<IPaymentProofService>();
        proofServiceMock.Setup(s => s.GetProofAsync("rec-1"))
            .ReturnsAsync(new List<string> { "data:image/jpeg;base64,mock" });

        var controller = new PaymentProofsController(proofServiceMock.Object);
        SetUser(controller);

        var result = await controller.GetById("rec-1");
        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var list = ok!.Value as List<string>;
        list.Should().ContainSingle("data:image/jpeg;base64,mock");
    }

    [Fact]
    public async Task Save_CallsService()
    {
        var proofServiceMock = new Mock<IPaymentProofService>();
        var controller = new PaymentProofsController(proofServiceMock.Object);
        SetUser(controller);

        var images = new List<string> { "data:image/jpeg;base64,mock" };
        var result = await controller.Save("rec-1", images);

        result.Should().BeOfType<OkResult>();
        proofServiceMock.Verify(s => s.SaveProofAsync("rec-1", images), Times.Once);
    }
}
