using Microsoft.EntityFrameworkCore.Migrations;

namespace LMS.Infrastructure.Persistence.Migrations;

/// <summary>
/// Migration: Thêm cột Role vào bảng Users.
/// Default "Student" đảm bảo nguyên tắc Least Privilege cho tài khoản hiện có.
/// </summary>
public partial class AddUserRole : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Role",
            table: "Users",
            type: "nvarchar(20)",
            maxLength: 20,
            nullable: false,
            defaultValue: "Student");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Role",
            table: "Users");
    }
}
