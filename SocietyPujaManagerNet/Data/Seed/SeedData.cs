using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using System.Text.Json;

namespace SocietyPujaManagerNet.Data.Seed;

public static class SeedData
{
    public static async Task InitializeAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();

        // Ensure database is created and migrated
        await db.Database.EnsureCreatedAsync();

        // Ensure new tables exist in SQLite if upgrading existing database
        await db.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ""Souvenirs"" (
                ""Id"" TEXT NOT NULL CONSTRAINT ""PK_Souvenirs"" PRIMARY KEY,
                ""ResidentId"" TEXT,
                ""ResidentName"" TEXT NOT NULL DEFAULT '',
                ""FlatNumber"" TEXT NOT NULL DEFAULT '',
                ""DonorName"" TEXT NOT NULL DEFAULT '',
                ""Amount"" TEXT NOT NULL DEFAULT '0',
                ""PaymentMode"" TEXT NOT NULL DEFAULT 'Cash',
                ""PaymentProofUrl"" TEXT,
                ""Remarks"" TEXT NOT NULL DEFAULT '',
                ""TransactionDate"" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                ""CreatedAt"" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                ""UpdatedAt"" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            );
            CREATE INDEX IF NOT EXISTS ""IX_Souvenirs_FlatNumber"" ON ""Souvenirs"" (""FlatNumber"");
            CREATE INDEX IF NOT EXISTS ""IX_Souvenirs_ResidentId"" ON ""Souvenirs"" (""ResidentId"");

            CREATE TABLE IF NOT EXISTS ""CashMembers"" (
                ""Id"" TEXT NOT NULL CONSTRAINT ""PK_CashMembers"" PRIMARY KEY,
                ""Name"" TEXT NOT NULL DEFAULT '',
                ""Phone"" TEXT NOT NULL DEFAULT '',
                ""Role"" TEXT NOT NULL DEFAULT 'Member',
                ""InitialBalance"" TEXT NOT NULL DEFAULT '0',
                ""CurrentBalance"" TEXT NOT NULL DEFAULT '0',
                ""Notes"" TEXT NOT NULL DEFAULT '',
                ""IsActive"" INTEGER NOT NULL DEFAULT 1,
                ""CreatedBy"" TEXT NOT NULL DEFAULT 'Admin',
                ""CreatedAt"" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                ""LastTransactionAt"" TEXT
            );

            CREATE TABLE IF NOT EXISTS ""CashTransactions"" (
                ""Id"" TEXT NOT NULL CONSTRAINT ""PK_CashTransactions"" PRIMARY KEY,
                ""MemberId"" TEXT NOT NULL DEFAULT '',
                ""MemberName"" TEXT NOT NULL DEFAULT '',
                ""Type"" TEXT NOT NULL DEFAULT 'ADD',
                ""ToMemberId"" TEXT,
                ""ToMemberName"" TEXT,
                ""FromMemberId"" TEXT,
                ""FromMemberName"" TEXT,
                ""Amount"" TEXT NOT NULL DEFAULT '0',
                ""BalanceAfter"" TEXT NOT NULL DEFAULT '0',
                ""Date"" TEXT,
                ""Reason"" TEXT,
                ""Notes"" TEXT,
                ""RecordedBy"" TEXT,
                ""CreatedAt"" TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
                ""UpdatedAt"" TEXT,
                ""UpdatedBy"" TEXT
            );
            CREATE INDEX IF NOT EXISTS ""IX_CashTransactions_MemberId"" ON ""CashTransactions"" (""MemberId"");
        ");

        // Seed super admin user
        var adminEmail = "mpatradev@gmail.com";
        var existingAdmin = await userManager.FindByEmailAsync(adminEmail);
        if (existingAdmin == null)
        {
            var admin = new AppUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Super Admin",
                Role = "Super Admin",
                IsActive = true,
                EmailConfirmed = true
            };
            var result = await userManager.CreateAsync(admin, "Admin@123456");
            if (result.Succeeded)
            {
                Console.WriteLine($"Seeded admin user: {adminEmail}");
            }
            else
            {
                Console.Error.WriteLine($"Failed to seed admin: {string.Join(", ", result.Errors.Select(e => e.Description))}");
            }
        }

        // Seed default master config
        var existingConfig = await db.MasterConfigs.FindAsync("main-config");
        if (existingConfig == null)
        {
            var defaultConfig = new
            {
                id = "main-config",
                societyName = "Eternis",
                societyAddress = "59 Jessore Road, Doltala, Madhyamgram, WB - 700132",
                committeeName = "DPC",
                year = "2026-27",
                subscriptionAmount = 1500,
                dateFormat = "dd-MM-YYYY",
                upiPayeeAddress = "associationofeternisflatowners@icici",
                upiPayeeName = "DPC 2026-27",
                upiPayeeDescription = "",
                normalQuota = 4,
                pujaStartDate = "2026-10-16",
                pujaEndDate = "2027-03-31",
                userRoles = new object[] { },
                expenseCategories = new object[] { },
                foodDays = new object[] { },
                blocks = Enumerable.Range(1, 13).ToArray(),
                floors = Enumerable.Range(1, 11).ToArray(),
                flatTypes = new[] { "A", "B", "C", "D", "E", "F" },
                paymentModes = new[] { "UPI", "Cash", "Cheque", "Net Banking" },
                payees = new[] { "Cash Fund", "DCP Account" },
                publicLanguages = new
                {
                    enabled = true,
                    defaultLanguage = "en",
                    languages = new[]
                    {
                        new { code = "en", label = "English", nativeLabel = "English" },
                        new { code = "hi", label = "Hindi", nativeLabel = "हिन्दी" },
                        new { code = "bn", label = "Bengali", nativeLabel = "বাংলা" }
                    }
                },
                adminLanguages = new
                {
                    enabled = false,
                    defaultLanguage = "en",
                    languages = new[]
                    {
                        new { code = "en", label = "English", nativeLabel = "English" },
                        new { code = "hi", label = "Hindi", nativeLabel = "हिन्दी" },
                        new { code = "bn", label = "Bengali", nativeLabel = "বাংলা" }
                    }
                }
            };

            db.MasterConfigs.Add(new MasterConfig
            {
                Id = "main-config",
                ConfigJson = JsonSerializer.Serialize(defaultConfig),
                UpdatedAt = DateTime.UtcNow
            });
            await db.SaveChangesAsync();
            Console.WriteLine("Seeded default master config");
        }
    }
}
