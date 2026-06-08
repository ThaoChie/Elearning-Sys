-- Migration: Create AuditLogs table with immutability triggers
-- Run after EF Core migration generates the table

-- [1] Tạo trigger chặn UPDATE
IF OBJECT_ID('dbo.trg_AuditLogs_BlockUpdate', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AuditLogs_BlockUpdate;
GO

CREATE TRIGGER dbo.trg_AuditLogs_BlockUpdate
ON dbo.AuditLogs
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('UPDATE on AuditLogs is forbidden. Audit records are immutable.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- [2] Tạo trigger chặn DELETE
IF OBJECT_ID('dbo.trg_AuditLogs_BlockDelete', 'TR') IS NOT NULL
    DROP TRIGGER dbo.trg_AuditLogs_BlockDelete;
GO

CREATE TRIGGER dbo.trg_AuditLogs_BlockDelete
ON dbo.AuditLogs
AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    RAISERROR('DELETE on AuditLogs is forbidden. Audit records are immutable.', 16, 1);
    ROLLBACK TRANSACTION;
END;
GO

-- [3] Thu hồi quyền UPDATE/DELETE của application database user
-- Thay 'lms_app_user' bằng user thực tế dùng trong connection string
-- DENY UPDATE ON dbo.AuditLogs TO lms_app_user;
-- DENY DELETE ON dbo.AuditLogs TO lms_app_user;
