-- O-RAN Telemetry Database Schema Optimization
-- PostgreSQL with TimescaleDB extensions
-- Optimized for high-throughput telemetry data ingestion and analytical queries

-- Create TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gin;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Set optimal PostgreSQL configuration parameters
ALTER SYSTEM SET shared_buffers = '2GB';
ALTER SYSTEM SET effective_cache_size = '6GB';
ALTER SYSTEM SET maintenance_work_mem = '512MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '32MB';
ALTER SYSTEM SET default_statistics_target = 500;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET work_mem = '128MB';
ALTER SYSTEM SET min_wal_size = '2GB';
ALTER SYSTEM SET max_wal_size = '8GB';

-- O-RAN Cell configuration table
CREATE TABLE IF NOT EXISTS oran_cells (
    cell_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    global_cell_id BIGINT NOT NULL UNIQUE,
    cell_name VARCHAR(64) NOT NULL,
    enb_id INTEGER NOT NULL,
    sector_id INTEGER NOT NULL,
    plmn_id VARCHAR(6) NOT NULL,
    tac INTEGER NOT NULL,
    earfcn INTEGER NOT NULL,
    pci INTEGER NOT NULL,
    bandwidth_mhz INTEGER NOT NULL,
    max_transmission_power DECIMAL(5,2),
    antenna_azimuth DECIMAL(5,2),
    antenna_tilt DECIMAL(4,2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    coverage_radius_km DECIMAL(5,2),
    cell_type VARCHAR(20) CHECK (cell_type IN ('macro', 'micro', 'pico', 'femto')),
    vendor VARCHAR(32),
    software_version VARCHAR(32),
    deployment_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optimized indexes for cell lookup
CREATE INDEX IF NOT EXISTS idx_oran_cells_global_id ON oran_cells (global_cell_id);
CREATE INDEX IF NOT EXISTS idx_oran_cells_enb_sector ON oran_cells (enb_id, sector_id);
CREATE INDEX IF NOT EXISTS idx_oran_cells_location ON oran_cells (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_oran_cells_vendor_status ON oran_cells (vendor, deployment_status);
CREATE INDEX IF NOT EXISTS idx_oran_cells_pci ON oran_cells (pci);

-- Performance Measurement (PM) data table - main telemetry table
CREATE TABLE IF NOT EXISTS oran_pm_data (
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cell_id UUID NOT NULL REFERENCES oran_cells(cell_id),
    metric_type VARCHAR(64) NOT NULL,
    
    -- Radio metrics
    prb_used_dl INTEGER,
    prb_used_ul INTEGER,
    prb_available_dl INTEGER DEFAULT 100,
    prb_available_ul INTEGER DEFAULT 100,
    
    -- Throughput metrics (bytes)
    mac_volume_dl_bytes BIGINT,
    mac_volume_ul_bytes BIGINT,
    pdcp_volume_dl_bytes BIGINT,
    pdcp_volume_ul_bytes BIGINT,
    
    -- Connection metrics
    rrc_conn_estab_att INTEGER,
    rrc_conn_estab_succ INTEGER,
    rrc_conn_setup_time_ms DECIMAL(8,3),
    
    -- Handover metrics
    ho_prep_out_att INTEGER,
    ho_prep_out_succ INTEGER,
    ho_exec_out_att INTEGER,
    ho_exec_out_succ INTEGER,
    
    -- Quality metrics
    cqi_avg DECIMAL(4,2),
    rsrp_avg DECIMAL(6,2),
    rsrq_avg DECIMAL(5,2),
    sinr_avg DECIMAL(5,2),
    
    -- Energy metrics
    power_consumption_watts DECIMAL(8,2),
    temperature_celsius DECIMAL(4,1),
    
    -- Derived KPIs (calculated by application)
    prb_utilization_dl DECIMAL(5,2),
    prb_utilization_ul DECIMAL(5,2),
    throughput_dl_mbps DECIMAL(10,3),
    throughput_ul_mbps DECIMAL(10,3),
    spectral_efficiency_dl DECIMAL(6,3),
    energy_efficiency DECIMAL(8,3),
    
    -- Metadata
    measurement_period_sec INTEGER DEFAULT 900, -- 15 minutes
    data_reliability DECIMAL(3,2) DEFAULT 1.0,
    source_system VARCHAR(32),
    
    PRIMARY KEY (timestamp, cell_id, metric_type)
);

-- Convert to TimescaleDB hypertable for time-series optimization
SELECT create_hypertable('oran_pm_data', 'timestamp', 
    chunk_time_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Partitioning by cell_id for better parallelization
SELECT add_dimension('oran_pm_data', 'cell_id', number_partitions => 16, if_not_exists => TRUE);

-- Optimized indexes for PM data
CREATE INDEX IF NOT EXISTS idx_pm_timestamp_cell ON oran_pm_data (timestamp DESC, cell_id);
CREATE INDEX IF NOT EXISTS idx_pm_cell_timestamp ON oran_pm_data (cell_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_pm_metric_type ON oran_pm_data (metric_type, timestamp DESC);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pm_throughput_lookup ON oran_pm_data (cell_id, timestamp DESC) 
    WHERE throughput_dl_mbps IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pm_utilization_lookup ON oran_pm_data (cell_id, timestamp DESC) 
    WHERE prb_utilization_dl IS NOT NULL;

-- GIN index for flexible JSON queries (if needed for extensions)
CREATE INDEX IF NOT EXISTS idx_pm_gin_search ON oran_pm_data USING GIN (
    (COALESCE(metric_type, '') || ' ' || COALESCE(source_system, ''))
);

-- VES (Virtualized Event Streaming) fault data
CREATE TABLE IF NOT EXISTS oran_fault_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cell_id UUID REFERENCES oran_cells(cell_id),
    event_name VARCHAR(128) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) CHECK (severity IN ('critical', 'major', 'minor', 'warning', 'cleared')),
    
    -- Fault details
    alarm_id VARCHAR(64),
    probable_cause VARCHAR(256),
    additional_info JSONB,
    
    -- Source information
    reporting_entity_name VARCHAR(64),
    reporting_entity_id VARCHAR(64),
    source_id VARCHAR(64),
    
    -- Status
    fault_fields JSONB,
    sequence_number BIGINT,
    priority VARCHAR(16),
    
    -- Lifecycle
    start_epoch_microsec BIGINT,
    last_epoch_microsec BIGINT,
    cleared_at TIMESTAMP WITH TIME ZONE,
    ack_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (timestamp, event_id)
);

-- Convert fault events to hypertable
SELECT create_hypertable('oran_fault_events', 'timestamp',
    chunk_time_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- Indexes for fault events
CREATE INDEX IF NOT EXISTS idx_fault_cell_severity ON oran_fault_events (cell_id, severity, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fault_event_type ON oran_fault_events (event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_fault_alarm_id ON oran_fault_events (alarm_id) WHERE alarm_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fault_source ON oran_fault_events (reporting_entity_name, timestamp DESC);

-- GIN index for JSONB fault fields
CREATE INDEX IF NOT EXISTS idx_fault_additional_info ON oran_fault_events USING GIN (additional_info);
CREATE INDEX IF NOT EXISTS idx_fault_fields ON oran_fault_events USING GIN (fault_fields);

-- KPI aggregation table for faster dashboard queries
CREATE TABLE IF NOT EXISTS oran_kpi_hourly (
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    cell_id UUID NOT NULL REFERENCES oran_cells(cell_id),
    
    -- Aggregated metrics
    avg_prb_utilization_dl DECIMAL(5,2),
    avg_prb_utilization_ul DECIMAL(5,2),
    max_prb_utilization_dl DECIMAL(5,2),
    max_prb_utilization_ul DECIMAL(5,2),
    
    avg_throughput_dl_mbps DECIMAL(10,3),
    avg_throughput_ul_mbps DECIMAL(10,3),
    max_throughput_dl_mbps DECIMAL(10,3),
    max_throughput_ul_mbps DECIMAL(10,3),
    
    total_volume_dl_gb DECIMAL(12,3),
    total_volume_ul_gb DECIMAL(12,3),
    
    avg_spectral_efficiency DECIMAL(6,3),
    avg_energy_efficiency DECIMAL(8,3),
    
    avg_cqi DECIMAL(4,2),
    avg_rsrp DECIMAL(6,2),
    avg_rsrq DECIMAL(5,2),
    
    total_rrc_attempts INTEGER,
    total_rrc_successes INTEGER,
    success_rate_percent DECIMAL(5,2),
    
    total_handovers INTEGER,
    handover_success_rate DECIMAL(5,2),
    
    fault_count INTEGER DEFAULT 0,
    critical_fault_count INTEGER DEFAULT 0,
    
    -- Metadata
    measurement_count INTEGER,
    data_quality_score DECIMAL(3,2) DEFAULT 1.0,
    
    PRIMARY KEY (timestamp, cell_id)
);

-- KPI hypertable with 1-day chunks for long-term storage
SELECT create_hypertable('oran_kpi_hourly', 'timestamp',
    chunk_time_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

-- Indexes for KPI aggregations
CREATE INDEX IF NOT EXISTS idx_kpi_hourly_cell_time ON oran_kpi_hourly (cell_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_hourly_utilization ON oran_kpi_hourly (avg_prb_utilization_dl DESC, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_hourly_throughput ON oran_kpi_hourly (avg_throughput_dl_mbps DESC, timestamp DESC);

-- Network slice performance table
CREATE TABLE IF NOT EXISTS oran_slice_kpis (
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    slice_id UUID NOT NULL,
    cell_id UUID NOT NULL REFERENCES oran_cells(cell_id),
    
    -- Slice identifiers
    s_nssai VARCHAR(16) NOT NULL, -- Single Network Slice Selection Assistance Information
    slice_type VARCHAR(32) NOT NULL, -- eMBB, URLLC, mMTC
    tenant_id UUID,
    
    -- Performance metrics per slice
    allocated_prb_dl INTEGER,
    allocated_prb_ul INTEGER,
    used_prb_dl INTEGER,
    used_prb_ul INTEGER,
    
    throughput_dl_mbps DECIMAL(10,3),
    throughput_ul_mbps DECIMAL(10,3),
    
    latency_ms DECIMAL(6,3),
    packet_loss_rate DECIMAL(5,4),
    jitter_ms DECIMAL(6,3),
    
    -- SLA metrics
    availability_percent DECIMAL(5,2),
    reliability_percent DECIMAL(5,2),
    
    active_users INTEGER DEFAULT 0,
    peak_users INTEGER DEFAULT 0,
    
    PRIMARY KEY (timestamp, slice_id, cell_id)
);

SELECT create_hypertable('oran_slice_kpis', 'timestamp',
    chunk_time_interval => INTERVAL '2 hours',
    if_not_exists => TRUE
);

-- Slice KPI indexes
CREATE INDEX IF NOT EXISTS idx_slice_kpi_type_time ON oran_slice_kpis (slice_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_slice_kpi_sla ON oran_slice_kpis (s_nssai, availability_percent DESC);

-- Continuous aggregates for real-time dashboards
CREATE MATERIALIZED VIEW IF NOT EXISTS oran_pm_5min_agg AS
SELECT 
    time_bucket('5 minutes', timestamp) AS bucket,
    cell_id,
    AVG(prb_utilization_dl) AS avg_prb_util_dl,
    AVG(prb_utilization_ul) AS avg_prb_util_ul,
    AVG(throughput_dl_mbps) AS avg_throughput_dl,
    AVG(throughput_ul_mbps) AS avg_throughput_ul,
    MAX(throughput_dl_mbps) AS max_throughput_dl,
    AVG(cqi_avg) AS avg_cqi,
    AVG(rsrp_avg) AS avg_rsrp,
    COUNT(*) AS measurement_count
FROM oran_pm_data
GROUP BY bucket, cell_id;

SELECT add_continuous_aggregate_policy('oran_pm_5min_agg',
    start_offset => INTERVAL '1 hour',
    end_offset => INTERVAL '5 minutes',
    schedule_interval => INTERVAL '5 minutes',
    if_not_exists => TRUE
);

-- Retention policies for data lifecycle management
SELECT add_retention_policy('oran_pm_data', INTERVAL '90 days', if_not_exists => TRUE);
SELECT add_retention_policy('oran_fault_events', INTERVAL '180 days', if_not_exists => TRUE);
SELECT add_retention_policy('oran_kpi_hourly', INTERVAL '2 years', if_not_exists => TRUE);
SELECT add_retention_policy('oran_slice_kpis', INTERVAL '1 year', if_not_exists => TRUE);

-- Compression policies for older data
SELECT add_compression_policy('oran_pm_data', INTERVAL '7 days', if_not_exists => TRUE);
SELECT add_compression_policy('oran_fault_events', INTERVAL '3 days', if_not_exists => TRUE);
SELECT add_compression_policy('oran_kpi_hourly', INTERVAL '30 days', if_not_exists => TRUE);

-- Create user roles with appropriate permissions
CREATE ROLE oran_read_only;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO oran_read_only;

CREATE ROLE oran_analyst;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO oran_analyst;
GRANT INSERT ON oran_pm_data, oran_fault_events TO oran_analyst;

CREATE ROLE oran_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO oran_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO oran_admin;

-- Performance monitoring views
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

CREATE OR REPLACE VIEW table_stats AS
SELECT 
    schemaname,
    tablename,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Index usage statistics
CREATE OR REPLACE VIEW index_usage AS
SELECT 
    t.tablename,
    indexname,
    c.reltuples AS num_rows,
    pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.tablename))) AS table_size,
    pg_size_pretty(pg_relation_size(quote_ident(t.schemaname)||'.'||quote_ident(t.indexrelname))) AS index_size,
    CASE WHEN indisunique THEN 'Y' ELSE 'N' END AS unique,
    idx_scan AS number_of_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_tables t
LEFT OUTER JOIN pg_class c ON c.relname=t.tablename
LEFT OUTER JOIN
    ( SELECT c.relname AS ctablename, ipg.relname AS indexname, x.indnatts AS number_of_columns, 
             idx_scan, idx_tup_read, idx_tup_fetch, indexrelname, indisunique
      FROM pg_index x
      JOIN pg_class c ON c.oid = x.indrelid
      JOIN pg_class ipg ON ipg.oid = x.indexrelid
      JOIN pg_stat_user_indexes psui ON x.indexrelid = psui.indexrelid )
    AS foo ON t.tablename = foo.ctablename
WHERE t.schemaname='public'
ORDER BY 1,2;

-- Sample analytical functions for common O-RAN queries
CREATE OR REPLACE FUNCTION get_cell_kpis(
    p_cell_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS TABLE (
    timestamp TIMESTAMP WITH TIME ZONE,
    avg_prb_utilization DECIMAL,
    avg_throughput DECIMAL,
    peak_throughput DECIMAL,
    spectral_efficiency DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        time_bucket('1 hour', pm.timestamp) AS timestamp,
        AVG(pm.prb_utilization_dl) AS avg_prb_utilization,
        AVG(pm.throughput_dl_mbps) AS avg_throughput,
        MAX(pm.throughput_dl_mbps) AS peak_throughput,
        AVG(pm.spectral_efficiency_dl) AS spectral_efficiency
    FROM oran_pm_data pm
    WHERE pm.cell_id = p_cell_id 
        AND pm.timestamp >= p_start_time 
        AND pm.timestamp <= p_end_time
        AND pm.throughput_dl_mbps IS NOT NULL
    GROUP BY time_bucket('1 hour', pm.timestamp)
    ORDER BY timestamp;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE oran_cells IS 'O-RAN cell configuration and metadata';
COMMENT ON TABLE oran_pm_data IS 'O-RAN performance measurement telemetry data';
COMMENT ON TABLE oran_fault_events IS 'O-RAN VES fault events and alarms';
COMMENT ON TABLE oran_kpi_hourly IS 'Hourly aggregated KPIs for dashboard performance';
COMMENT ON TABLE oran_slice_kpis IS 'Network slice specific performance metrics';