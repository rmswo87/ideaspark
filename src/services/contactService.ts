// 문의 서비스
import { supabase } from '@/lib/supabase';

export interface ContactInquiry {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'replied' | 'closed';
  admin_notes?: string;
  replied_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * 문의 생성
 */
export async function createContactInquiry(data: {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<ContactInquiry> {
  const { data: inquiry, error } = await supabase
    .from('contact_inquiries')
    .insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating contact inquiry:', error);
    throw error;
  }

  return inquiry;
}

/**
 * 문의 목록 가져오기 (관리자만)
 */
export async function getContactInquiries(filters?: {
  status?: 'pending' | 'replied' | 'closed';
  limit?: number;
  offset?: number;
}): Promise<ContactInquiry[]> {
  let query = supabase
    .from('contact_inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching contact inquiries:', error);
    throw error;
  }

  return data || [];
}

/**
 * 문의 조회 (관리자만)
 */
export async function getContactInquiry(inquiryId: string): Promise<ContactInquiry | null> {
  const { data, error } = await supabase
    .from('contact_inquiries')
    .select('*')
    .eq('id', inquiryId)
    .single();

  if (error) {
    console.error('Error fetching contact inquiry:', error);
    return null;
  }

  return data;
}

/**
 * 문의 상태 업데이트 (관리자만)
 */
export async function updateContactInquiry(
  inquiryId: string,
  updates: {
    status?: 'pending' | 'replied' | 'closed';
    admin_notes?: string;
    replied_at?: string;
  }
): Promise<ContactInquiry> {
  const { data, error } = await supabase
    .from('contact_inquiries')
    .update(updates)
    .eq('id', inquiryId)
    .select()
    .single();

  if (error) {
    console.error('Error updating contact inquiry:', error);
    throw error;
  }

  return data;
}

/**
 * 문의 삭제 (관리자만)
 */
export async function deleteContactInquiry(inquiryId: string): Promise<void> {
  const { error } = await supabase
    .from('contact_inquiries')
    .delete()
    .eq('id', inquiryId);

  if (error) {
    console.error('Error deleting contact inquiry:', error);
    throw error;
  }
}
<<<<<<< HEAD

=======
>>>>>>> f2d051063a1deac18577154ea77dd273f0920568
