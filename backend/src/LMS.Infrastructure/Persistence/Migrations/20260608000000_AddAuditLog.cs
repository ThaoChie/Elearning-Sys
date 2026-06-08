using Microsoft.EntityFrameworkCore.Migrations;

namespace LMS.Infrastructure.Persistence.Migrations;

public partial class AddAuditLog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AuditLogs",
            columns: table => new
            {
                LogID = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                Timestamp = table.Column<DateTimeOffset>(type: "datetimeoffset(7)", nullable: false),
                ActorID = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                Action = table.Column<string>(type: "nvarchar(512)", maxLength: 512, nullable: false),
                IP = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                HMACSignature = table.Column<string>(type: "nvarchar(88)", maxLength: 88, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_AuditLogs", x => x.LogID);
            });

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_ActorID",
            table: "AuditLogs",
            column: "ActorID");

        migrationBuilder.CreateIndex(
            name: "IX_AuditLogs_Timestamp",
            table: "AuditLogs",
            column: "Timestamp");

        // Trigger chặn UPDATE
        migrationBuilder.Sql(@"
CREATE TRIGGER dbo.trg_AuditLogs_BlockUpdate
ON dbo.AuditLogs
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('UPDATE on AuditLogs is forbidden. Audit records are immutable.', 16, 1);
    ROLLBACK TRANSACTION;
END;");

        // Trigger chặn DELETE
        migrationBuilder.Sql(@"
CREATE TRIGGER dbo.trg_AuditLogs_BlockDelete
ON dbo.AuditLogs
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('DELETE on AuditLogs is forbidden. Audit records are immutable.', 16, 1);
    ROLLBACK TRANSACTION;
END;");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS dbo.trg_AuditLogs_BlockDelete;");
        migrationBuilder.Sql("DROP TRIGGER IF EXISTS dbo.trg_AuditLogs_BlockUpdate;");
        migrationBuilder.DropTable(name: "AuditLogs");
    }
}
