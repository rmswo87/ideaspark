// 프로필 페이지
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, FileText, MessageSquare, Heart, Bookmark, Camera, Upload, MoreVertical, UserPlus, Ban, Trash2, UserIcon, CheckSquare, Square } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getFriends, getFriendRequests, acceptFriendRequest, deleteFriendRequest, getBlockedUsers, unblockUser, sendFriendRequest, getFriendStatus, blockUser } from '@/services/friendService';
import { getPRDs, deletePRD } from '@/services/prdService';
import { PRDViewer } from '@/components/PRDViewer';
import { getConversations, getConversation, sendMessage, markAsRead, deleteMessage, deleteConversation } from '@/services/messageService';
import { getBookmarkedPosts, getLikedPosts, getMyPosts } from '@/services/postService';
import { getMyComments } from '@/services/commentService';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { uploadAvatar } from '@/services/imageService';
import type { FriendRequest, Friend } from '@/services/friendService';
import type { Conversation, Message } from '@/services/messageService';
import type { Post } from '@/services/postService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useToast } from '@/components/ui/toast';

function ProfilePage() {
  const params = useParams<{ userId?: string }>();
  const urlUserId = params?.userId;
  const { user, loading } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  // URL에 userId가 있으면 해당 사용자의 프로필, 없으면 로그인한 사용자의 프로필
  const targetUserId = urlUserId || user?.id;
  const isOwnProfile = user?.id === targetUserId;
  const [activeTab, setActiveTab] = useState('stats');
  const scrollPositionRef = useRef<{ [key: string]: number }>({});
  const [stats, setStats] = useState({
    posts: 0,
    comments: 0,
    likes: 0,
    bookmarks: 0,
    prds: 0,
  });
  const [profile, setProfile] = useState<{ is_public: boolean; nickname?: string; bio?: string; avatar_url?: string } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [postsDialogOpen, setPostsDialogOpen] = useState(false);
  const [postsDialogType, setPostsDialogType] = useState<'my' | 'liked' | 'bookmarked'>('my');
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [commentsDialogOpen, setCommentsDialogOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
  const [prdsDialogOpen, setPrdsDialogOpen] = useState(false);
  const [prdsList, setPrdsList] = useState<any[]>([]);
  const [loadingPrds, setLoadingPrds] = useState(false);
  const [selectedPrd, setSelectedPrd] = useState<any | null>(null);
  const [donationCopied, setDonationCopied] = useState(false);
  const [donationShowQR, setDonationShowQR] = useState(false);
  const [donationQrError, setDonationQrError] = useState(false);
  const [previewPosts, setPreviewPosts] = useState<Post[]>([]);
  const [previewComments, setPreviewComments] = useState<any[]>([]);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending' | 'accepted' | 'blocked'>>({});
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [messageDialogUserId, setMessageDialogUserId] = useState<string | null>(null);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());
  const [isSelectMode, setIsSelectMode] = useState(false);
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

  const donationAccountNumber = '3333258583773';
  const donationBankName = '카카오뱅크';
  const donationAccountHolder = '자취만렙';
  // QR 코드 이미지는 public 폴더에 있으므로 루트 경로로 접근
  // Vite와 Vercel 모두에서 동작하도록 BASE_URL 활용
  const donationQrUrl = `${import.meta.env.BASE_URL || ''}QR.png`.replace(/\/\//g, '/');

  function getImageProxyBase() {
    return (
      import.meta.env.VITE_IMAGE_PROXY_BASE_URL ||
      (typeof window !== 'undefined' ? `${window.location.origin}/api/image-proxy` : '/api/image-proxy')
    );
  }

  function rewriteStorageUrl(src?: string) {
    if (!src || !SUPABASE_URL || !src.startsWith(SUPABASE_URL)) return src;
    const marker = '/storage/v1/object/public/';
    const idx = src.indexOf(marker);
    if (idx === -1) return src;
    const rest = src.substring(idx + marker.length);
    const [bucket, ...pathParts] = rest.split('/');
    const path = pathParts.join('/');
    const base = getImageProxyBase();
    return `${base}?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`;
  }