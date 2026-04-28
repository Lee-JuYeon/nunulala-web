function getPlaceIcon(type) {
    const map = {
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
function formatRating(rating) {
    if (!rating)
        return '';
    return `⭐ ${rating.toFixed(1)}`;
}
export function renderPlaceCard(place) {
    const icon = getPlaceIcon(place.type);
    const rating = formatRating(place.average_star);
    const address = place.address?.address_title ?? place.address?.full_address ?? '';
    return `
    <div class="place-card" data-uid="${place.uid}" role="button" tabindex="0">
      ${place.thumbnail_image
        ? `<img class="place-card-image" src="${place.thumbnail_image.image_url}" alt="${place.title}" loading="lazy">`
        : `<div class="place-card-image-placeholder">${icon}</div>`}
      <div class="place-card-body">
        <div class="place-card-type">${place.type_display_text}${place.subtype_display_text ? ` · ${place.subtype_display_text}` : ''}</div>
        <div class="place-card-title">${place.title}</div>
        <div class="place-card-meta">
          ${rating ? `<span class="place-card-rating">${rating}</span>` : ''}
          ${address ? `<span>📍 ${address}</span>` : ''}
        </div>
      </div>
    </div>
  `;
}
export function attachPlaceCardEvents(container, onNavigate) {
    container.addEventListener('click', (e) => {
        const card = e.target.closest('[data-uid]');
        if (!card)
            return;
        const uid = card.dataset['uid'];
        if (uid)
            onNavigate(uid);
    });
    container.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ')
            return;
        const card = e.target.closest('[data-uid]');
        if (!card)
            return;
        const uid = card.dataset['uid'];
        if (uid)
            onNavigate(uid);
    });
}
