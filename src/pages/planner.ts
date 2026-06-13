// [2026-06-08] AI 여행 플래너 채팅 페이지. iOS PlannerView 의 웹 대응(단발 POST, 멀티턴 세션 메모리).
// 세션: 첫 턴은 생략, 서버 반환 session 을 모듈변수에 보관해 다음 턴 재전송(빈 객체 전송 시 서버 500).
import { api } from '../api';
import { renderAssistant, escapeHtml } from '../ai-render';
import type { ChatSession } from '../types/ai';

let session: ChatSession | undefined;
let sending = false;

const GREETING =
  '안녕하세요! 서울 여행 도우미예요 😊 이렇게 물어봐 주세요:<br>· 장소 추천 (예: 성수동 감성 카페 추천)<br>· 근처 맛집 (예: 경복궁 근처 맛집)<br>· 여행 코스 (예: 친구랑 당일치기 코스)';

export function renderPlanner(): void {
  const content = document.getElementById('app-content');
  if (!content) return;
  session = undefined; // 페이지 진입 = 새 세션
  sending = false;

  content.innerHTML = `
    <section class="planner">
      <div class="planner-messages" id="planner-messages">
        ${assistantBubble(`<p>${GREETING}</p>`)}
      </div>
      <form class="planner-input" id="planner-form" autocomplete="off">
        <input id="planner-text" type="text" placeholder="무엇이든 물어보세요" aria-label="메시지 입력" />
        <button type="submit" id="planner-send" class="btn btn-primary">전송</button>
      </form>
      <p class="planner-disclaimer">AI 추천은 참고용입니다. 영업시간·예약은 꼭 확인하세요.</p>
    </section>
  `;

  const form = document.getElementById('planner-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    void send();
  });
  document.getElementById('planner-text')?.focus();
}

function userBubble(text: string): string {
  return `<div class="msg msg-user"><div class="bubble">${escapeHtml(text)}</div></div>`;
}
function assistantBubble(html: string): string {
  return `<div class="msg msg-assistant"><div class="bubble">${html}</div></div>`;
}
function typingBubble(): string {
  return `<div class="msg msg-assistant" id="planner-typing"><div class="bubble bubble-typing"><span></span><span></span><span></span></div></div>`;
}

function setSending(on: boolean): void {
  sending = on;
  const btn = document.getElementById('planner-send') as HTMLButtonElement | null;
  const input = document.getElementById('planner-text') as HTMLInputElement | null;
  if (btn) btn.disabled = on;
  if (input) input.disabled = on;
}
function removeTyping(): void {
  document.getElementById('planner-typing')?.remove();
}
function scrollToBottom(el: HTMLElement): void {
  el.scrollTop = el.scrollHeight;
}

async function send(): Promise<void> {
  if (sending) return;
  const input = document.getElementById('planner-text') as HTMLInputElement | null;
  const msgs = document.getElementById('planner-messages');
  if (!input || !msgs) return;
  const text = input.value.trim();
  if (!text) return;

  input.value = '';
  setSending(true);
  msgs.insertAdjacentHTML('beforeend', userBubble(text));
  msgs.insertAdjacentHTML('beforeend', typingBubble());
  scrollToBottom(msgs);

  try {
    const res = await api.aiChat(text, session);
    if (!res || !res.response) throw new Error('빈 응답');
    session = res.session; // 다음 턴 재전송용 보관
    removeTyping();
    msgs.insertAdjacentHTML('beforeend', assistantBubble(renderAssistant(res.response)));
  } catch {
    removeTyping();
    msgs.insertAdjacentHTML(
      'beforeend',
      assistantBubble('<p class="ai-error">앗, 연결에 문제가 생겼어요. 잠시 후 다시 시도해 주세요.</p>')
    );
  } finally {
    setSending(false);
    document.getElementById('planner-text')?.focus();
    scrollToBottom(msgs);
  }
}
