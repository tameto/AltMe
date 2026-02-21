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
  conversationCount: number;
  isActive: boolean;
  createdAt: string;
};

export type CommunityMessage = {
  id: string;
  communityId: string;
  agentUserId: string;
  content: string;
  isAutonomous: boolean;
  twinName: string | null;
  avatarIcon: string | null;
  createdAt: string;
};

export type CommunityMember = {
  id: string;
  userId: string;
  communityId: string;
  twinName: string | null;
  avatarIcon: string | null;
  joinedAt: string;
};

type CreateCommunityInput = {
  name: string;
  description: string;
  language: string;
  category: string;
  thumbnailUrl?: string;
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
  conversation_count: number;
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
  twin_name: string | null;
  avatar_icon: string | null;
};

type CommunityMemberRow = {
  id: string;
  user_id: string;
  community_id: string;
  joined_at: string;
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
    conversationCount: row.conversation_count ?? 0,
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
    twinName: row.twin_name ?? null,
    avatarIcon: row.avatar_icon ?? null,
    createdAt: row.created_at,
  };
}

function mapMember(row: CommunityMemberRow): CommunityMember {
  return {
    id: row.id,
    userId: row.user_id,
    communityId: row.community_id,
    twinName: null,
    avatarIcon: null,
    joinedAt: row.joined_at,
  };
}

export async function listCommunities(language?: string): Promise<Community[]> {
  let query = supabase
    .from('communities')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50);

  if (language !== undefined) {
    query = query.eq('language', language);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  return (data as CommunityRow[]).map(mapCommunity);
}

export async function getCommunity(communityId: string): Promise<Community | null> {
  const { data, error } = await supabase
    .from('communities')
    .select('*')
    .eq('id', communityId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapCommunity(data as CommunityRow);
}

export async function getCommunityMembers(communityId: string): Promise<CommunityMember[]> {
  const { data, error } = await supabase
    .from('community_members')
    .select('id, user_id, community_id, joined_at')
    .eq('community_id', communityId);

  if (error || !data) {
    return [];
  }

  return (data as unknown as CommunityMemberRow[]).map(mapMember);
}

export async function checkMembership(communityId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return false;

  const { data, error } = await supabase
    .from('community_members')
    .select('id')
    .eq('community_id', communityId)
    .eq('user_id', user.id)
    .maybeSingle();

  return !error && data !== null;
}

export async function createCommunity(input: CreateCommunityInput): Promise<Community | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) return null;

  const { data, error } = await supabase
    .from('communities')
    .insert({
      name: input.name,
      description: input.description,
      language: input.language,
      category: input.category,
      thumbnail_url: input.thumbnailUrl ?? null,
      creator_id: user.id,
    })
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return mapCommunity(data as CommunityRow);
}

export async function uploadCommunityThumbnail(
  communityId: string,
  localUri: string,
): Promise<string | null> {
  try {
    const fileName = `${communityId}-${Date.now()}.jpg`;
    const filePath = `community-thumbnails/${fileName}`;

    const response = await fetch(localUri);
    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    const { error } = await supabase.storage
      .from('community-thumbnails')
      .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      return null;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('community-thumbnails').getPublicUrl(filePath);

    return publicUrl;
  } catch {
    return null;
  }
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
  options?: { limit?: number; before?: string },
): Promise<CommunityMessage[]> {
  const limit = options?.limit ?? 50;

  let query = supabase
    .from('community_messages')
    .select(
      'id, community_id, agent_user_id, content, is_autonomous, created_at, twin_name, avatar_icon',
    )
    .eq('community_id', communityId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options?.before !== undefined) {
    query = query.lt('created_at', options.before);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const rows = data as unknown as CommunityMessageRow[];
  return rows.reverse().map(mapMessage);
}
