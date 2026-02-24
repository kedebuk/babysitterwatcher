import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await userClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check caller is admin
    const { data: adminRole } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'admin').single();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Prevent self-deletion
    if (user_id === caller.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get children owned by this user
    const { data: children } = await adminClient.from('children').select('id').eq('parent_id', user_id);
    const childIds = (children || []).map((c: any) => c.id);

    if (childIds.length > 0) {
      // Delete events via daily_logs
      const { data: logs } = await adminClient.from('daily_logs').select('id').in('child_id', childIds);
      const logIds = (logs || []).map((l: any) => l.id);
      if (logIds.length > 0) {
        await adminClient.from('events').delete().in('daily_log_id', logIds);
      }
      await adminClient.from('daily_logs').delete().in('child_id', childIds);
      await adminClient.from('assignments').delete().in('child_id', childIds);
      await adminClient.from('child_viewers').delete().in('child_id', childIds);
      await adminClient.from('pending_invites').delete().in('child_id', childIds);
      await adminClient.from('inventory_usage').delete().in('child_id', childIds);
      await adminClient.from('inventory_item_shares').delete().in('child_id', childIds);
      await adminClient.from('inventory_items').delete().in('child_id', childIds);
      await adminClient.from('location_pings').delete().in('child_id', childIds);
      await adminClient.from('messages').delete().in('child_id', childIds);
    }

    // Delete user's own data
    await adminClient.from('children').delete().eq('parent_id', user_id);
    await adminClient.from('children_profiles').delete().eq('user_id', user_id);
    await adminClient.from('subscriptions').delete().eq('user_id', user_id);
    await adminClient.from('notifications').delete().eq('user_id', user_id);
    await adminClient.from('activity_logs').delete().eq('user_id', user_id);
    await adminClient.from('user_roles').delete().eq('user_id', user_id);

    // Delete assignments where user is babysitter
    await adminClient.from('assignments').delete().eq('babysitter_user_id', user_id);
    // Delete viewer records
    await adminClient.from('child_viewers').delete().eq('viewer_user_id', user_id);

    // Delete profile
    await adminClient.from('profiles').delete().eq('id', user_id);

    // Delete auth user
    const { error: authError } = await adminClient.auth.admin.deleteUser(user_id);
    if (authError) {
      console.error('Auth delete error:', authError);
      return new Response(JSON.stringify({ error: authError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('Delete user error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
