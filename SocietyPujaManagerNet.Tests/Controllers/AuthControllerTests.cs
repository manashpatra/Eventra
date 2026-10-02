using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Moq;
using SocietyPujaManagerNet.Controllers;
using SocietyPujaManagerNet.DTOs.Auth;
using SocietyPujaManagerNet.Models;
using SocietyPujaManagerNet.Services;
using SocietyPujaManagerNet.Tests.Helpers;

namespace SocietyPujaManagerNet.Tests.Controllers;

public class AuthControllerTests : ControllerTestBase
{
    private readonly Mock<UserManager<AppUser>> _userManagerMock;
    private readonly Mock<SignInManager<AppUser>> _signInManagerMock;
    private readonly Mock<ITokenService> _tokenServiceMock;
    private readonly AuthController _controller;

    public AuthControllerTests()
    {
        var store = new Mock<IUserStore<AppUser>>();
        _userManagerMock = new Mock<UserManager<AppUser>>(store.Object, null!, null!, null!, null!, null!, null!, null!, null!);
        _signInManagerMock = new Mock<SignInManager<AppUser>>(
            _userManagerMock.Object,
            new Mock<Microsoft.AspNetCore.Http.IHttpContextAccessor>().Object,
            new Mock<IUserClaimsPrincipalFactory<AppUser>>().Object,
            null!, null!, null!, null!);
        _tokenServiceMock = new Mock<ITokenService>();

        _controller = new AuthController(_userManagerMock.Object, _signInManagerMock.Object, _tokenServiceMock.Object);
        SetUser(_controller);
    }

    [Fact]
    public async Task Login_ValidCredentials_ReturnsOkWithToken()
    {
        var user = new AppUser { Id = "u1", Email = "test@dpc.com", FullName = "Test User", Role = "Admin", IsActive = true };
        _userManagerMock.Setup(m => m.FindByEmailAsync("test@dpc.com")).ReturnsAsync(user);
        _signInManagerMock.Setup(m => m.CheckPasswordSignInAsync(user, "Password123", false))
            .ReturnsAsync(Microsoft.AspNetCore.Identity.SignInResult.Success);
        _tokenServiceMock.Setup(m => m.GenerateToken(user)).Returns("mocked-jwt-token");

        var result = await _controller.Login(new LoginRequestDto { Email = "test@dpc.com", Password = "Password123" });

        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
        var response = ok!.Value as LoginResponseDto;
        response.Should().NotBeNull();
        response!.Token.Should().Be("mocked-jwt-token");
        response.Email.Should().Be("test@dpc.com");
    }

    [Fact]
    public async Task Login_InvalidEmail_ReturnsUnauthorized()
    {
        _userManagerMock.Setup(m => m.FindByEmailAsync("nonexistent@dpc.com")).ReturnsAsync((AppUser?)null);

        var result = await _controller.Login(new LoginRequestDto { Email = "nonexistent@dpc.com", Password = "Password123" });

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task Login_InactiveUser_ReturnsUnauthorized()
    {
        var user = new AppUser { Id = "u2", Email = "inactive@dpc.com", IsActive = false };
        _userManagerMock.Setup(m => m.FindByEmailAsync("inactive@dpc.com")).ReturnsAsync(user);

        var result = await _controller.Login(new LoginRequestDto { Email = "inactive@dpc.com", Password = "Password123" });

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public void Me_AuthenticatedUser_ReturnsUserInfo()
    {
        var result = _controller.Me();

        var ok = result as OkObjectResult;
        ok.Should().NotBeNull();
    }
}
