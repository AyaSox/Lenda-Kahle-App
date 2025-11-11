-- ============================================
-- PostgreSQL Database Verification Script
-- Lenda Kahle - Post-Migration Checks
-- ============================================

-- 1. List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Verify indexes on key tables
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('Loans', 'Repayments', 'LoanDocuments', 'AuditLogs', 'Notifications')
ORDER BY tablename, indexname;

-- 3. Check decimal precision for financial fields
SELECT 
    table_name,
    column_name, 
    data_type,
    numeric_precision,
    numeric_scale
FROM information_schema.columns
WHERE table_name IN ('Loans', 'Repayments', 'AffordabilityAssessments')
AND data_type = 'numeric'
ORDER BY table_name, column_name;

-- 4. Check timestamp columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE data_type LIKE 'timestamp%'
AND table_name IN ('Loans', 'Repayments', 'AuditLogs', 'Notifications', 'AspNetUsers')
ORDER BY table_name, column_name;

-- 5. Check text columns
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE data_type = 'text'
AND table_name IN ('Loans', 'LoanDocuments', 'AuditLogs')
ORDER BY table_name, column_name;

-- 6. Verify SystemSettings seed data
SELECT * FROM "SystemSettings" WHERE "Id" = 1;

-- 7. Check migration history
SELECT "MigrationId", "ProductVersion" 
FROM "__EFMigrationsHistory" 
ORDER BY "MigrationId";

-- 8. Count records in each table
SELECT 
    schemaname,
    tablename,
    n_live_tup AS row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 9. Check for any missing foreign keys
SELECT
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('Loans', 'Repayments', 'LoanDocuments', 'AuditLogs', 'Notifications')
ORDER BY tc.table_name;

-- 10. Database size and statistics
SELECT 
    pg_size_pretty(pg_database_size(current_database())) AS database_size,
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public') AS table_count,
    (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') AS index_count;
