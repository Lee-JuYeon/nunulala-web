import { api } from '../api';
import { isLoggedIn } from '../auth';
import { showToast } from '../components/toast';
import { escapeHtml } from '../ai-render';
import type { Schedule } from '../types/models';

export async function renderSchedule(): Promise<void> {
  const content = document.getElementById('app-content');
  if (!content) return;

  if (!isLoggedIn()) {
    content.innerHTML = `
      <div class="state-container">
        <div class="state-icon">📅</div>
        <div class="state-title">로그인이 필요해요</div>
        <div class="state-desc">일정을 관리하려면 로그인해주세요</div>
        <a href="/app/login" class="btn btn-primary" style="margin-top:var(--space-4);">로그인하기</a>
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="schedule-toolbar">
      <div class="page-header">
        <div class="page-title">내 일정</div>
      </div>
      <button class="btn btn-primary btn-sm" id="add-schedule-btn">+ 새 일정</button>
    </div>
    <div id="schedule-form-area"></div>
    <div class="schedule-list" id="schedule-list">
      <div class="state-container"><div class="spinner"></div></div>
    </div>
  `;

  document.getElementById('add-schedule-btn')?.addEventListener('click', () => {
    showScheduleForm(null);
  });

  await loadSchedules();
}

async function loadSchedules(): Promise<void> {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  const res = await api.getSchedules();
  if (!res.success) {
    showToast('일정을 불러오지 못했습니다', 'error');
    list.innerHTML = `<div class="state-container"><div class="state-icon">😕</div><div class="state-title">일정을 불러올 수 없어요</div></div>`;
    return;
  }

  const schedules = res.data;

  if (schedules.length === 0) {
    list.innerHTML = `
      <div class="state-container">
        <div class="state-icon">📅</div>
        <div class="state-title">등록된 일정이 없어요</div>
        <div class="state-desc">새 일정을 추가해보세요</div>
      </div>
    `;
    return;
  }

  list.innerHTML = schedules.map(s => renderScheduleCard(s)).join('');
  attachScheduleListEvents(schedules);
}

function renderScheduleCard(schedule: Schedule): string {
  const date = new Date(schedule.d_day);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `
    <div class="schedule-card" data-uid="${schedule.uid}">
      <div class="schedule-card-date">
        <div class="schedule-card-date-month">${month}월</div>
        <div class="schedule-card-date-day">${day}</div>
      </div>
      <div class="schedule-card-info">
        <div class="schedule-card-title">${escapeHtml(schedule.title)}</div>
        ${schedule.memo ? `<div class="schedule-card-memo">${escapeHtml(schedule.memo)}</div>` : ''}
      </div>
      <div style="display:flex;gap:var(--space-2);margin-left:auto;">
        <button class="btn btn-sm btn-outline edit-schedule-btn" data-uid="${schedule.uid}">수정</button>
        <button class="btn btn-sm btn-danger delete-schedule-btn" data-uid="${schedule.uid}">삭제</button>
      </div>
    </div>
  `;
}

function attachScheduleListEvents(schedules: Schedule[]): void {
  const list = document.getElementById('schedule-list');
  if (!list) return;

  list.addEventListener('click', async (e) => {
    const el = e.target as HTMLElement;

    const editBtn = el.closest('.edit-schedule-btn') as HTMLElement | null;
    if (editBtn) {
      e.stopPropagation();
      const uid = editBtn.dataset['uid'] ?? '';
      const schedule = schedules.find(s => s.uid === uid);
      if (schedule) showScheduleForm(schedule);
      return;
    }

    const deleteBtn = el.closest('.delete-schedule-btn') as HTMLElement | null;
    if (deleteBtn) {
      e.stopPropagation();
      const uid = deleteBtn.dataset['uid'] ?? '';
      if (!confirm('일정을 삭제하시겠어요?')) return;
      const res = await api.deleteSchedule(uid);
      if (!res.success) { showToast('삭제에 실패했어요', 'error'); return; }
      showToast('일정이 삭제됐어요', 'success');
      await loadSchedules();
      return;
    }

    const card = el.closest('[data-uid]') as HTMLElement | null;
    if (card) {
      const uid = card.dataset['uid'] ?? '';
      await showScheduleDetail(uid);
    }
  });
}

function showScheduleForm(schedule: Schedule | null): void {
  const area = document.getElementById('schedule-form-area');
  if (!area) return;

  const todayStr = new Date().toISOString().slice(0, 10);

  area.innerHTML = `
    <div class="card" style="padding:var(--space-5);margin-bottom:var(--space-4);">
      <div class="modal-header">
        <div class="modal-title">${schedule ? '일정 수정' : '새 일정 추가'}</div>
        <button class="modal-close" id="close-schedule-form">✕</button>
      </div>
      <form id="schedule-form">
        <div class="form-group" style="margin-bottom:var(--space-4);">
          <label class="form-label" for="sched-title">제목</label>
          <input class="form-input" type="text" id="sched-title" value="${escapeHtml(schedule?.title ?? '')}" placeholder="일정 이름" required maxlength="100">
        </div>
        <div class="form-group" style="margin-bottom:var(--space-4);">
          <label class="form-label" for="sched-date">날짜</label>
          <input class="form-input" type="date" id="sched-date" value="${schedule?.d_day?.slice(0, 10) ?? todayStr}" required>
        </div>
        <div class="form-group" style="margin-bottom:var(--space-5);">
          <label class="form-label" for="sched-memo">메모 (선택)</label>
          <textarea class="form-input form-textarea" id="sched-memo" placeholder="메모를 입력하세요">${escapeHtml(schedule?.memo ?? '')}</textarea>
        </div>
        <div style="display:flex;gap:var(--space-3);">
          <button type="submit" class="btn btn-primary">${schedule ? '저장' : '추가'}</button>
          <button type="button" class="btn btn-secondary" id="cancel-schedule-form">취소</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('close-schedule-form')?.addEventListener('click', () => { area.innerHTML = ''; });
  document.getElementById('cancel-schedule-form')?.addEventListener('click', () => { area.innerHTML = ''; });

  const form = document.getElementById('schedule-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (document.getElementById('sched-title') as HTMLInputElement).value.trim();
    const d_day = (document.getElementById('sched-date') as HTMLInputElement).value;
    const memo = (document.getElementById('sched-memo') as HTMLTextAreaElement).value.trim();

    if (!title || !d_day) return;

    const res = schedule
      ? await api.updateSchedule(schedule.uid, { title, d_day, memo })
      : await api.createSchedule({ title, d_day, memo });

    if (!res.success) { showToast('저장에 실패했어요', 'error'); return; }
    showToast(schedule ? '일정이 수정됐어요' : '일정이 추가됐어요 📅', 'success');
    area.innerHTML = '';
    await loadSchedules();
  });
}

async function showScheduleDetail(uid: string): Promise<void> {
  const content = document.getElementById('app-content');
  if (!content) return;

  content.innerHTML = `
    <button class="back-btn" id="back-to-schedules">← 일정 목록</button>
    <div class="state-container"><div class="spinner"></div></div>
  `;

  document.getElementById('back-to-schedules')?.addEventListener('click', () => renderSchedule());

  const res = await api.getScheduleDetail(uid);
  if (!res.success) {
    showToast('일정을 불러오지 못했습니다', 'error');
    return;
  }

  const schedule = res.data;
  const date = new Date(schedule.d_day);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  content.innerHTML = `
    <button class="back-btn" id="back-to-schedules">← 일정 목록</button>
    <div class="place-detail-header" style="margin-bottom:var(--space-4);">
      <div class="place-detail-type">📅 ${dateStr}</div>
      <div class="place-detail-title">${escapeHtml(schedule.title)}</div>
      ${schedule.memo ? `<div style="font-size:var(--text-sm);color:var(--label-alternative);">${escapeHtml(schedule.memo)}</div>` : ''}
    </div>
    <div class="reviews-section">
      <div class="reviews-header">
        <div class="reviews-title">일정 장소 (${schedule.plans.length}개)</div>
      </div>
      <div class="schedule-detail-plans" id="plan-list">
        ${schedule.plans.length === 0
          ? `<div class="state-container"><div class="state-icon">🗺️</div><div class="state-title">등록된 장소가 없어요</div></div>`
          : schedule.plans.map((plan, i) => `
            <div class="plan-item">
              <div class="plan-item-number">${i + 1}</div>
              <div class="plan-item-info">
                <div class="plan-item-place">${escapeHtml(plan.place?.title ?? '장소 정보 없음')}</div>
                ${plan.memo ? `<div class="plan-item-memo">${escapeHtml(plan.memo)}</div>` : ''}
              </div>
            </div>
          `).join('')
        }
      </div>
    </div>
  `;

  document.getElementById('back-to-schedules')?.addEventListener('click', () => renderSchedule());
}
