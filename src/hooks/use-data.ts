import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

// ============ Children ============
export function useChildren() {
  const { user, activeRole } = useAuth();
  const effectiveRole = user?.roles && user.roles.length > 1 ? activeRole : user?.role;
  return useQuery({
    queryKey: ['children', user?.id, effectiveRole],
    queryFn: async () => {
      if (effectiveRole === 'parent') {
        // Get own children
        const { data: ownChildren, error: ownErr } = await supabase
          .from('children')
          .select('*')
          .eq('parent_id', user!.id)
          .order('created_at');
        if (ownErr) throw ownErr;

        // Get children where user is a viewer
        const { data: viewerRecords } = await supabase
          .from('child_viewers')
          .select('child_id')
          .eq('viewer_user_id', user!.id);
        
        let viewerChildren: any[] = [];
        if (viewerRecords && viewerRecords.length > 0) {
          const viewerChildIds = viewerRecords.map(v => v.child_id);
          const { data: vChildren } = await supabase
            .from('children')
            .select('*')
            .in('id', viewerChildIds)
            .order('created_at');
          viewerChildren = vChildren || [];
        }

        // Merge and deduplicate
        const allChildren = [...(ownChildren || [])];
        for (const vc of viewerChildren) {
          if (!allChildren.find(c => c.id === vc.id)) {
            allChildren.push(vc);
          }
        }
        return allChildren;
      }

      // For other roles, use default query
      const { data, error } = await supabase.from('children').select('*').order('created_at');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (child: { name: string; dob?: string; notes?: string; avatar_emoji?: string; parent_id: string }) => {
      const { data, error } = await supabase.from('children').insert(child).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

// ============ Assignments ============
export function useAssignments(childId?: string) {
  return useQuery({
    queryKey: ['assignments', childId],
    queryFn: async () => {
      let query = supabase.from('assignments').select('*');
      if (childId) query = query.eq('child_id', childId);
      const { data, error } = await query;
      if (error) throw error;
      if (!data || data.length === 0) return [];
      const userIds = [...new Set(data.map(a => a.babysitter_user_id))];
      const { data: profiles } = await supabase.from('profiles').select('id, name, email, avatar_url').in('id', userIds);
      const profileMap: Record<string, any> = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
      return data.map(a => ({ ...a, profiles: profileMap[a.babysitter_user_id] || null }));
    },
    enabled: !!childId,
  });
}

// ============ Daily Logs ============
export function useDailyLog(childId: string, date: string) {
  return useQuery({
    queryKey: ['daily_log', childId, date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('child_id', childId)
        .eq('log_date', date)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!childId && !!date,
  });
}

export function useCreateOrGetDailyLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ child_id, log_date, notes, created_by }: { child_id: string; log_date: string; notes?: string; created_by?: string }) => {
      // Try to get existing
      const { data: existing } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('child_id', child_id)
        .eq('log_date', log_date)
        .maybeSingle();
      
      if (existing) {
        if (notes !== undefined) {
          const { data, error } = await supabase
            .from('daily_logs')
            .update({ notes })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) throw error;
          return data;
        }
        return existing;
      }
      
      const { data, error } = await supabase
        .from('daily_logs')
        .insert({ child_id, log_date, notes: notes || '', created_by })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ['daily_log', vars.child_id, vars.log_date] }),
  });
}

// ============ Events ============
export function useEvents(dailyLogId?: string) {
  return useQuery({
    queryKey: ['events', dailyLogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('daily_log_id', dailyLogId!)
        .order('time');
      if (error) throw error;
      return data;
    },
    enabled: !!dailyLogId,
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (event: { daily_log_id: string; time: string; type: string; detail?: string; amount?: number; unit?: string; status?: string; photo_url?: string; photo_url_after?: string; created_by?: string }) => {
      const { data, error } = await supabase.from('events').insert(event as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['events', data.daily_log_id] }),
  });
}

export function useUpdateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, daily_log_id, ...updates }: { id: string; daily_log_id: string; detail?: string; amount?: number | null; unit?: string | null; status?: string | null; photo_url?: string | null; photo_url_after?: string | null }) => {
      const { error } = await supabase.from('events').update(updates as any).eq('id', id);
      if (error) throw error;
      return daily_log_id;
    },
    onSuccess: (daily_log_id) => qc.invalidateQueries({ queryKey: ['events', daily_log_id] }),
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, daily_log_id }: { id: string; daily_log_id: string }) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
      return daily_log_id;
    },
    onSuccess: (daily_log_id) => qc.invalidateQueries({ queryKey: ['events', daily_log_id] }),
  });
}

// ============ Dashboard helpers ============
export function useChildLogs(childId: string, dates: string[]) {
  return useQuery({
    queryKey: ['child_logs', childId, dates],
    queryFn: async () => {
      const { data: logs, error: logsError } = await supabase
        .from('daily_logs')
        .select('*')
        .eq('child_id', childId)
        .in('log_date', dates);
      if (logsError) throw logsError;
      if (!logs || logs.length === 0) return [];

      const logIds = logs.map(l => l.id);
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .in('daily_log_id', logIds)
        .order('time');
      if (eventsError) throw eventsError;

      return logs.map(log => ({
        ...log,
        events: (events || []).filter(e => e.daily_log_id === log.id),
      }));
    },
    enabled: !!childId && dates.length > 0,
  });
}

// ============ User role ============
export function useUserRole(userId?: string) {
  return useQuery({
    queryKey: ['user_role', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId!)
        .single();
      if (error) throw error;
      return data?.role;
    },
    enabled: !!userId,
  });
}

// ============ Profile names for event creators ============
export function useProfileNames(userIds: string[]) {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  return useQuery({
    queryKey: ['profile_names', uniqueIds.sort().join(',')],
    queryFn: async () => {
      if (uniqueIds.length === 0) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', uniqueIds);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach(p => { map[p.id] = p.name; });
      return map;
    },
    enabled: uniqueIds.length > 0,
  });
}
