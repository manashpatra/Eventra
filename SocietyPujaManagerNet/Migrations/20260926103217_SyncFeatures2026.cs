using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SocietyPujaManagerNet.Migrations
{
    /// <inheritdoc />
    public partial class SyncFeatures2026 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "RefundDate",
                table: "Sponsorships",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundMode",
                table: "Sponsorships",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefundRemarks",
                table: "Sponsorships",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AccessCode",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FlatDocId",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "FocValue",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsOnline",
                table: "FoodCoupons",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "IssuedBy",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastServedAt",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LastServedBy",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Redeemed",
                table: "FoodCoupons",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "RedeemedAt",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RedeemedBy",
                table: "FoodCoupons",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AgeFieldMode",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AgeGroupsJson",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "AllowGroupRegistration",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ApplicationCount",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CustomFieldsJson",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "EventEndDate",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaidEvent",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsTentative",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ItemCost",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ItemLabel",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<DateTime>(
                name: "LastDateToApply",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MaxCapacity",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxItems",
                table: "CulturalEvents",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PaymentPrefix",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReadableId",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SubEventCapacitiesJson",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SubEventCountsJson",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SubEventsJson",
                table: "CulturalEvents",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<int>(
                name: "Age",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "INTEGER");

            migrationBuilder.AddColumn<string>(
                name: "AdminComment",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "AdminPaymentConfirmed",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "AmountPaid",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CalculatedAgeGroup",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CapacityConsumed",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CustomFieldResponsesJson",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsGroup",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ItemCount",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ParticipantsJson",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "PaymentConfirmed",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMode",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentReference",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ScheduleSequence",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ScheduleTime",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SelectedDate",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SelectedSubEventsJson",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "CulturalApplications",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "FoodCouponDocs",
                columns: table => new
                {
                    Id = table.Column<string>(type: "TEXT", nullable: false),
                    FlatNumber = table.Column<string>(type: "TEXT", nullable: false),
                    ResidentId = table.Column<string>(type: "TEXT", nullable: false),
                    ResidentName = table.Column<string>(type: "TEXT", nullable: false),
                    AccessCode = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FoodCouponDocs", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FoodCoupons_FlatDocId",
                table: "FoodCoupons",
                column: "FlatDocId");

            migrationBuilder.CreateIndex(
                name: "IX_FoodCoupons_IsOnline",
                table: "FoodCoupons",
                column: "IsOnline");

            migrationBuilder.CreateIndex(
                name: "IX_CulturalEvents_ReadableId",
                table: "CulturalEvents",
                column: "ReadableId");

            migrationBuilder.CreateIndex(
                name: "IX_FoodCouponDocs_FlatNumber",
                table: "FoodCouponDocs",
                column: "FlatNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FoodCouponDocs");

            migrationBuilder.DropIndex(
                name: "IX_FoodCoupons_FlatDocId",
                table: "FoodCoupons");

            migrationBuilder.DropIndex(
                name: "IX_FoodCoupons_IsOnline",
                table: "FoodCoupons");

            migrationBuilder.DropIndex(
                name: "IX_CulturalEvents_ReadableId",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "RefundDate",
                table: "Sponsorships");

            migrationBuilder.DropColumn(
                name: "RefundMode",
                table: "Sponsorships");

            migrationBuilder.DropColumn(
                name: "RefundRemarks",
                table: "Sponsorships");

            migrationBuilder.DropColumn(
                name: "AccessCode",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "FlatDocId",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "FocValue",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "IsOnline",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "IssuedBy",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "LastServedAt",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "LastServedBy",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "Redeemed",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "RedeemedAt",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "RedeemedBy",
                table: "FoodCoupons");

            migrationBuilder.DropColumn(
                name: "AgeFieldMode",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "AgeGroupsJson",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "AllowGroupRegistration",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "ApplicationCount",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "CustomFieldsJson",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "EventEndDate",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "IsPaidEvent",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "IsTentative",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "ItemCost",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "ItemLabel",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "LastDateToApply",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "MaxCapacity",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "MaxItems",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "PaymentPrefix",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "ReadableId",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "SubEventCapacitiesJson",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "SubEventCountsJson",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "SubEventsJson",
                table: "CulturalEvents");

            migrationBuilder.DropColumn(
                name: "AdminComment",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "AdminPaymentConfirmed",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "AmountPaid",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "CalculatedAgeGroup",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "CapacityConsumed",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "CustomFieldResponsesJson",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "IsGroup",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "ItemCount",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "ParticipantsJson",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "PaymentConfirmed",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "PaymentMode",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "PaymentReference",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "ScheduleSequence",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "ScheduleTime",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "SelectedDate",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "SelectedSubEventsJson",
                table: "CulturalApplications");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "CulturalApplications");

            migrationBuilder.AlterColumn<int>(
                name: "Age",
                table: "CulturalApplications",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "INTEGER",
                oldNullable: true);
        }
    }
}
