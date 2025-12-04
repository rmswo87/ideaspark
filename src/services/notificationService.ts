// 프리미엄 사용자 알림 서비스
// 최근 검색된 아이디어 중 점수가 높은 상위 3개를 요약하여 알림으로 전송

import { getTopScoredRecentIdeas } from './ideaScoringService';
import { isPremiumUser } from './premiumService';
import type { Idea } from './ideaService';
import type { IdeaScore } from './ideaScoringService';
import { aiClient } from './ai';

export interface IdeaNotification {
  idea: Idea;
  score: IdeaScore;
  summary: string; // AI가 생성한 요약
}

/**
 * 프리미엄 사용자에게 점수 높은 아이디어 3개 요약 알림 생성
 */
export async function generateIdeaNotifications(userId: string): Promise<IdeaNotification[]> {
  // 프리미엄 사용자 확인
  const isPremium = await isPremiumUser(userId);
  if (!isPremium) {
    throw new Error('프리미엄 사용자만 알림을 받을 수 있습니다.');
  }

  // 최근 검색된 아이디어 중 점수가 높은 상위 3개 조회
  const topIdeas = await getTopScoredRecentIdeas(3);

  if (topIdeas.length === 0) {
    return [];
  }

  // 각 아이디어에 대해 AI 요약 생성
  const notifications: IdeaNotification[] = [];

  for (const item of topIdeas) {
    try {
      const summary = await aiClient.summarizeIdeaForNotification(item.idea, item);
      notifications.push({
        idea: item.idea,
        score: item,
        summary,
      });
    } catch (error) {
      console.error(`Error generating summary for idea ${item.idea.id}:`, error);
      // 요약 생성 실패 시 기본 요약 사용
      notifications.push({
        idea: item.idea,
        score: item,
        summary: `${item.idea.title} - 총점 ${item.total_score}점 (비타민: ${item.vitamin_score}, 경쟁율: ${item.competition_score}, 섹시함: ${item.sexiness_score})`,
      });
    }
  }

  return notifications;
}

/**
 * 알림 메시지 포맷팅
 */
export function formatNotificationMessage(notifications: IdeaNotification[]): string {
  if (notifications.length === 0) {
    return '추천할 아이디어가 없습니다.';
  }

  let message = `🎯 점수 높은 아이디어 ${notifications.length}개를 발견했습니다!\n\n`;

  notifications.forEach((notification, index) => {
    const { idea, score } = notification;
    message += `${index + 1}. ${idea.title}\n`;
    message += `   총점: ${score.total_score}점 (비타민: ${score.vitamin_score}, 경쟁율: ${score.competition_score}, 섹시함: ${score.sexiness_score})\n`;
    message += `   ${notification.summary}\n\n`;
  });

  return message;
}
