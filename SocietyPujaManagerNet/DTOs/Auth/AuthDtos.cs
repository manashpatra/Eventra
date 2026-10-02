namespace SocietyPujaManagerNet.DTOs.Auth;

public class LoginRequestDto
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}

public class LoginResponseDto
{
    public string Token { get; set; } = "";
    public string Email { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Role { get; set; }
    public string UserId { get; set; } = "";
}

public class RegisterRequestDto
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public string? FullName { get; set; }
    public string? Role { get; set; }
}
