using Microsoft.EntityFrameworkCore;
using SocietyPujaManagerNet.Data;
using SocietyPujaManagerNet.Models;
using System.Text.Json;

namespace SocietyPujaManagerNet.Services;

public interface IDashboardStatsService
{
    void QueueRefresh();
    Task<DashboardStats?> GetStatsAsync();
    Task RefreshStatsAsync();
}

public class DashboardStatsService : IDashboardStatsService, IDisposable
{
    private readonly IServiceScopeFactory _scopeFactory;
    private Timer? _debounceTimer;
    private readonly object _lock = new();
    private const int DebounceMs = 5000;

    public DashboardStatsService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory = scopeFactory;
    }

    public void QueueRefresh()
    {
        lock (_lock)
        {
            _debounceTimer?.Dispose();
            _debounceTimer = new Timer(async _ =>
            {
                try { await RefreshStatsAsync(); }
                catch (Exception ex) { Console.Error.WriteLine($"Dashboard stats refresh failed: {ex.Message}"); }
            }, null, DebounceMs, Timeout.Infinite);
        }
    }

    public async Task<DashboardStats?> GetStatsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stats = await db.DashboardStats.FindAsync("summary");
        if (stats == null)
        {
            await RefreshStatsAsync();
            stats = await db.DashboardStats.FindAsync("summary");
        }
        return stats;
    }

    public async Task RefreshStatsAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var residents = await db.Residents.ToListAsync();
        var donations = await db.Donations.ToListAsync();
        var souvenirs = await db.Souvenirs.ToListAsync();
        var sponsorships = await db.Sponsorships.ToListAsync();
        var foodCoupons = await db.FoodCoupons.ToListAsync();
        var expenses = await db.Expenses.ToListAsync();
        var feedbacks = await db.Feedbacks.ToListAsync();
        var leads = await db.CollectionTrackers.ToListAsync();
        var chequeTransactions = await db.ChequeTransactions.ToListAsync();

        // Subscription stats
        var paid = residents.Where(r => r.SubscriptionStatus == "paid").ToList();
        var pending = residents.Where(r => r.SubscriptionStatus == "pending").ToList();
        var subTotalCollected = paid.Sum(r => r.SubscriptionAmount);
        var subCashCollected = paid.Where(r => string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(r => r.SubscriptionAmount);

        var subscription = new
        {
            totalFlats = residents.Count,
            paidCount = paid.Count,
            pendingCount = pending.Count,
            totalCollected = subTotalCollected,
            cashCollected = subCashCollected,
            bankCollected = subTotalCollected - subCashCollected,
            cashCount = paid.Count(r => string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)),
            accountCount = paid.Count(r => !string.Equals(r.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)),
            collectionPercentage = residents.Count > 0 ? Math.Round((double)paid.Count / residents.Count * 100, 1) : 0.0
        };

        // Donation stats
        var donTotalAmount = donations.Sum(d => d.Amount);
        var donCashAmount = donations.Where(d => string.Equals(d.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(d => d.Amount);
        var donation = new
        {
            totalDonations = donations.Count,
            totalAmount = donTotalAmount,
            cashAmount = donCashAmount,
            bankAmount = donTotalAmount - donCashAmount
        };

        // Souvenir stats
        var souvTotalAmount = souvenirs.Sum(s => s.Amount);
        var souvCashAmount = souvenirs.Where(s => string.Equals(s.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(s => s.Amount);
        var souvenir = new
        {
            totalSouvenirs = souvenirs.Count,
            totalAmount = souvTotalAmount,
            cashAmount = souvCashAmount,
            bankAmount = souvTotalAmount - souvCashAmount
        };

        // Sponsorship stats
        var received = sponsorships.Where(s => s.Status != "Pending" && s.Status != "Cancelled").ToList();
        var pendingSpon = sponsorships.Where(s => s.Status == "Pending").ToList();
        var cancelledSpon = sponsorships.Where(s => s.Status == "Cancelled").ToList();
        var sponTotalAmount = received.Sum(s => s.Amount);
        var sponCashAmount = received.Where(s => string.Equals(s.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(s => s.Amount);
        var externalSpon = received.Where(s => (s.SponsorType ?? "External") == "External").ToList();
        var internalSpon = received.Where(s => (s.SponsorType ?? "External") == "Internal").ToList();
        var externalAmount = externalSpon.Sum(s => s.Amount);
        var internalAmount = internalSpon.Sum(s => s.Amount);
        var totalCamAmount = Math.Round(externalAmount * 0.10m);

        var sponsorship = new
        {
            totalSponsorships = received.Count,
            pendingSponsorships = pendingSpon.Count,
            pendingAmount = pendingSpon.Sum(s => s.Amount),
            cancelledCount = cancelledSpon.Count,
            cancelledAmount = cancelledSpon.Sum(s => s.Amount),
            totalAmount = sponTotalAmount,
            cashAmount = sponCashAmount,
            bankAmount = sponTotalAmount - sponCashAmount,
            externalCount = externalSpon.Count,
            externalAmount,
            internalCount = internalSpon.Count,
            internalAmount,
            totalCamAmount,
            totalNetAmount = sponTotalAmount - totalCamAmount
        };

        // Food coupon stats
        var fcTotalAmount = foodCoupons.Sum(c => c.TotalAmount);
        var fcCashAmount = foodCoupons.Where(c => string.Equals(c.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(c => c.TotalAmount);
        var fcFocAmount = foodCoupons.Where(c => string.Equals(c.PaymentMode, "FOC", StringComparison.OrdinalIgnoreCase)).Sum(c => c.FocValue);
        var foodCoupon = new
        {
            totalCoupons = foodCoupons.Count,
            totalAmount = fcTotalAmount,
            cashAmount = fcCashAmount,
            bankAmount = Math.Max(0, fcTotalAmount - fcCashAmount),
            focAmount = fcFocAmount,
            totalDineOut = foodCoupons.Sum(c => c.NormalDineOutCount + c.AdditionalDineOutCount),
            totalParcel = foodCoupons.Sum(c => c.NormalParcelCount + c.AdditionalParcelCount)
        };

        // Expense stats
        var expTotalAmount = expenses.Sum(e => e.Amount);
        var expCashAmount = expenses.Where(e => string.Equals(e.PaymentMode, "Cash", StringComparison.OrdinalIgnoreCase)).Sum(e => e.Amount);
        var expense = new
        {
            totalExpenses = expenses.Count,
            totalAmount = expTotalAmount,
            cashAmount = expCashAmount,
            bankAmount = expTotalAmount - expCashAmount,
            categoryBreakdown = expenses.GroupBy(e => e.Category).ToDictionary(g => g.Key, g => g.Sum(e => e.Amount))
        };

        // Cheque transaction stats
        var chequeTransaction = new
        {
            totalTransactions = chequeTransactions.Count,
            chequeToCashAmount = chequeTransactions.Where(t => t.TransactionType == "To Cash").Sum(t => t.Amount),
            chequeToVendorAmount = chequeTransactions.Where(t => t.TransactionType == "To Vendor").Sum(t => t.Amount)
        };

        // Lead stats
        var leadsObj = new
        {
            totalLeads = leads.Count,
            pendingCount = leads.Count(l => l.Status == "Pending"),
            closedCount = leads.Count(l => l.Status == "Closed"),
            paidCount = leads.Count(l => l.Status == "Paid"),
            totalPromisedAmount = leads.Sum(l => l.Amount),
            paidAmount = leads.Where(l => l.Status == "Paid").Sum(l => l.Amount)
        };

        // Feedback counts
        var feedbackCounts = feedbacks.GroupBy(f => f.Category ?? "General").ToDictionary(g => g.Key, g => g.Count());

        // Sponsorship leads summary
        var sponsorshipLeadsSummary = new
        {
            totalLeads = sponsorships.Count,
            pendingLeads = sponsorships.Count(s => (s.Status ?? "Pending") == "Pending"),
            expectedAmount = sponsorships.Sum(s => s.Amount),
            receivedAmount = sponsorships.Where(s => s.Status == "Received").Sum(s => s.Amount)
        };

        var statsDoc = new
        {
            subscription,
            donation,
            souvenir,
            sponsorship,
            foodCoupon,
            expense,
            chequeTransaction,
            leads = leadsObj,
            feedbackCounts,
            totalFeedbacks = feedbacks.Count,
            sponsorshipLeadsSummary,
            lastUpdatedAt = DateTime.UtcNow.ToString("o")
        };

        var existing = await db.DashboardStats.FindAsync("summary");
        if (existing != null)
        {
            existing.StatsJson = JsonSerializer.Serialize(statsDoc);
            existing.LastUpdatedAt = DateTime.UtcNow;
        }
        else
        {
            db.DashboardStats.Add(new DashboardStats
            {
                Id = "summary",
                StatsJson = JsonSerializer.Serialize(statsDoc),
                LastUpdatedAt = DateTime.UtcNow
            });
        }
        await db.SaveChangesAsync();
    }

    public void Dispose()
    {
        _debounceTimer?.Dispose();
    }
}
