using Microsoft.AspNetCore.Identity;

namespace SocietyPujaManagerNet.Models;

public class AppUser : IdentityUser
{
    public string? FullName { get; set; }
    public string? Role { get; set; }
    public bool IsActive { get; set; } = true;
}
