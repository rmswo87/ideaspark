// 문의 관리 컴포넌트
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Eye, Check, X, Trash2, MessageSquare } from 'lucide-react';
import { getContactInquiries, getContactInquiry, updateContactInquiry, deleteContactInquiry, type ContactInquiry } from '@/services/contactService';

export function ContactManagement() {
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied' | 'closed'>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchInquiries();
  }, [statusFilter]);

  async function fetchInquiries() {
    setLoading(true);
    try {
      const data = await getContactInquiries({
        status: statusFilter === 'all' ? undefined : statusFilter,
        limit: 100,
      });
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(inquiryId: string, status: 'pending' | 'replied' | 'closed') {
    setUpdating(true);
    try {
      const updates: any = { status };
      if (status === 'replied' && !selectedInquiry?.replied_at) {
        updates.replied_at = new Date().toISOString();
      }
      if (adminNotes) {
        updates.admin_notes = adminNotes;
      }
      
      await updateContactInquiry(inquiryId, updates);
      await fetchInquiries();
      
      if (selectedInquiry?.id === inquiryId) {
        const updated = await getContactInquiry(inquiryId);
        if (updated) setSelectedInquiry(updated);
      }
      
      alert('상태가 업데이트되었습니다.');
    } catch (error: any) {
      alert('상태 업데이트에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(inquiryId: string) {
    if (!confirm('정말 이 문의를 삭제하시겠습니까?')) return;

    try {
      await deleteContactInquiry(inquiryId);
      await fetchInquiries();
      if (selectedInquiry?.id === inquiryId) {
        setSelectedInquiry(null);
      }
      alert('문의가 삭제되었습니다.');
    } catch (error: any) {
      alert('문의 삭제에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
    }
  }

  async function handleViewInquiry(inquiryId: string) {
    try {
      const inquiry = await getContactInquiry(inquiryId);
      if (inquiry) {
        setSelectedInquiry(inquiry);
        setAdminNotes(inquiry.admin_notes || '');
      }
    } catch (error) {
      console.error('Error fetching inquiry:', error);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">대기 중</Badge>;
      case 'replied':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">답변 완료</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">종료</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={(value: 'all' | 'pending' | 'replied' | 'closed') => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="상태 필터" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="pending">대기 중</SelectItem>
            <SelectItem value="replied">답변 완료</SelectItem>
            <SelectItem value="closed">종료</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-sm text-muted-foreground">
          총 {inquiries.length}개 문의
        </div>
      </div>

      {/* 문의 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">문의가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{inquiry.subject}</h3>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{inquiry.name} ({inquiry.email})</span>
                      </div>
                      {inquiry.company && (
                        <span>회사: {inquiry.company}</span>
                      )}
                      {inquiry.phone && (
                        <span>전화: {inquiry.phone}</span>
                      )}
                      <span>{formatDate(inquiry.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {inquiry.message}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInquiry(inquiry.id)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        상세 보기
                      </Button>
                      {inquiry.status !== 'replied' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'replied')}
                          disabled={updating}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          답변 완료
                        </Button>
                      )}
                      {inquiry.status !== 'closed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(inquiry.id, 'closed')}
                          disabled={updating}
                        >
                          <X className="h-4 w-4 mr-2" />
                          종료
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(inquiry.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 문의 상세 다이얼로그 */}
      {selectedInquiry && (
        <Dialog open={!!selectedInquiry} onOpenChange={(open) => !open && setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                문의 상세
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">제목</label>
                <p className="text-sm">{selectedInquiry.subject}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">작성자</label>
                <p className="text-sm">{selectedInquiry.name} ({selectedInquiry.email})</p>
                {selectedInquiry.company && (
                  <p className="text-sm text-muted-foreground">회사: {selectedInquiry.company}</p>
                )}
                {selectedInquiry.phone && (
                  <p className="text-sm text-muted-foreground">전화: {selectedInquiry.phone}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">내용</label>
                <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">
                  {selectedInquiry.message}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">상태</label>
                {getStatusBadge(selectedInquiry.status)}
              </div>
              {selectedInquiry.replied_at && (
                <div>
                  <label className="text-sm font-medium mb-1 block">답변 일시</label>
                  <p className="text-sm text-muted-foreground">{formatDate(selectedInquiry.replied_at)}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1 block">관리자 메모</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="관리자 메모를 입력하세요"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (adminNotes !== selectedInquiry.admin_notes) {
                      handleUpdateStatus(selectedInquiry.id, selectedInquiry.status);
                    }
                  }}
                  disabled={updating}
                >
                  메모 저장
                </Button>
                {selectedInquiry.status !== 'replied' && (
                  <Button
                    variant="default"
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'replied')}
                    disabled={updating}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    답변 완료로 표시
                  </Button>
                )}
                {selectedInquiry.status !== 'closed' && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(selectedInquiry.id, 'closed')}
                    disabled={updating}
                  >
                    <X className="h-4 w-4 mr-2" />
                    종료
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleDelete(selectedInquiry.id);
                    setSelectedInquiry(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  삭제
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


