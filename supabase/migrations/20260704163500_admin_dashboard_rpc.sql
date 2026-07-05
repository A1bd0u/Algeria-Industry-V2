CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    total_users INT;
    approved_companies INT;
    active_products INT;
    published_tenders INT;
    total_revenue NUMERIC;
    registrations JSON;
    revenue_chart JSON;
BEGIN
    SELECT COUNT(*) INTO total_users FROM public.users;
    SELECT COUNT(*) INTO approved_companies FROM public.companies WHERE status = 'approved';
    SELECT COUNT(*) INTO active_products FROM public.products WHERE status = 'active';
    SELECT COUNT(*) INTO published_tenders FROM public.tenders WHERE status = 'published';
    
    -- handle transactions possibly missing or no completed transactions
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue FROM public.transactions WHERE status = 'completed';

    -- Registrations last 30 days
    SELECT json_agg(row_to_json(t)) INTO registrations FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            COUNT(*) as count
        FROM public.users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    -- Revenue last 30 days
    SELECT json_agg(row_to_json(t)) INTO revenue_chart FROM (
        SELECT 
            TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') as date, 
            SUM(amount) as revenue
        FROM public.transactions 
        WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'completed'
        GROUP BY date_trunc('day', created_at)
        ORDER BY date_trunc('day', created_at)
    ) t;

    RETURN json_build_object(
        'kpis', json_build_object(
            'total_users', total_users,
            'approved_companies', approved_companies,
            'active_products', active_products,
            'published_tenders', published_tenders,
            'total_revenue', total_revenue
        ),
        'charts', json_build_object(
            'registrations', COALESCE(registrations, '[]'::json),
            'revenue', COALESCE(revenue_chart, '[]'::json)
        )
    );
END;
$$ LANGUAGE plpgsql;
