import type { PlaceListItem } from '../types/models';
import { escapeHtml } from '../ai-render';
import { safeImageUrl } from '../safe-url';

function getPlaceIcon(type: string): string {
  const map: Record<string, string> = {
    restaurant: '🍽️',
    cafe: '☕',
    store: '🛍️',
    park: '🌿',
    hotel: '🏨',
    hospital: '🏥',
    theater: '🎭',
    landmark: '🗼',
    temple: '⛩️',
    pharmacy: '💊',
  };
  return map[type] ?? '📍';
}

function formatRating(rating: number | null): string {
  if (!rating) return '';
  return `⭐ ${rating.toFixed(1)}`;
}

export function renderPlaceCard(place: PlaceListItem): string {
  const icon = getPlaceIcon(place.type);
  const rating = formatRating(place.average_star);
  const address = place.address?.address_title ?? place.address?.full_address ?? '';

  return `
    <div class="place-card" data-uid="${escapeHtml(place.uid)}" role="button" tabindex="0">
      ${place.thumbnail_image
        ? `<img class="place-card-image" src="${escapeHtml(safeImageUrl(place.thumbnail_image.image_url))}" alt="${escapeHtml(place.title)}" loading="lazy">`
        : `<div class="place-card-image-placeholder">${icon}</div>`
      }
      <div class="place-card-body">
        <div class="place-card-type">${escapeHtml(place.type_display_text)}${place.subtype_display_text ? ` · ${escapeHtml(place.subtype_display_text)}` : ''}</div>
        <div class="place-card-title">${escapeHtml(place.title)}</div>
        <div class="place-card-meta">
          ${rating ? `<span class="place-card-rating">${rating}</span>` : ''}
          ${address ? `<span>📍 ${escapeHtml(address)}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}

export function attachPlaceCardEvents(
  container: HTMLElement,
  onNavigate: (uid: string) => void
): void {
  container.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('[data-uid]') as HTMLElement | null;
    if (!card) return;
    const uid = card.dataset['uid'];
    if (uid) onNavigate(uid);
  });

  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = (e.target as HTMLElement).closest('[data-uid]') as HTMLElement | null;
    if (!card) return;
    const uid = card.dataset['uid'];
    if (uid) onNavigate(uid);
  });
}
