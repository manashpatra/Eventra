using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class FeedbackControllerTests : ControllerTestBase
{
    [Fact]
    public async Task Reply_ValidFeedback_UpdatesReplyFields()
    {
        using var db = TestDbContextFactory.Create();
        db.Feedbacks.Add(new Feedback { Id = "fb1", Name = "Resident", Message = "Great lighting!" });
        await db.SaveChangesAsync();

        var controller = new FeedbackController(db, AuditMock.Object, StatsMock.Object);
        SetUser(controller);

        var replyPayload = new Dictionary<string, string> { { "replyMessage", "Thank you for the kind words!" } };
        var result = await controller.Reply("fb1", replyPayload);

        result.Should().BeOfType<OkObjectResult>();
        var updated = await db.Feedbacks.FindAsync("fb1");
        updated!.ReplyMessage.Should().Be("Thank you for the kind words!");
    }

    [Fact]
    public async Task Create_NormalizesFlatNumberToUppercase()
    {
        using var db = TestDbContextFactory.Create();
        var controller = new FeedbackController(db, AuditMock.Object, StatsMock.Object);

        var feedback = new Feedback
        {
            Name = "John Doe",
            PhoneNumber = "9876543210",
            FlatNumber = "5/3a",
            Category = "Suggestion",
            Message = "Great arrangements!"
        };

        var result = await controller.Create(feedback);
        result.Should().BeOfType<OkObjectResult>();

        feedback.FlatNumber.Should().Be("5/3A");
        var saved = await db.Feedbacks.FindAsync(feedback.Id);
        saved.Should().NotBeNull();
        saved!.FlatNumber.Should().Be("5/3A");
    }
}
