// 아이디어 구현 버튼 컴포넌트
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, Rocket, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
  createImplementation,
  updateImplementation,
  deleteImplementation,
  getImplementationByIdea,
  type IdeaImplementation,
  type ImplementationStatus,
} from '@/services/implementationService';
import { uploadImageToImgur } from '@/services/imgurService';

interface ImplementationButtonProps {
  ideaId: string;
  onUpdate?: () => void;
}

export function ImplementationButton({ ideaId, onUpdate }: ImplementationButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingImplementation, setExistingImplementation] = useState<IdeaImplementation | null>(null);
  const [checking, setChecking] = useState(true);

  // 폼 상태
  const [implementationUrl, setImplementationUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ImplementationStatus>('planned');

  const { addToast } = useToast();

  // 기존 구현 사례 확인
  useEffect(() => {
    async function checkExisting() {
      try {
        const impl = await getImplementationByIdea(ideaId);
        setExistingImplementation(impl);
        if (impl) {
          setImplementationUrl(impl.implementation_url || '');
          setScreenshotUrl(impl.screenshot_url || '');
          setDescription(impl.description || '');
          setStatus(impl.status);
        }
      } catch (error) {
        console.error('구현 사례 확인 실패:', error);
      } finally {
        setChecking(false);
      }
    }

    if (ideaId) {
      checkExisting();
    }
  }, [ideaId]);

  async function handleSubmit() {
    if (!implementationUrl && !screenshotFile && !description) {
      addToast({
        title: '입력 필요',
        description: '최소한 하나의 정보는 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let finalScreenshotUrl = screenshotUrl;

      // 스크린샷 파일이 있으면 업로드
      if (screenshotFile) {
        try {
          finalScreenshotUrl = await uploadImageToImgur(screenshotFile);
          setScreenshotUrl(finalScreenshotUrl);
        } catch (error) {
          addToast({
            title: '이미지 업로드 실패',
            description: error instanceof Error ? error.message : '이미지 업로드 중 오류가 발생했습니다.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }
      }

      if (existingImplementation) {
        // 수정
        await updateImplementation(existingImplementation.id, {
          implementation_url: implementationUrl || undefined,
          screenshot_url: finalScreenshotUrl || undefined,
          description: description || undefined,
          status,
        });
        addToast({
          title: '수정 완료',
          description: '구현 사례가 수정되었습니다.',
          variant: 'success',
        });
      } else {
        // 생성
        await createImplementation({
          idea_id: ideaId,
          implementation_url: implementationUrl || undefined,
          screenshot_url: finalScreenshotUrl || undefined,
          description: description || undefined,
          status,
        });
        addToast({
          title: '등록 완료',
          description: '구현 사례가 등록되었습니다.',
          variant: 'success',
        });
      }

      setOpen(false);
      if (onUpdate) {
        onUpdate();
      }
      
      // 폼 초기화
      setScreenshotFile(null);
    } catch (error) {
      addToast({
        title: '오류 발생',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!existingImplementation) return;

    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    setLoading(true);

    try {
      await deleteImplementation(existingImplementation.id);
      addToast({
        title: '삭제 완료',
        description: '구현 사례가 삭제되었습니다.',
        variant: 'success',
      });
      setExistingImplementation(null);
      setImplementationUrl('');
      setScreenshotUrl('');
      setDescription('');
      setStatus('planned');
      setScreenshotFile(null);
      setOpen(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      addToast({
        title: '삭제 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setScreenshotFile(file);
      // 기존 URL은 유지 (새 파일이 업로드되면 교체됨)
    }
  }

  if (checking) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        확인 중...
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={existingImplementation ? "outline" : "default"}>
          {existingImplementation ? (
            <>
              <Edit className="mr-2 h-4 w-4" />
              구현 사례 수정
            </>
          ) : (
            <>
              <Rocket className="mr-2 h-4 w-4" />
              이 아이디어를 구현했어요!
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {existingImplementation ? '구현 사례 수정' : '구현 사례 등록'}
          </DialogTitle>
          <DialogDescription>
            아이디어를 실제로 구현하셨나요? 구현 사례를 공유해주세요!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 상태 선택 */}
          <div className="space-y-2">
            <Label htmlFor="status">구현 상태</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as ImplementationStatus)}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">계획 중</SelectItem>
                <SelectItem value="in_progress">진행 중</SelectItem>
                <SelectItem value="completed">완료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 구현 URL */}
          <div className="space-y-2">
            <Label htmlFor="implementation-url">구현 URL (선택사항)</Label>
            <Input
              id="implementation-url"
              type="url"
              placeholder="https://github.com/username/repo 또는 https://demo.example.com"
              value={implementationUrl}
              onChange={(e) => setImplementationUrl(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              GitHub 저장소, 데모 사이트, 배포된 앱 등의 URL을 입력하세요.
            </p>
          </div>

          {/* 스크린샷 */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">스크린샷 (선택사항)</Label>
            <Input
              id="screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            {screenshotUrl && !screenshotFile && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-2">현재 이미지:</p>
                <img
                  src={screenshotUrl}
                  alt="스크린샷"
                  className="max-w-full h-auto rounded-md border"
                />
              </div>
            )}
            {screenshotFile && (
              <p className="text-sm text-muted-foreground">
                새 이미지가 선택되었습니다: {screenshotFile.name}
              </p>
            )}
          </div>

          {/* 설명 */}
          <div className="space-y-2">
            <Label htmlFor="description">구현 설명 (선택사항)</Label>
            <Textarea
              id="description"
              placeholder="구현 과정, 사용한 기술 스택, 특별한 점 등을 자유롭게 작성해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <div>
            {existingImplementation && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              취소
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {existingImplementation ? '수정' : '등록'}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

