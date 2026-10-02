using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Models;

namespace SocietyPujaManagerNet.Data;

public class AppDbContext : IdentityDbContext<AppUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<Sponsorship> Sponsorships => Set<Sponsorship>();
    public DbSet<FoodCoupon> FoodCoupons => Set<FoodCoupon>();
    public DbSet<DraftCart> DraftCarts => Set<DraftCart>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ChequeTransaction> ChequeTransactions => Set<ChequeTransaction>();
    public DbSet<CulturalEvent> CulturalEvents => Set<CulturalEvent>();
    public DbSet<CulturalApplication> CulturalApplications => Set<CulturalApplication>();
    public DbSet<FoodCouponDoc> FoodCouponDocs => Set<FoodCouponDoc>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Feedback> Feedbacks => Set<Feedback>();
    public DbSet<BannerAd> BannerAds => Set<BannerAd>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<CollectionTracker> CollectionTrackers => Set<CollectionTracker>();
    public DbSet<MasterConfig> MasterConfigs => Set<MasterConfig>();
    public DbSet<PaymentProof> PaymentProofs => Set<PaymentProof>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<DashboardStats> DashboardStats => Set<DashboardStats>();
    public DbSet<CashMember> CashMembers => Set<CashMember>();
    public DbSet<CashTransaction> CashTransactions => Set<CashTransaction>();
    public DbSet<Souvenir> Souvenirs => Set<Souvenir>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Primary keys
        builder.Entity<Resident>().HasKey(e => e.Id);
        builder.Entity<Donation>().HasKey(e => e.Id);
        builder.Entity<Sponsorship>().HasKey(e => e.Id);
        builder.Entity<FoodCoupon>().HasKey(e => e.Id);
        builder.Entity<FoodCouponDoc>().HasKey(e => e.Id);
        builder.Entity<DraftCart>().HasKey(e => e.Id);
        builder.Entity<Expense>().HasKey(e => e.Id);
        builder.Entity<ChequeTransaction>().HasKey(e => e.Id);
        builder.Entity<CulturalEvent>().HasKey(e => e.Id);
        builder.Entity<CulturalApplication>().HasKey(e => e.Id);
        builder.Entity<Notification>().HasKey(e => e.Id);
        builder.Entity<Feedback>().HasKey(e => e.Id);
        builder.Entity<BannerAd>().HasKey(e => e.Id);
        builder.Entity<Vendor>().HasKey(e => e.Id);
        builder.Entity<CollectionTracker>().HasKey(e => e.Id);
        builder.Entity<MasterConfig>().HasKey(e => e.Id);
        builder.Entity<PaymentProof>().HasKey(e => e.Id);
        builder.Entity<AuditLog>().HasKey(e => e.Id);
        builder.Entity<DashboardStats>().HasKey(e => e.Id);
        builder.Entity<CashMember>().HasKey(e => e.Id);
        builder.Entity<CashTransaction>().HasKey(e => e.Id);
        builder.Entity<Souvenir>().HasKey(e => e.Id);

        // Indexes for frequently queried columns
        builder.Entity<Souvenir>().HasIndex(e => e.FlatNumber);
        builder.Entity<Souvenir>().HasIndex(e => e.ResidentId);
        builder.Entity<CashTransaction>().HasIndex(e => e.MemberId);

        // Indexes for frequently queried columns
        builder.Entity<Resident>().HasIndex(e => e.FlatNumber);
        builder.Entity<Resident>().HasIndex(e => e.Block);
        builder.Entity<Resident>().HasIndex(e => e.SubscriptionStatus);

        builder.Entity<Donation>().HasIndex(e => e.FlatNumber);
        builder.Entity<Donation>().HasIndex(e => e.ResidentId);

        builder.Entity<FoodCoupon>().HasIndex(e => e.ResidentId);
        builder.Entity<FoodCoupon>().HasIndex(e => e.FlatNumber);
        builder.Entity<FoodCoupon>().HasIndex(e => e.FlatDocId);
        builder.Entity<FoodCoupon>().HasIndex(e => e.IsOnline);

        builder.Entity<FoodCouponDoc>().HasIndex(e => e.FlatNumber);

        builder.Entity<DraftCart>().HasIndex(e => e.FlatNumber);
        builder.Entity<DraftCart>().HasIndex(e => e.ResidentId);
        builder.Entity<DraftCart>().HasIndex(e => e.Status);

        builder.Entity<CulturalEvent>().HasIndex(e => e.ReadableId);

        builder.Entity<CulturalApplication>().HasIndex(e => e.EventId);
        builder.Entity<CulturalApplication>().HasIndex(e => e.FlatNumber);

        builder.Entity<Feedback>().HasIndex(e => e.FlatNumber);

        builder.Entity<AuditLog>().HasIndex(e => e.EntityType);
        builder.Entity<AuditLog>().HasIndex(e => e.Timestamp);
    }
}
