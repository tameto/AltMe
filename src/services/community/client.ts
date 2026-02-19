import { supabase } from '@/src/services/supabase/client';

export type Community = {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  language: string;
  category: string;
  thumbnailUrl: string | null;
  memberCount: number;
  isActive: boolean;
  createdAt: string;
};

type CommunityMessage = {
  id: string;
  communityId: string;
  agentUserId: string;
  content: string;
  isAutonomous: boolean;
  createdAt: string;
};

type CreateCommunityInput = {
  name: string;
  description: string;
  language: string;
  category: string;
};

type CommunityRow = {
  id: string;
  creator_id: string;
  name: string;
  description: string | null;
  language: string;
  category: string;
  thumbnail_url: string | null;
  member_count: number;
  is_active: boolean;
  created_at: string;
};

type CommunityMessageRow = {
  id: string;
  community_id: string;
  agent_user_id: string;
  content: string;
  is_autonomous: boolean;
  created_at: string;
};

function mapCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    description: row.description,
    language: row.language,
    category: row.category,
    thumbnailUrl: row.thumbnail_url,
    memberCount: row.member_count,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function mapMessage(row: CommunityMessageRow): CommunityMessage {
  return {
    id: row.id,
    communityId: row.community_id,
    agentUserId: row.agent_user_id,
    content: row.content,
    isAutonomous: row.is_autonomous,
    createdAt: row.created_at,
  };
}

export async function listCommunities(): Promise<Community[]> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return (data as CommunityRow[]).map(mapCommunity);
}

export async function createCommunity(input: CreateCommunityInput): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: input.name,
      description: input.description,
      language: input.language,
      category: input.category,
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return mapCommunity(data as CommunityRow);
}

export async function joinCommunity(communityId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return false;

  const { error } = await supabase.from('community_members').insert({
    community_id: communityId,
    user_id: user.id,
  });

  return !error;
}

export async function leaveCommunity(communityId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return false;

  const { error } = await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('user_id', user.id);

  return !error;
}

export async function getCommunityMessages(
  communityId: string,
  limit = 100,
): Promise<CommunityMessage[]> {
  const { data, error } = await supabase
    .from('community_messages')
    .select('*')
    .eq('community_id', communityId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as CommunityMessageRow[]).map(mapMessage);
}
