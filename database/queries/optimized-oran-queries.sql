-- Optimized O-RAN SQL Queries to Eliminate N+1 Problems
-- Performance-optimized queries with proper JOINs, CTEs, and window functions

-- =============================================================================
-- 1. CELL PERFORMANCE DASHBOARD - Avoiding N+1 by batch loading all cell data
-- =============================================================================

-- BAD: N+1 Query Pattern (DON'T DO THIS)
-- This would require N+1 queries: 1 for cells + N individual PM queries per cell
/*
SELECT cell_id, cell_name FROM oran_cells WHERE deployment_status = 'active';
-- Then for each cell:
SELECT AVG(prb_utilization_dl) FROM oran_pm_data WHERE cell_id = ? AND timestamp >= NOW() - INTERVAL '1 hour';
*/

-- GOOD: Optimized single query with JOIN
WITH recent_pm AS (
    SELECT 
        cell_id,
        AVG(prb_utilization_dl) AS avg_prb_util_dl,
        AVG(prb_utilization_ul) AS avg_prb_util_ul,
        AVG(throughput_dl_mbps) AS avg_throughput_dl,
        AVG(throughput_ul_mbps) AS avg_throughput_ul,
        MAX(throughput_dl_mbps) AS peak_throughput_dl,
        AVG(cqi_avg) AS avg_cqi,
        AVG(rsrp_avg) AS avg_rsrp,
        COUNT(*) AS measurement_count,
        MAX(timestamp) AS last_measurement
    FROM oran_pm_data
    WHERE timestamp >= NOW() - INTERVAL '1 hour'
        AND metric_type = 'radio_performance'
    GROUP BY cell_id
)
SELECT 
    c.cell_id,
    c.cell_name,
    c.global_cell_id,
    c.vendor,
    c.bandwidth_mhz,
    COALESCE(pm.avg_prb_util_dl, 0) AS current_prb_utilization_dl,
    COALESCE(pm.avg_prb_util_ul, 0) AS current_prb_utilization_ul,
    COALESCE(pm.avg_throughput_dl, 0) AS current_throughput_dl_mbps,
    COALESCE(pm.peak_throughput_dl, 0) AS peak_throughput_dl_mbps,
    COALESCE(pm.avg_cqi, 0) AS current_cqi,
    COALESCE(pm.avg_rsrp, -999) AS current_rsrp,
    COALESCE(pm.measurement_count, 0) AS data_points,
    pm.last_measurement,
    CASE 
        WHEN pm.last_measurement < NOW() - INTERVAL '30 minutes' THEN 'stale'
        WHEN pm.avg_prb_util_dl > 85 THEN 'high_load'
        WHEN pm.avg_prb_util_dl > 70 THEN 'medium_load'
        ELSE 'normal'
    END AS cell_status
FROM oran_cells c
LEFT JOIN recent_pm pm ON c.cell_id = pm.cell_id
WHERE c.deployment_status = 'active'
ORDER BY pm.avg_prb_util_dl DESC NULLS LAST;

-- =============================================================================
-- 2. MULTI-CELL KPI TRENDS - Using window functions instead of subqueries
-- =============================================================================

-- BAD: N+1 with subquery for each cell's trend calculation
/*
SELECT cell_id, 
    (SELECT AVG(prb_utilization_dl) FROM oran_pm_data WHERE cell_id = c.cell_id AND timestamp >= NOW() - INTERVAL '24 hours') as avg_24h,
    (SELECT AVG(prb_utilization_dl) FROM oran_pm_data WHERE cell_id = c.cell_id AND timestamp >= NOW() - INTERVAL '1 hour') as avg_1h
FROM oran_cells c;
*/

-- GOOD: Single query with window functions and CTEs
WITH hourly_kpis AS (
    SELECT 
        cell_id,
        time_bucket('1 hour', timestamp) AS hour_bucket,
        AVG(prb_utilization_dl) AS avg_prb_util_dl,
        AVG(throughput_dl_mbps) AS avg_throughput_dl,
        AVG(spectral_efficiency_dl) AS avg_spectral_eff,
        COUNT(*) AS sample_count
    FROM oran_pm_data
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
        AND prb_utilization_dl IS NOT NULL
    GROUP BY cell_id, time_bucket('1 hour', timestamp)
),
kpi_trends AS (
    SELECT 
        cell_id,
        hour_bucket,
        avg_prb_util_dl,
        avg_throughput_dl,
        avg_spectral_eff,
        -- Calculate trend using LAG window function
        LAG(avg_prb_util_dl, 1) OVER (PARTITION BY cell_id ORDER BY hour_bucket) AS prev_hour_prb,
        LAG(avg_throughput_dl, 1) OVER (PARTITION BY cell_id ORDER BY hour_bucket) AS prev_hour_throughput,
        -- Calculate 24-hour moving average
        AVG(avg_prb_util_dl) OVER (
            PARTITION BY cell_id 
            ORDER BY hour_bucket 
            ROWS BETWEEN 23 PRECEDING AND CURRENT ROW
        ) AS moving_avg_24h_prb,
        ROW_NUMBER() OVER (PARTITION BY cell_id ORDER BY hour_bucket DESC) AS rn
    FROM hourly_kpis
)
SELECT 
    c.cell_id,
    c.cell_name,
    c.global_cell_id,
    kt.avg_prb_util_dl AS current_hour_prb_util,
    kt.avg_throughput_dl AS current_hour_throughput,
    kt.moving_avg_24h_prb AS avg_24h_prb_util,
    CASE 
        WHEN kt.prev_hour_prb IS NULL THEN 0
        ELSE ((kt.avg_prb_util_dl - kt.prev_hour_prb) / kt.prev_hour_prb) * 100
    END AS prb_trend_percent,
    CASE 
        WHEN kt.prev_hour_throughput IS NULL THEN 0
        ELSE ((kt.avg_throughput_dl - kt.prev_hour_throughput) / kt.prev_hour_throughput) * 100
    END AS throughput_trend_percent
FROM oran_cells c
JOIN kpi_trends kt ON c.cell_id = kt.cell_id AND kt.rn = 1
WHERE c.deployment_status = 'active'
ORDER BY kt.avg_prb_util_dl DESC;

-- =============================================================================
-- 3. FAULT CORRELATION WITH PERFORMANCE - Efficient JOIN instead of N+1
-- =============================================================================

-- BAD: N+1 pattern for fault correlation
/*
SELECT * FROM oran_fault_events WHERE timestamp >= NOW() - INTERVAL '1 hour';
-- Then for each fault:
SELECT AVG(prb_utilization_dl) FROM oran_pm_data WHERE cell_id = ? AND timestamp BETWEEN fault_time - INTERVAL '15 minutes' AND fault_time + INTERVAL '15 minutes';
*/

-- GOOD: Correlated fault and performance data in single query
WITH recent_faults AS (
    SELECT 
        cell_id,
        event_name,
        severity,
        timestamp AS fault_time,
        alarm_id,
        EXTRACT(EPOCH FROM timestamp) AS fault_epoch
    FROM oran_fault_events
    WHERE timestamp >= NOW() - INTERVAL '2 hours'
        AND severity IN ('critical', 'major')
),
performance_around_faults AS (
    SELECT 
        pm.cell_id,
        rf.fault_time,
        rf.event_name,
        rf.severity,
        rf.alarm_id,
        -- Performance metrics 15 minutes before and after fault
        AVG(CASE 
            WHEN pm.timestamp BETWEEN rf.fault_time - INTERVAL '15 minutes' AND rf.fault_time
            THEN pm.prb_utilization_dl 
        END) AS prb_util_before_fault,
        AVG(CASE 
            WHEN pm.timestamp BETWEEN rf.fault_time AND rf.fault_time + INTERVAL '15 minutes'
            THEN pm.prb_utilization_dl 
        END) AS prb_util_after_fault,
        AVG(CASE 
            WHEN pm.timestamp BETWEEN rf.fault_time - INTERVAL '15 minutes' AND rf.fault_time
            THEN pm.throughput_dl_mbps 
        END) AS throughput_before_fault,
        AVG(CASE 
            WHEN pm.timestamp BETWEEN rf.fault_time AND rf.fault_time + INTERVAL '15 minutes'
            THEN pm.throughput_dl_mbps 
        END) AS throughput_after_fault,
        COUNT(CASE 
            WHEN pm.timestamp BETWEEN rf.fault_time - INTERVAL '15 minutes' AND rf.fault_time + INTERVAL '15 minutes'
            THEN 1 
        END) AS performance_samples
    FROM recent_faults rf
    JOIN oran_pm_data pm ON rf.cell_id = pm.cell_id
    WHERE pm.timestamp BETWEEN rf.fault_time - INTERVAL '15 minutes' AND rf.fault_time + INTERVAL '15 minutes'
    GROUP BY pm.cell_id, rf.fault_time, rf.event_name, rf.severity, rf.alarm_id
)
SELECT 
    c.cell_name,
    c.global_cell_id,
    pf.fault_time,
    pf.event_name,
    pf.severity,
    pf.alarm_id,
    COALESCE(pf.prb_util_before_fault, 0) AS prb_utilization_before,
    COALESCE(pf.prb_util_after_fault, 0) AS prb_utilization_after,
    COALESCE(pf.throughput_before_fault, 0) AS throughput_before_mbps,
    COALESCE(pf.throughput_after_fault, 0) AS throughput_after_mbps,
    CASE 
        WHEN pf.prb_util_before_fault IS NOT NULL AND pf.prb_util_after_fault IS NOT NULL 
        THEN ((pf.prb_util_after_fault - pf.prb_util_before_fault) / pf.prb_util_before_fault) * 100
    END AS prb_impact_percent,
    pf.performance_samples
FROM performance_around_faults pf
JOIN oran_cells c ON pf.cell_id = c.cell_id
ORDER BY pf.fault_time DESC;

-- =============================================================================
-- 4. NETWORK SLICE PERFORMANCE AGGREGATION - Batch processing
-- =============================================================================

-- BAD: N+1 for slice KPIs
/*
SELECT DISTINCT slice_id FROM oran_slice_kpis WHERE timestamp >= NOW() - INTERVAL '1 hour';
-- Then for each slice:
SELECT AVG(latency_ms), AVG(throughput_dl_mbps) FROM oran_slice_kpis WHERE slice_id = ?;
*/

-- GOOD: Comprehensive slice performance in single query
WITH slice_performance AS (
    SELECT 
        sk.slice_id,
        sk.s_nssai,
        sk.slice_type,
        COUNT(DISTINCT sk.cell_id) AS active_cells,
        AVG(sk.throughput_dl_mbps) AS avg_throughput_dl,
        AVG(sk.throughput_ul_mbps) AS avg_throughput_ul,
        AVG(sk.latency_ms) AS avg_latency,
        MAX(sk.latency_ms) AS max_latency,
        AVG(sk.packet_loss_rate) AS avg_packet_loss,
        AVG(sk.availability_percent) AS avg_availability,
        SUM(sk.active_users) AS total_active_users,
        MAX(sk.peak_users) AS peak_users_across_cells,
        -- SLA compliance calculation
        AVG(CASE WHEN sk.latency_ms <= 10 THEN 100.0 ELSE 0.0 END) AS latency_sla_compliance,
        AVG(CASE WHEN sk.availability_percent >= 99.9 THEN 100.0 ELSE 0.0 END) AS availability_sla_compliance
    FROM oran_slice_kpis sk
    WHERE sk.timestamp >= NOW() - INTERVAL '1 hour'
    GROUP BY sk.slice_id, sk.s_nssai, sk.slice_type
),
slice_trends AS (
    SELECT 
        slice_id,
        AVG(CASE WHEN timestamp >= NOW() - INTERVAL '1 hour' THEN throughput_dl_mbps END) AS current_hour_throughput,
        AVG(CASE WHEN timestamp >= NOW() - INTERVAL '2 hours' AND timestamp < NOW() - INTERVAL '1 hour' 
                 THEN throughput_dl_mbps END) AS previous_hour_throughput,
        AVG(CASE WHEN timestamp >= NOW() - INTERVAL '24 hours' THEN latency_ms END) AS avg_24h_latency
    FROM oran_slice_kpis
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
    GROUP BY slice_id
)
SELECT 
    sp.slice_id,
    sp.s_nssai,
    sp.slice_type,
    sp.active_cells,
    sp.avg_throughput_dl,
    sp.avg_throughput_ul,
    sp.avg_latency,
    sp.max_latency,
    sp.avg_packet_loss * 100 AS packet_loss_percent,
    sp.avg_availability,
    sp.total_active_users,
    sp.peak_users_across_cells,
    sp.latency_sla_compliance,
    sp.availability_sla_compliance,
    st.avg_24h_latency,
    CASE 
        WHEN st.previous_hour_throughput > 0 
        THEN ((st.current_hour_throughput - st.previous_hour_throughput) / st.previous_hour_throughput) * 100
        ELSE 0
    END AS throughput_trend_percent,
    CASE 
        WHEN sp.latency_sla_compliance >= 95 AND sp.availability_sla_compliance >= 95 THEN 'GOOD'
        WHEN sp.latency_sla_compliance >= 85 AND sp.availability_sla_compliance >= 90 THEN 'WARNING'
        ELSE 'CRITICAL'
    END AS slice_health_status
FROM slice_performance sp
LEFT JOIN slice_trends st ON sp.slice_id = st.slice_id
ORDER BY sp.slice_type, sp.avg_availability DESC;

-- =============================================================================
-- 5. EFFICIENT BULK INSERT PATTERNS - Avoiding individual INSERTs
-- =============================================================================

-- BAD: Individual INSERT statements (N+1 write pattern)
/*
INSERT INTO oran_pm_data (...) VALUES (...);  -- Repeated N times
*/

-- GOOD: Use COPY or bulk INSERT with VALUES
-- Prepare statement for bulk PM data insertion
PREPARE bulk_pm_insert AS
INSERT INTO oran_pm_data (
    timestamp, cell_id, metric_type, prb_used_dl, prb_used_ul,
    prb_available_dl, prb_available_ul, mac_volume_dl_bytes, mac_volume_ul_bytes,
    throughput_dl_mbps, throughput_ul_mbps, prb_utilization_dl, prb_utilization_ul,
    cqi_avg, rsrp_avg, power_consumption_watts, source_system
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
ON CONFLICT (timestamp, cell_id, metric_type) 
DO UPDATE SET
    prb_used_dl = EXCLUDED.prb_used_dl,
    prb_used_ul = EXCLUDED.prb_used_ul,
    mac_volume_dl_bytes = EXCLUDED.mac_volume_dl_bytes,
    mac_volume_ul_bytes = EXCLUDED.mac_volume_ul_bytes,
    throughput_dl_mbps = EXCLUDED.throughput_dl_mbps,
    throughput_ul_mbps = EXCLUDED.throughput_ul_mbps,
    prb_utilization_dl = EXCLUDED.prb_utilization_dl,
    prb_utilization_ul = EXCLUDED.prb_utilization_ul,
    cqi_avg = EXCLUDED.cqi_avg,
    rsrp_avg = EXCLUDED.rsrp_avg,
    power_consumption_watts = EXCLUDED.power_consumption_watts;

-- =============================================================================
-- 6. OPTIMIZED ANALYTICAL QUERIES - Using CTEs and Window Functions
-- =============================================================================

-- Cell ranking with percentiles (avoiding N subqueries)
WITH cell_metrics AS (
    SELECT 
        cell_id,
        AVG(prb_utilization_dl) AS avg_prb_util,
        AVG(throughput_dl_mbps) AS avg_throughput,
        AVG(spectral_efficiency_dl) AS avg_spectral_eff,
        STDDEV(prb_utilization_dl) AS prb_util_stddev,
        COUNT(*) AS sample_count
    FROM oran_pm_data
    WHERE timestamp >= NOW() - INTERVAL '24 hours'
        AND prb_utilization_dl IS NOT NULL
        AND throughput_dl_mbps IS NOT NULL
    GROUP BY cell_id
),
cell_rankings AS (
    SELECT 
        cm.*,
        PERCENT_RANK() OVER (ORDER BY avg_prb_util) AS prb_util_percentile,
        PERCENT_RANK() OVER (ORDER BY avg_throughput DESC) AS throughput_percentile,
        PERCENT_RANK() OVER (ORDER BY avg_spectral_eff DESC) AS spectral_eff_percentile,
        NTILE(10) OVER (ORDER BY avg_prb_util) AS prb_util_decile,
        NTILE(10) OVER (ORDER BY avg_throughput DESC) AS throughput_decile
    FROM cell_metrics cm
    WHERE cm.sample_count >= 24  -- At least 24 hours of data
)
SELECT 
    c.cell_id,
    c.cell_name,
    c.global_cell_id,
    c.vendor,
    cr.avg_prb_util,
    cr.avg_throughput,
    cr.avg_spectral_eff,
    cr.prb_util_percentile,
    cr.throughput_percentile,
    cr.spectral_eff_percentile,
    cr.prb_util_decile,
    cr.throughput_decile,
    CASE 
        WHEN cr.throughput_percentile >= 0.9 AND cr.prb_util_percentile <= 0.5 THEN 'EXCELLENT'
        WHEN cr.throughput_percentile >= 0.7 AND cr.prb_util_percentile <= 0.7 THEN 'GOOD'
        WHEN cr.throughput_percentile >= 0.5 AND cr.prb_util_percentile <= 0.8 THEN 'AVERAGE'
        ELSE 'NEEDS_ATTENTION'
    END AS performance_category
FROM oran_cells c
JOIN cell_rankings cr ON c.cell_id = cr.cell_id
WHERE c.deployment_status = 'active'
ORDER BY cr.throughput_percentile DESC, cr.prb_util_percentile;

-- =============================================================================
-- 7. OPTIMIZED PAGINATION - Using offset-free pagination
-- =============================================================================

-- BAD: Traditional OFFSET pagination (slow for large datasets)
-- SELECT * FROM oran_pm_data ORDER BY timestamp DESC OFFSET 10000 LIMIT 100;

-- GOOD: Cursor-based pagination using timestamp
CREATE OR REPLACE FUNCTION get_pm_data_page(
    p_cursor TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_cell_id UUID DEFAULT NULL
) RETURNS TABLE (
    timestamp TIMESTAMP WITH TIME ZONE,
    cell_id UUID,
    prb_utilization_dl DECIMAL,
    throughput_dl_mbps DECIMAL,
    cqi_avg DECIMAL,
    next_cursor TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.timestamp,
        pm.cell_id,
        pm.prb_utilization_dl,
        pm.throughput_dl_mbps,
        pm.cqi_avg,
        pm.timestamp AS next_cursor
    FROM oran_pm_data pm
    WHERE (p_cursor IS NULL OR pm.timestamp < p_cursor)
        AND (p_cell_id IS NULL OR pm.cell_id = p_cell_id)
        AND pm.prb_utilization_dl IS NOT NULL
    ORDER BY pm.timestamp DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 8. QUERY PERFORMANCE MONITORING
-- =============================================================================

-- Monitor slow queries specific to O-RAN workloads
SELECT 
    query,
    calls,
    total_time / 1000.0 AS total_seconds,
    mean_time / 1000.0 AS avg_seconds,
    (100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0)) AS cache_hit_ratio,
    rows / calls AS avg_rows_per_call
FROM pg_stat_statements
WHERE query LIKE '%oran_%' 
    OR query LIKE '%pm_data%' 
    OR query LIKE '%fault_events%'
ORDER BY total_time DESC
LIMIT 20;

-- Index usage analysis for O-RAN tables
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs,
    histogram_bounds
FROM pg_stats
WHERE tablename IN ('oran_pm_data', 'oran_fault_events', 'oran_cells', 'oran_slice_kpis')
ORDER BY tablename, attname;

-- Table bloat detection
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
    n_live_tup,
    n_dead_tup,
    CASE WHEN n_live_tup > 0 
         THEN ROUND((n_dead_tup::FLOAT / n_live_tup::FLOAT) * 100, 2)
         ELSE 0 
    END AS dead_tuple_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
    AND tablename LIKE 'oran_%'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Performance summary for O-RAN queries
CREATE OR REPLACE VIEW oran_query_performance AS
SELECT 
    'PM Data Queries' as query_type,
    COUNT(*) as query_count,
    SUM(calls) as total_calls,
    AVG(mean_time) as avg_execution_time_ms,
    SUM(total_time) as total_execution_time_ms
FROM pg_stat_statements
WHERE query LIKE '%oran_pm_data%'
UNION ALL
SELECT 
    'Fault Queries' as query_type,
    COUNT(*) as query_count,
    SUM(calls) as total_calls,
    AVG(mean_time) as avg_execution_time_ms,
    SUM(total_time) as total_execution_time_ms
FROM pg_stat_statements
WHERE query LIKE '%oran_fault_events%'
UNION ALL
SELECT 
    'Cell Config Queries' as query_type,
    COUNT(*) as query_count,
    SUM(calls) as total_calls,
    AVG(mean_time) as avg_execution_time_ms,
    SUM(total_time) as total_execution_time_ms
FROM pg_stat_statements
WHERE query LIKE '%oran_cells%';